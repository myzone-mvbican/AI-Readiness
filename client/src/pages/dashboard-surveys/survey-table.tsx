import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import SurveyEditDialog from "./survey-edit-dialog";
import SurveyDeleteDialog from "./survey-delete-dialog";
import { SurveyWithAuthor } from "@shared/types";

// Kept for reference but using the shared type instead
type LocalSurveyWithAuthor = {
  id: number;
  title: string;
  questionsCount: number;
  fileReference: string;
  status: string;
  teamId: number | null;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email: string;
  };
  teams: {
    id: number;
    name: string;
  }[];
};

export type Team = {
  id: number;
  name: string;
};

interface SurveyTableProps {
  surveys: SurveyWithAuthor[];
}

export default function SurveyTable({ surveys }: SurveyTableProps) {
  const { user } = useAuth();
  const [currentSurvey, setCurrentSurvey] = useState<SurveyWithAuthor | null>(
    null,
  );
  const [editSurveyOpen, setEditSurveyOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check if the current user is the author of a survey
  const isAuthor = (survey: SurveyWithAuthor) => {
    return user?.id === survey.authorId;
  };

  // Open the edit dialog for a survey
  const handleEditSurvey = (survey: SurveyWithAuthor) => {
    setCurrentSurvey(survey);
    setEditSurveyOpen(true);
  };

  // Open the delete confirmation dialog for a survey
  const handleDeleteClick = (survey: SurveyWithAuthor) => {
    setCurrentSurvey(survey);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Questions #</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey.id}>
                <TableCell className="font-medium text-foreground">
                  <span>{survey.title}</span>
                </TableCell>
                <TableCell className="py-1 text-foreground">
                  <span>{survey.questionsCount}</span>
                </TableCell>
                <TableCell className="py-1 text-foreground">
                  {formatDistanceToNow(new Date(survey.updatedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="py-1 text-foreground">
                  {!survey.teams || survey.teams.length === 0 ? (
                    <Badge variant="outline">Global (Everyone)</Badge>
                  ) : survey.teams.length === 1 ? (
                    <Badge variant="secondary">{survey.teams[0].name}</Badge>
                  ) : survey.teams.length > 1 ? (
                    <div className="flex gap-2">
                      {survey.teams.map((team) => (
                        <Badge key={team.id} variant="secondary">
                          {team.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline">Global (Everyone)</Badge>
                  )}
                </TableCell>
                <TableCell className="py-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {survey.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {survey.author.email}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      survey.status === "public" ? "default" : "secondary"
                    }
                  >
                    {survey.status === "public" ? "Public" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="py-1">
                  <div className="flex justify-end p-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4 dark:text-white" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditSurvey(survey)}
                          disabled={!isAuthor(survey)}
                          title={
                            isAuthor(survey)
                              ? "Edit survey"
                              : "Only the author can edit"
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(survey)}
                          disabled={!isAuthor(survey)}
                          title={
                            isAuthor(survey)
                              ? "Delete survey"
                              : "Only the author can delete"
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Survey Dialog */}
      {currentSurvey && (
        <SurveyEditDialog
          open={editSurveyOpen}
          onOpenChange={setEditSurveyOpen}
          survey={currentSurvey}
        />
      )}

      {/* Delete Survey Dialog */}
      {currentSurvey && (
        <SurveyDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          survey={currentSurvey}
        />
      )}
    </>
  );
}
