import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, 
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Assessment } from "@shared/schema";

interface AssessmentsResponse {
  success: boolean;
  assessments: Assessment[];
}

export default function AssessmentsPage() {
  // Fetch assessments from the API
  const { data, isLoading, error } = useQuery<AssessmentsResponse>({
    queryKey: ['/api/assessments'],
    staleTime: 1000 * 60, // 1 minute
  });
  
  const assessments = data?.assessments || [];
  
  // Format assessment status for display
  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format score for display
  const formatScore = (score: number | null) => {
    if (score === null) return '-';
    return `${score}/100`;
  };
  
  // Function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Assessments">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight dark:text-white">
            Your Assessments
          </h2>
          <Link href="/dashboard/assessments/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Assessment History
            </CardTitle>
            <CardDescription>
              View all your completed and in-progress AI readiness assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="text-center py-8 text-red-500">
                <p>Failed to load assessments. Please try again.</p>
              </div>
            ) : assessments.length === 0 ? (
              // Empty state
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven't created any assessments yet.</p>
                <p className="mt-2">
                  Click the "New Assessment" button to get started.
                </p>
              </div>
            ) : (
              // Assessments table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">
                        {assessment.title}
                      </TableCell>
                      <TableCell>{formatDate(assessment.createdAt)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(assessment.status)}`}
                        >
                          {formatStatus(assessment.status)}
                        </span>
                      </TableCell>
                      <TableCell>{formatScore(assessment.score)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/assessments/${assessment.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
