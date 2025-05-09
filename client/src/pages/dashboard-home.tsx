import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  ClipboardCheck,
  PlusCircle,
  TrendingUp,
} from "lucide-react";

export default function DashboardHome() {
  return (
    <DashboardLayout title="Welcome">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">
            Welcome back to your AI Readiness Dashboard!
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your organization's AI journey, complete assessments, and view
            insights all in one place.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Start New Assessment Card */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg font-medium">
                Start New Assessment
              </CardTitle>
              <CardDescription className="text-center">
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
                <Link href="/dashboard/assessments/new" asChild>
                  <Button className="w-full">Create New Assessment</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Quick Actions
              </CardTitle>
              <CardDescription>
                Frequently used tools and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard/assessments/new" asChild>
                  <Button variant="outline" className="justify-start">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    <span>View Assessments</span>
                  </Button>
                </Link>
                <Button variant="outline" className="justify-start" disabled>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Generate Report</span>
                  <Badge className="ms-auto">Soon</Badge>
                </Button>
                <Button variant="outline" className="justify-bet" disabled>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Compare with Industry</span>
                  <Badge className="ms-auto">Soon</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
