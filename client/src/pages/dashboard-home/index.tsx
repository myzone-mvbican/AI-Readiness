import { DashboardLayout } from "@/components/layout/dashboard";
import { ProfileCompletionCard } from "./widgets/profile-completion";
import { NewAssessmentCard } from "./widgets/new-assessment";
import { QuickActionsCard } from "./widgets/quick-actions";
import { PerformanceSummaryCard } from "./widgets/performance-summary";

export default function DashboardHome() {
  return (
    <DashboardLayout title="Welcome">
      <div className="space-y-6">
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

          {/* Quick Actions Card */}
          <QuickActionsCard />

          {/* Performance Summary Card */}
          <PerformanceSummaryCard />

          {/* Profile Completion Card */}
          <ProfileCompletionCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
