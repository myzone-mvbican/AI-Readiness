import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BarChart3,
  ClipboardCheck,
  PlusCircle,
  TrendingUp,
} from "lucide-react";

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back to your AI Readiness Dashboard!
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your organization's AI journey, complete assessments, and view
            insights all in one place.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Welcome / Info Card */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">MyZone AI Readiness</CardTitle>
              <CardDescription>
                Your hub for AI assessment and strategy planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col text-sm text-muted-foreground space-y-4">
                <p>
                  Use this dashboard to assess your organization's readiness for AI implementation, 
                  track progress over time, and compare your results against industry benchmarks.
                </p>
                <p>
                  Complete regular assessments to identify areas of improvement and get recommendations 
                  tailored to your organization's specific needs.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>View Reports</span>
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Industry Benchmarks</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  Complete the Q2 2025 assessment to measure your organization's
                  AI readiness
                </p>
                <Link href="/dashboard/surveys/new">
                  <Button className="w-full">Create New Assessment</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
