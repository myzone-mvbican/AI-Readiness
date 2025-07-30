import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layout/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Users,
  Plus,
  UserMinus,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Team, TeamMember, TeamsResponse } from "./types";
import { getColumns } from "./columns";

export default function AdminTeamsPage() {
  const { toast } = useToast();

  // State for table sorting and filtering (client-side)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // State for server-side pagination and search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // State for team management
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<number | null>(null);

  // Utility function to check if team can be hard deleted
  const canHardDelete = (team: Team & { memberCount: number }) => {
    return team.name.includes('(deleted)') && team.memberCount === 0;
  };

  // Fetch all teams with members
  const { data: teamsData, isLoading } = useQuery<TeamsResponse>({
    queryKey: ["/api/admin/teams", page, pageSize, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const res = await apiRequest("GET", `/api/admin/teams?${params}`);
      const data = await res.json();
      return {
        success: data.success,
        teams: data.teams,
        total: data.teams.length,
        page: page,
        totalPages: Math.ceil(data.teams.length / pageSize),
      };
    },
  });

  // Effect to update selectedTeam when teams data changes
  useEffect(() => {
    if (selectedTeam && teamsData?.teams) {
      const updatedTeam = teamsData.teams.find(team => team.id === selectedTeam.id);
      if (updatedTeam && JSON.stringify(updatedTeam) !== JSON.stringify(selectedTeam)) {
        setSelectedTeam(updatedTeam);
      }
    }
  }, [teamsData, selectedTeam]);

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/teams", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team created",
        description: "The team has been created successfully.",
      });
      setNewTeamName("");
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PUT", `/api/admin/teams/${id}`, { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team updated",
        description: "The team has been updated successfully.",
      });
      setEditingTeam(null);
      setEditTeamName("");
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/teams/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Restore team mutation
  const restoreTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/teams/${id}/restore`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team restored",
        description: "The team has been restored successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error restoring team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Hard delete team mutation (only for soft-deleted teams with zero members)
  const hardDeleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/teams/${id}/hard-delete`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setSelectedTeam(null); // Clear selection if the team was hard deleted
      toast({
        title: "Team permanently deleted",
        description: "The team has been permanently deleted from the system.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error permanently deleting team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove user from team mutation
  const removeUserMutation = useMutation({
    mutationFn: async ({
      teamId,
      userId,
    }: {
      teamId: number;
      userId: number;
    }) => {
      const res = await apiRequest(
        "DELETE",
        `/api/admin/teams/${teamId}/users/${userId}`,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "User removed",
        description: "The user has been removed from the team successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      teamId,
      userId,
      role,
    }: {
      teamId: number;
      userId: number;
      role: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/teams/${teamId}/users/${userId}/role`,
        { role },
      );
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all team-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      // Force a refetch to ensure immediate UI update
      queryClient.refetchQueries({ queryKey: ["/api/admin/teams"] }).then(() => {
        // Update selectedTeam with fresh data after refetch
        if (selectedTeam) {
          const freshTeamsData = queryClient.getQueryData(["/api/admin/teams"]) as TeamsResponse;
          const updatedTeam = freshTeamsData?.teams?.find(team => team.id === selectedTeam.id);
          if (updatedTeam) {
            setSelectedTeam(updatedTeam);
          }
        }
      });
      setUpdatingRoleUserId(null);
      toast({
        title: "Role updated",
        description: "The user's role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      setUpdatingRoleUserId(null);
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }
    createTeamMutation.mutate(newTeamName.trim());
  };

  // Handler functions
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setShowEditDialog(true);
  };

  const handleUpdateTeam = () => {
    if (!editingTeam || !editTeamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }
    updateTeamMutation.mutate({
      id: editingTeam.id,
      name: editTeamName.trim(),
    });
  };

  const handleDeleteTeam = (id: number) => {
    deleteTeamMutation.mutate(id);
  };

  const handleRestoreTeam = (id: number) => {
    restoreTeamMutation.mutate(id);
  };

  const handleHardDeleteTeam = (id: number) => {
    hardDeleteTeamMutation.mutate(id);
  };

  const handleViewMembers = (team: Team) => {
    setSelectedTeam(team);
    setShowMembersDialog(true);
  };

  const handleRemoveUser = (teamId: number, userId: number) => {
    removeUserMutation.mutate({ teamId, userId });
  };

  const handleUpdateRole = (teamId: number, userId: number, role: string) => {
    setUpdatingRoleUserId(userId);
    
    // Optimistic update: immediately update the selectedTeam state
    if (selectedTeam && selectedTeam.id === teamId) {
      const updatedMembers = selectedTeam.members.map(member => 
        member.id === userId ? { ...member, role } : member
      );
      setSelectedTeam({ ...selectedTeam, members: updatedMembers });
    }
    
    updateUserRoleMutation.mutate({ teamId, userId, role });
  };

  // Define columns with handlers
  const columns = getColumns({
    onEditTeam: handleEditTeam,
    onViewMembers: handleViewMembers,
    onDeleteTeam: handleDeleteTeam,
    onRestoreTeam: handleRestoreTeam,
    onHardDeleteTeam: handleHardDeleteTeam,
    canHardDelete,
  });

  // Get properly typed teams array
  const teams = teamsData?.teams || [];

  // Create the table
  const table = useReactTable({
    data: teams,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Pagination helpers
  const totalPages = teamsData?.totalPages || 1;
  const canPreviousPage = page > 1;
  const canNextPage = page < totalPages;

  // Server-side search with debounce
  const [searchInput, setSearchInput] = useState("");

  useMemo(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  return (
    <DashboardLayout title="Manage Teams">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-3">
          <div className="col-span-1">
            <div className="col-span-1 flex items-center space-x-2">
              <Users className="size-6 text-primary" />
              <h2 className="text-xl text-foreground font-semibold">
                Manage Teams
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              Manage teams and their members across the platform
            </p>
          </div>
          <div className="col-span-1 flex justify-end">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Create a new team to organize users and manage access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={createTeamMutation.isPending}
                  >
                    {createTeamMutation.isPending
                      ? "Creating..."
                      : "Create Team"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Page size:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative rounded-md border overflow-auto">
          <Table className="w-full whitespace-nowrap">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-foreground"
                  >
                    Loading teams...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-0 px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No teams found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server-side Pagination */}
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {teamsData && (
              <>
                Showing {(teamsData.page - 1) * pageSize + 1} to{" "}
                {Math.min(teamsData.page * pageSize, teamsData.total)} of{" "}
                {teamsData.total} teams
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!canPreviousPage || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground">
                Page {teamsData?.page || 1} of {teamsData?.totalPages || 1}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!canNextPage || isLoading}
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Edit Team Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update the team name and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTeamName">Team Name</Label>
                <Input
                  id="editTeamName"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTeam}
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team Members Dialog */}
        <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Team Members - {selectedTeam?.name}</DialogTitle>
              <DialogDescription>
                Manage team members and their roles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTeam?.members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="size-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No members</h3>
                  <p className="text-muted-foreground">
                    This team doesn't have any members yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTeam?.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">{member.name}</div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.company || "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            disabled={updatingRoleUserId === member.id}
                            onValueChange={(role) =>
                              handleUpdateRole(selectedTeam.id, member.id, role)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                              >
                                <UserMinus className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove member?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove {member.name} from the team.
                                  They will lose access to team resources.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemoveUser(selectedTeam.id, member.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove Member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowMembersDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
