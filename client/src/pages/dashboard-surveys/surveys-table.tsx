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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { EditSurveyDialog } from "./edit-survey-dialog";
import { DeleteSurveyDialog } from "./delete-survey-dialog";
import { formatDistanceToNow } from "date-fns";

export type SurveyWithAuthor = {
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
};

interface SurveysTableProps {
  surveys: SurveyWithAuthor[];
}

export function SurveysTable({ surveys }: SurveysTableProps) {
  const { user } = useAuth();
  const [currentSurvey, setCurrentSurvey] = useState<SurveyWithAuthor | null>(null);
  const [editSurveyOpen, setEditSurveyOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check if the current user is the author of a survey
  const isAuthor = (survey: SurveyWithAuthor) => {
    return user?.id === survey.authorId;
  };

  // Handle editing a survey
  const handleEditSurvey = (survey: SurveyWithAuthor) => {
    setCurrentSurvey(survey);
    setEditSurveyOpen(true);
  };

  // Handle deleting a survey
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
              <TableHead>Questions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey.id}>
                <TableCell className="font-medium">{survey.title}</TableCell>
                <TableCell>{survey.questionsCount}</TableCell>
                <TableCell>
                  <Badge
                    variant={survey.status === "public" ? "default" : "secondary"}
                  >
                    {survey.status === "public" ? "Public" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(survey.updatedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      survey.teamId === null ? "outline" : "secondary"
                    }
                  >
                    {survey.teamId === null ? "Global" : "Team-only"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {survey.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {survey.author.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditSurvey(survey)}
                    disabled={!isAuthor(survey)}
                    title={
                      isAuthor(survey)
                        ? "Edit survey"
                        : "Only the author can edit"
                    }
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(survey)}
                    disabled={!isAuthor(survey)}
                    title={
                      isAuthor(survey)
                        ? "Delete survey"
                        : "Only the author can delete"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Survey Dialog */}
      {currentSurvey && (
        <EditSurveyDialog 
          open={editSurveyOpen} 
          onOpenChange={setEditSurveyOpen}
          survey={currentSurvey}
        />
      )}

      {/* Delete Survey Dialog */}
      {currentSurvey && (
        <DeleteSurveyDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          survey={currentSurvey}
        />
      )}
    </>
  );
}