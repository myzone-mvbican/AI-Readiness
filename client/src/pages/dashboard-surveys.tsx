import { DashboardLayout } from "@/components/layout/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";
import { Link } from "wouter";

// Sample data for assessments
const sampleAssessments = [
  {
    id: 1,
    name: "Q1 2025 Assessment",
    date: "Jan 15, 2025",
    status: "Completed",
    score: "72/100"
  },
  {
    id: 2,
    name: "Q2 2025 Assessment",
    date: "Apr 10, 2025",
    status: "In Progress",
    score: "-"
  }
];

export default function SurveysPage() {
  return (
    <DashboardLayout title="Assessments">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Your Assessments</h2>
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
                {sampleAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.name}</TableCell>
                    <TableCell>{assessment.date}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assessment.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {assessment.status}
                      </span>
                    </TableCell>
                    <TableCell>{assessment.score}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}