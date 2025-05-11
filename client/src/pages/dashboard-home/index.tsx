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
import { BarChart3, ClipboardCheck, TrendingUp } from "lucide-react";
import { ProfileCompletionCard } from "./widgets/profile-completion";
import { NewAssessmentCard } from "./widgets/new-assessment";

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
          <NewAssessmentCard />

          {/* Quick Actions */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-center">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-center">
                Frequently used tools and actions
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-[3rem]">
              <div className="flex flex-col gap-2">
                <Link href="/dashboard/assessments" asChild>
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

          {/* Profile Completion Card */}
          <ProfileCompletionCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
