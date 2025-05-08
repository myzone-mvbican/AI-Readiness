import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Team, User, TeamsResponse } from "./types";

interface TeamManagementProps {
  user: User;
  currentUserId?: number;
  isAdmin: boolean;
}

export function TeamManagement({ user, currentUserId, isAdmin }: TeamManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [teamSearchValue, setTeamSearchValue] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  // Fetch all teams for team management
  const { data: teamsData, isLoading: isLoadingTeams } = useQuery<TeamsResponse>({
    queryKey: ["/api/admin/teams"],
    enabled: isAdmin,
  });

  // Update user teams mutation
  const updateUserTeamsMutation = useMutation({
    mutationFn: async ({ userId, teamIds }: { userId: number, teamIds: number[] }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/teams`, { teamIds });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Teams updated",
        description: "User team assignments have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Team update failed",
        description: error.message || "Failed to update user team assignments.",
        variant: "destructive",
      });
    },
  });

  // Handle toggling team assignment
  const handleToggleTeam = (userId: number, teamId: number, currentTeams: Team[]) => {
    const currentTeamIds = currentTeams.map(team => team.id);
    let newTeamIds: number[];
    
    if (currentTeamIds.includes(teamId)) {
      // Remove team if already assigned
      newTeamIds = currentTeamIds.filter(id => id !== teamId);
    } else {
      // Add team if not assigned
      newTeamIds = [...currentTeamIds, teamId];
    }
    
    updateUserTeamsMutation.mutate({ userId, teamIds: newTeamIds });
  };

  // Handle removing a team by clicking on the badge
  const handleRemoveTeam = (e: React.MouseEvent, teamId: number) => {
    e.stopPropagation();
    if (isCurrentUser) return;
    
    const currentTeamIds = user.teams.map(team => team.id);
    const newTeamIds = currentTeamIds.filter(id => id !== teamId);
    updateUserTeamsMutation.mutate({ userId: user.id, teamIds: newTeamIds });
  };

  // Get properly typed teams array
  const teams = teamsData?.teams || [];
  
  // Filtered teams based on search
  const filteredTeams = teams.filter((team) => 
    team.name.toLowerCase().includes(teamSearchValue.toLowerCase())
  );

  // Check if this is the current user
  const isCurrentUser = currentUserId === user.id;

  // Handle input change without closing popover
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setTeamSearchValue(e.target.value);
  };

  // Handle checkbox change without closing popover
  const handleCheckboxChange = (userId: number, teamId: number, currentTeams: Team[]) => {
    handleToggleTeam(userId, teamId, currentTeams);
  };

  // If no teams assigned, show "No teams" text
  if (user.teams.length === 0) {
    return (
      <div 
        className="flex flex-wrap gap-1 items-center w-full h-full cursor-pointer" 
        onClick={(e) => {
          if (!isCurrentUser) {
            e.preventDefault();
            setIsPopoverOpen(true);
          }
        }}
      >
        <span className="text-sm text-muted-foreground">No teams</span>
        {!isCurrentUser && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger className="sr-only">
              <span>Manage Teams</span>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" ref={popoverContentRef}>
              <div className="p-4 border-b">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium">Manage Teams</h4>
                </div>
                <div className="mt-2">
                  <Input
                    placeholder="Search teams..."
                    value={teamSearchValue}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              <div className="max-h-[250px] overflow-y-auto">
                {isLoadingTeams ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : (
                  filteredTeams.map((team) => {
                    const isAssigned = user.teams.some(
                      (t) => t.id === team.id
                    );
                    return (
                      <div
                        key={team.id}
                        className="flex items-center justify-between px-4 py-2 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-sm">{team.name}</span>
                        <Checkbox
                          checked={isAssigned}
                          onCheckedChange={() => handleCheckboxChange(user.id, team.id, user.teams)}
                        />
                      </div>
                    );
                  })
                )}
                
                {!isLoadingTeams && filteredTeams.length === 0 && (
                  <div className="text-center p-4 text-sm text-muted-foreground">
                    No teams found.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <div 
      className="flex flex-wrap gap-1 items-center w-full h-full cursor-pointer" 
      onClick={(e) => {
        if (!isCurrentUser) {
          e.preventDefault();
          setIsPopoverOpen(true);
        }
      }}
    >
      {user.teams.map(team => (
        <TooltipProvider key={team.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs"
                onClick={(e) => handleRemoveTeam(e, team.id)}
              >
                {team.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to remove</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {!isCurrentUser && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger className="sr-only">
            <span>Manage Teams</span>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end" ref={popoverContentRef}>
            <div className="p-4 border-b">
              <div className="flex items-center">
                <h4 className="text-sm font-medium">Manage Teams</h4>
              </div>
              <div className="mt-2">
                <Input
                  placeholder="Search teams..."
                  value={teamSearchValue}
                  onChange={handleInputChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="max-h-[250px] overflow-y-auto">
              {isLoadingTeams ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                filteredTeams.map((team) => {
                  const isAssigned = user.teams.some(
                    (t) => t.id === team.id
                  );
                  return (
                    <div
                      key={team.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm">{team.name}</span>
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={() => handleCheckboxChange(user.id, team.id, user.teams)}
                      />
                    </div>
                  );
                })
              )}
              
              {!isLoadingTeams && filteredTeams.length === 0 && (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  No teams found.
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}