"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  ShieldCheck,
  Building,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { TeamsResponse, TeamWithRole } from "@shared/types";
import { getInitials } from "@/lib/utils";

// Mock teams for initial development, will be replaced with real data
const defaultTeams: TeamWithRole[] = [
  {
    id: 2,
    name: "Client",
    role: "client",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

type TeamSwitcherProps = React.HTMLAttributes<HTMLDivElement>;

export function TeamSwitcher({ }: TeamSwitcherProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMobile } = useSidebar();

  const [activeTeams, setActiveTeams] = React.useState<TeamWithRole[]>([]);
  const [selectedTeam, setSelectedTeam] = React.useState<TeamWithRole | null>(
    null,
  );

  // Get teams from API
  const { data: teamsResponse } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teams");
      const data = await res.json();
      return data || {};
    },
    select: (data) => data.data || [],
    enabled: !!user, // Only fetch if user is logged in
  });

  // Load saved team from localStorage on component mount
  React.useEffect(() => {
    const loadSavedTeam = () => {
      const savedTeam = localStorage.getItem("selectedTeam");
      if (savedTeam) {
        try {
          const parsedSavedTeam = JSON.parse(savedTeam);
          setSelectedTeam(parsedSavedTeam);
          return parsedSavedTeam;
        } catch (e) {
          localStorage.removeItem("selectedTeam"); // Clear invalid data
        }
      }
      return null;
    };

    // Load team from localStorage immediately on mount
    loadSavedTeam();
  }, []); // Empty dependency array - only run on mount

  // Handle teams data and validate selected team
  React.useEffect(() => {
    if (teamsResponse?.length) {
      // Filter out deleted teams
      const activeTeams = teamsResponse.filter((team: TeamWithRole) => !team?.deletedAt);
      setActiveTeams(activeTeams);

      // Only validate and potentially change selection if we don't have a selected team yet
      // or if the current selected team is not in the active teams
      setSelectedTeam(prevSelectedTeam => {
        // If no team is selected, select the first available team
        if (!prevSelectedTeam && activeTeams.length > 0) {
          const firstTeam = activeTeams[0] as TeamWithRole;
          localStorage.setItem("selectedTeam", JSON.stringify(firstTeam));
          return firstTeam;
        }

        // If a team is selected, check if it still exists in active teams
        if (prevSelectedTeam) {
          const selectedTeamExists = activeTeams.some((team: TeamWithRole) => team.id === prevSelectedTeam.id);
          
          if (selectedTeamExists) {
            // Selected team is still valid, keep it
            return prevSelectedTeam;
          } else if (activeTeams.length > 0) {
            // Selected team is no longer valid, select the first available team
            const firstTeam = activeTeams[0] as TeamWithRole;
            localStorage.setItem("selectedTeam", JSON.stringify(firstTeam));
            return firstTeam;
          } else {
            // No active teams available, clear selection
            localStorage.removeItem("selectedTeam");
            return null;
          }
        }

        // No teams available and no previous selection
        if (activeTeams.length === 0) {
          localStorage.removeItem("selectedTeam");
          return null;
        }

        return prevSelectedTeam;
      });
    }
  }, [teamsResponse]); // Only depend on teamsResponse, not selectedTeam

  // Listen for storage events from other tabs
  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "selectedTeam" && event.newValue !== null) {
        try {
          const newTeam = JSON.parse(event.newValue);
          setSelectedTeam(newTeam);
        } catch (e) {
          console.error("Error parsing team from storage event:", e);
        }
      } else if (event.key === "selectedTeam" && event.newValue === null) {
        // If team was removed, try to select first available team
        if (activeTeams.length > 0) {
          setSelectedTeam(activeTeams[0]);
        } else {
          setSelectedTeam(null);
        }
      }
    };

    // Add storage event listener
    window.addEventListener("storage", handleStorageChange);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [activeTeams]);

  const handleSelectTeam = (team: TeamWithRole) => {
    // Check if we're switching to a different team
    const isTeamChange = selectedTeam?.id !== team.id;

    // Update local state
    setSelectedTeam(team);

    // Just store selected team in localStorage
    // The token check happens when teams are loaded in assessment-create-modal
    localStorage.setItem("selectedTeam", JSON.stringify(team));

    // If actually changing teams, clear all survey-related queries to prevent stale data
    if (isTeamChange) {
      // Invalidate all survey-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });

      // Clear assessments data too
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });

      // Show a toast to confirm team change
      toast({
        title: "Team changed",
        description: `Switched to ${team.name}`,
      });
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {getInitials(selectedTeam?.name || "T")}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedTeam?.name}
                </span>
                <span className="truncate text-xs">{selectedTeam?.role}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {activeTeams.map((team: TeamWithRole) => (
              <DropdownMenuItem
                key={team.id}
                onSelect={() => handleSelectTeam(team)}
                className="text-sm"
              >
                {team.role === "admin" ? (
                  <ShieldCheck className="size-4 text-blue-500" />
                ) : (
                  <Building className="size-4" />
                )}
                <span className="flex flex-1 items-center justify-between">
                  <span>{team.name}</span>
                  {team.role === "admin" && (
                    <span className="ml-2 rounded-sm bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      Admin
                    </span>
                  )}
                </span>
                <Check
                  className={cn(
                    "size-4",
                    selectedTeam?.id === team.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
