import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import SurveyEditDialog from "./survey-edit-dialog";
import SurveyDeleteDialog from "./survey-delete-dialog";

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
  teams?: {
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

  // Fetch teams to display team names in visibility column
  const { data: teamsData } = useQuery({
    queryKey: ["/api/admin/teams"],
    retry: false,
  });

  const teams: Team[] = teamsData?.teams || [];

  // Format the visibility information based on survey teams
  const formatVisibility = (survey: SurveyWithAuthor): string => {
    if (!survey.teams || survey.teams.length === 0) {
      return "Global (Everyone)";
    }

    if (survey.teams.length === 1) {
      return survey.teams[0].name;
    }

    return `${survey.teams.length} teams`;
  };

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
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey.id}>
                <TableCell className="font-medium text-foreground">
                  {survey.title}
                </TableCell>
                <TableCell className="text-foreground">
                  {survey.questionsCount}
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
                <TableCell className="text-foreground">
                  {formatDistanceToNow(new Date(survey.updatedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
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
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {survey.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {survey.author.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="space-x-3">
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
