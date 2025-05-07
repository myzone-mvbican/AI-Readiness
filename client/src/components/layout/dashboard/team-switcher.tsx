"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { TeamWithRole } from "@shared/schema";

// Mock teams for initial development, will be replaced with real data
const defaultTeams: TeamWithRole[] = [
  {
    id: 1,
    name: "Client",
    role: "client",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Admin",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

type TeamSwitcherProps = React.HTMLAttributes<HTMLDivElement>;

export function TeamSwitcher({ className }: TeamSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Local state for selected team (fallback to first team if no team selected)
  const [selectedTeam, setSelectedTeam] = React.useState<TeamWithRole | null>(
    null,
  );

  // Get teams from API
  const { data: teams, isLoading } = useQuery<{
    success: boolean;
    teams: TeamWithRole[];
  }>({
    queryKey: ["/api/teams"],
    enabled: !!user, // Only fetch if user is logged in
  });

  // For admin users, get all teams in the system
  const isAdmin = user?.role === "admin";
  const { data: adminTeams, isLoading: isLoadingAdminTeams } = useQuery<{
    success: boolean;
    teams: TeamWithRole[];
  }>({
    queryKey: ["/api/admin/teams"],
    enabled: !!user && isAdmin, // Only fetch if user is admin
  });

  // Set initial selected team when teams load
  React.useEffect(() => {
    if (teams?.teams?.length && !selectedTeam) {
      setSelectedTeam(teams.teams[0]);
      // Store in local storage
      localStorage.setItem("selectedTeam", JSON.stringify(teams.teams[0]));
    }
  }, [teams, selectedTeam]);

  // Load selected team from local storage on mount
  React.useEffect(() => {
    const savedTeam = localStorage.getItem("selectedTeam");
    if (savedTeam) {
      try {
        setSelectedTeam(JSON.parse(savedTeam));
      } catch (e) {
        console.error("Error parsing saved team:", e);
      }
    }
  }, []);

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Team name required",
        description: "Please enter a team name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/teams", {
        name: newTeamName,
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Team created",
          description: `${newTeamName} has been created successfully`,
        });
        setNewTeamName("");
        setShowNewTeamDialog(false);
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      } else {
        toast({
          title: "Failed to create team",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create team",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Only show teams that the user is assigned to, regardless of admin status
  // This prevents regular users switching to teams they're not part of
  // Admin users will only see their assigned teams in the switcher (not all teams)
  const availableTeams = teams?.teams?.length ? teams.teams : defaultTeams;

  const handleSelectTeam = (team: TeamWithRole) => {
    setSelectedTeam(team);
    setOpen(false);
    // Store selected team in localStorage
    localStorage.setItem("selectedTeam", JSON.stringify(team));
  };

  // Enable team creation if:
  // 1. User has admin role in at least one team OR
  // 2. User's email is in the ADMIN_EMAILS list (determined by user.role)
  const hasAdminRole =
    user?.role === "admin" ||
    teams?.teams?.some((team) => team.role === "admin") ||
    false;

  // Determine if the team switcher should be disabled (single team)
  const singleTeam = availableTeams.length <= 1;

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover
        open={singleTeam ? false : open}
        onOpenChange={!singleTeam ? setOpen : undefined}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={cn("w-full justify-between", className)}
          >
            {selectedTeam?.role === "admin" ? (
              <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" />
            ) : (
              <Briefcase className="mr-2 h-4 w-4" />
            )}
            <span className="flex-1 truncate text-left">
              {selectedTeam?.name || "Select team"}
            </span>
            {!singleTeam && (
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search team..." />
              <CommandEmpty>No team found.</CommandEmpty>
              <CommandGroup heading="Teams">
                {availableTeams.map((team) => (
                  <CommandItem
                    key={team.id}
                    onSelect={() => handleSelectTeam(team)}
                    className="text-sm"
                  >
                    {team.role === "admin" ? (
                      <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" />
                    ) : (
                      <Briefcase className="mr-2 h-4 w-4" />
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
                        selectedTeam?.id === team.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandList>
              <CommandSeparator />
              <CommandGroup>
                {hasAdminRole && (
                  <DialogTrigger asChild>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setShowNewTeamDialog(true);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Team
                    </CommandItem>
                  </DialogTrigger>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Add a new team to manage projects and members.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team name</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
            Cancel
          </Button>
          <Button onClick={createTeam}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
