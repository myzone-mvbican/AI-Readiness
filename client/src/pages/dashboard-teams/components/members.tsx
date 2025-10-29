import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserMinus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 
import { Team } from "../types";

interface MembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTeam: Team | null;
  updatingRoleUserId: number | null;
  onUpdateRole: (teamId: number, userId: number, role: string) => void;
  onRemoveUser: (teamId: number, userId: number) => void;
}

export function MembersDialog({
  open,
  onOpenChange,
  selectedTeam,
  updatingRoleUserId,
  onUpdateRole,
  onRemoveUser,
}: MembersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Team Members - {selectedTeam?.name}</DialogTitle>
          <DialogDescription>
            Manage team members and their roles.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full border border-border rounded-lg">
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
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Member</TableHead>
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
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </TableCell>
                        <TableCell>{member.company || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          disabled={updatingRoleUserId === member.id}
                          onValueChange={(role) =>
                            onUpdateRole(selectedTeam.id, member.id, role)
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
                                  onRemoveUser(selectedTeam.id, member.id)
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
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
