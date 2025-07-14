"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown, 
  ShieldCheck,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils"; 
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
import { useAuth } from "@/hooks/use-auth"; 
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { TeamWithRole } from "@shared/types";
import { getInitials } from "@/lib/utils";

// Mock teams for initial development, will be replaced with real data
const defaultTeams: TeamWithRole[] = [
  {
    id: 2,
    name: "Client",
    role: "client",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

type TeamSwitcherProps = React.HTMLAttributes<HTMLDivElement>;

export function TeamSwitcher({}: TeamSwitcherProps) { 
  const { toast } = useToast();
  const { user } = useAuth(); 
  const { isMobile } = useSidebar();

  // Local state for selected team (fallback to first team if no team selected)
  const [selectedTeam, setSelectedTeam] = React.useState<TeamWithRole | null>(
    null,
  );

  // Get teams from API
  const { data: teams } = useQuery<{
    success: boolean;
    teams: TeamWithRole[];
  }>({
    queryKey: ["/api/teams"],
    enabled: !!user, // Only fetch if user is logged in
  });

  // Enhanced team selection logic:
  // 1. Load from localStorage on mount
  // 2. When teams are fetched, check if selected team is valid
  // 3. If no valid team is selected, select the first available team
  React.useEffect(() => {
    // Load team from localStorage on component mount
    const loadSavedTeam = () => {
      const savedTeam = localStorage.getItem("selectedTeam");
      let parsedSavedTeam = null;

      if (savedTeam) {
        try {
          parsedSavedTeam = JSON.parse(savedTeam);
          setSelectedTeam(parsedSavedTeam);
          return parsedSavedTeam;
        } catch (e) {
          localStorage.removeItem("selectedTeam"); // Clear invalid data
        }
      }
      return null;
    };

    // Initially try to load team
    const parsedSavedTeam = loadSavedTeam();

    // When teams are loaded, verify the selected team is valid
    if (teams?.teams?.length) {
      // Filter out deleted teams
      const activeTeams = teams.teams.filter(
        (team) => !team.name.includes("(deleted)"),
      );

      // Check if the saved team actually exists in the user's assigned teams and is not deleted
      const savedTeamExists =
        parsedSavedTeam &&
        activeTeams.some((team) => team.id === parsedSavedTeam.id);

      // If no valid team is selected, select the first available active team
      if (!savedTeamExists && activeTeams.length > 0) {
        setSelectedTeam(activeTeams[0]);
        localStorage.setItem("selectedTeam", JSON.stringify(activeTeams[0]));
      } else if (!savedTeamExists && activeTeams.length === 0) {
        // If no active teams, clear the selection
        setSelectedTeam(null);
        localStorage.removeItem("selectedTeam");
      }
    }

    // Listen for storage events from other tabs
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
        if (teams?.teams?.length) {
          setSelectedTeam(teams.teams[0]);
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
  }, [teams]); 

  // Only show teams that the user is assigned to, regardless of admin status
  // This prevents regular users switching to teams they're not part of
  // Admin users will only see their assigned teams in the switcher (not all teams)
  // Filter out deleted teams from the switcher
  const availableTeams = teams?.teams?.length
    ? teams.teams.filter((team) => !team.name.includes("(deleted)"))
    : defaultTeams;

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
            {availableTeams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onSelect={() => handleSelectTeam(team)}
                className="text-sm"
              >
                {team.role === "admin" ? (
                  <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" />
                ) : (
                  <Building className="mr-2 h-4 w-4" />
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
                    "ml-2 h-4 w-4",
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
