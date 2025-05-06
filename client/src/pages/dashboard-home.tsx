import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3, ClipboardCheck, PlusCircle, TrendingUp } from "lucide-react";

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back to your AI Readiness Dashboard!</h1>
          <p className="text-muted-foreground mt-2">
            Track your organization's AI journey, complete assessments, and view insights all in one place.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Start New Assessment Card */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Start New Assessment</CardTitle>
              <CardDescription>
                Create a new AI readiness assessment for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <PlusCircle className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete the Q2 2025 assessment to measure your organization's AI readiness
                </p>
                <Link href="/dashboard/surveys/new">
                  <Button className="w-full">Create New Assessment</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
              <CardDescription>
                Frequently used tools and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="justify-start">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  <span>View Previous Assessments</span>
                </Button>
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Generate Report</span>
                </Button>
                <Button variant="outline" className="justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Compare with Industry</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">Recent Assessments</h2>
          <div className="grid gap-4">
            {[
              { id: 1, title: "Q1 2025 Assessment", date: "March 15, 2025", status: "Completed", score: 72 },
              { id: 2, title: "Q4 2024 Assessment", date: "December 10, 2024", status: "Completed", score: 68 },
              { id: 3, title: "Q3 2024 Assessment", date: "September 5, 2024", status: "Completed", score: 65 },
            ].map((assessment) => (
              <Card key={assessment.id} className="overflow-hidden">
                <div className="flex items-center p-4">
                  <div className="mr-4 rounded-full bg-primary/10 p-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{assessment.title}</h3>
                    <p className="text-sm text-muted-foreground">{assessment.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium">Score: </span>
                      <span className="text-primary font-semibold">{assessment.score}/100</span>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}