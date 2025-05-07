import { DashboardLayout } from "@/components/layout/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Eye, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Assessment {
  id: number;
  name: string;
  status: "In progress" | "Done";
  score: number;
  industryAvg: number;
  dateCompleted: string;
}

export default function DashboardAssessments() {
  const assessments: Assessment[] = [
    {
      id: 1,
      name: "Q1 2025 Assessment",
      status: "Done",
      score: 78,
      industryAvg: 81,
      dateCompleted: "Apr 25, 2025",
    },
    {
      id: 2,
      name: "Q4 2024 Assessment",
      status: "Done",
      score: 72,
      industryAvg: 78,
      dateCompleted: "Dec 12, 2024",
    },
    {
      id: 3,
      name: "Q3 2024 Assessment",
      status: "Done",
      score: 65,
      industryAvg: 75,
      dateCompleted: "Sep 08, 2024",
    },
    {
      id: 4,
      name: "Q2 2024 Assessment",
      status: "Done",
      score: 58,
      industryAvg: 72,
      dateCompleted: "Jun 15, 2024",
    },
    {
      id: 5,
      name: "Initial Assessment",
      status: "Done",
      score: 42,
      industryAvg: 70,
      dateCompleted: "Mar 21, 2024",
    },
  ];

  return (
    <DashboardLayout title="Assessments">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your AI readiness assessments
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score vs Industry Avg</TableHead>
                <TableHead>Date Completed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    {assessment.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        assessment.status === "Done" ? "default" : "outline"
                      }
                      className={
                        assessment.status === "Done"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {assessment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-medium">{assessment.score}</span>
                      <span className="text-muted-foreground mx-1">vs</span>
                      <span className="text-muted-foreground">
                        {assessment.industryAvg}
                      </span>

                      {assessment.score < assessment.industryAvg ? (
                        <span className="ml-2 text-red-500">↓</span>
                      ) : (
                        <span className="ml-2 text-green-500">↑</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{assessment.dateCompleted}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <DownloadCloud className="mr-2 h-4 w-4" />
                          <span>Download PDF</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
