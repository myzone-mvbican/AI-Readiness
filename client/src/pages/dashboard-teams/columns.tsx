import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Edit, Eye, Trash2, Crown, RotateCcw } from "lucide-react";
import { Team } from "./types";

interface ColumnProps {
  onEditTeam: (team: Team) => void;
  onViewMembers: (team: Team) => void;
  onDeleteTeam: (teamId: number) => void;
  onRestoreTeam: (teamId: number) => void;
}

export const getColumns = ({
  onEditTeam,
  onViewMembers,
  onDeleteTeam,
  onRestoreTeam,
}: ColumnProps): ColumnDef<Team>[] => [
  {
    accessorKey: "name",
    header: "Team Name",
    cell: ({ row }) => {
      const team = row.original;
      const isDeleted = team.name.includes('(deleted)');
      return (
        <div className="flex items-center gap-2">
          <div className={`font-medium ${isDeleted ? 'text-muted-foreground line-through' : ''}`}>
            {team.name}
          </div>
          {!isDeleted && team.members.some(m => m.role === 'admin') && (
            <Crown className="h-4 w-4 text-yellow-500" title="Has admin" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "memberCount",
    header: "Members",
    cell: ({ row }) => {
      const count = row.getValue("memberCount") as number;
      return (
        <Badge variant="secondary">
          {count} member{count !== 1 ? 's' : ''}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string);
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt") as string);
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const team = row.original;
      const isDeleted = team.name.includes('(deleted)');

      return (
        <div className="text-right py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => onViewMembers(team)}>
                    <Eye className="mr-2 size-4" />
                    View Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditTeam(team)}>
                    <Edit className="mr-2 size-4" />
                    Edit Team
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete Team
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will soft-delete the team "{team.name}". This action can be undone by restoring the team.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteTeam(team.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Team
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {isDeleted && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-green-600 focus:text-green-600"
                    >
                      <RotateCcw className="mr-2 size-4" />
                      Restore Team
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restore Team?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will restore the team "{team.name}" and make it active again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRestoreTeam(team.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Restore Team
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];