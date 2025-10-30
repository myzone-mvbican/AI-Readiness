import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  CheckCircle,
  Clock,
  Edit3,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Assessment } from "./types";
import { Link } from "wouter";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface GetColumnsProps {
  onViewAssessment?: (assessment: Assessment) => void;
}

// Delete button component with confirmation modal
const DeleteAssessmentButton = ({ assessment }: { assessment: Assessment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/assessments/${assessmentId}`,
        {},
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete assessment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment deleted",
        description: "The assessment has been deleted successfully.",
      });
      // Invalidate and refetch assessments list
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      // Invalidate completion status to update survey availability
      queryClient.invalidateQueries({
        queryKey: ["/api/surveys/completion-status"],
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{assessment.title}"? This action
            cannot be undone and will permanently remove all assessment data and
            results.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate(assessment.id)}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Format score for display
const formatScore = (score: number | null) => {
  if (score === null) return "-";
  return `${score / 10}/10`;
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "in-progress":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1"
        >
          <Clock className="h-3 w-3" />
          In Progress
        </Badge>
      );
    case "draft":
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1"
        >
          <Edit3 className="h-3 w-3" />
          Draft
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 border-gray-300"
        >
          {status}
        </Badge>
      );
  }
};

export function getColumns({
  onViewAssessment,
}: GetColumnsProps = {}): ColumnDef<Assessment>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2"
          >
            Assessment Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="p-2 dark:text-white">{row.original.title}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Date Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </div>
        );
      },
    },
    {
      accessorKey: "completedOn",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
          className="-ml-4"
        >
          Date Completed
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground">
            {formatDate(row.original.completedOn)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground">
            {formatScore(row.original.score)}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const assessment = row.original;

        return (
          <div className="flex justify-end gap-1 p-1">
            <Link href={`/dashboard/assessments/${assessment.id}`} asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5 dark:text-muted-foreground" />
              </Button>
            </Link>
            <DeleteAssessmentButton assessment={assessment} />
          </div>
        );
      },
    },
  ];
}
