import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, CheckCircle, Clock, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Assessment } from "./types";
import { Link } from "wouter";

interface GetColumnsProps {
  onViewAssessment?: (assessment: Assessment) => void;
}

// Format date for display
const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return "-";
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return format(date, "MMM d, yyyy");
  } catch (e) {
    return "Invalid date";
  }
};

// Format score for display
const formatScore = (score: number | null) => {
  if (score === null) return "-";
  return `${score}/100`;
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
      accessorKey: "surveyTemplateId",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Survey ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        // Access the survey template ID
        const surveyId = row.original.surveyTemplateId || "-";
        return <div className="text-muted-foreground">{surveyId}</div>;
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
          <div className="flex justify-end p-1">
            <Link href={`/dashboard/assessments/${assessment.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];
}
