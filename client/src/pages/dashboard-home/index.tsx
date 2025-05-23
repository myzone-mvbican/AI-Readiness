import { DashboardLayout } from "@/components/layout/dashboard";
import { ProfileCompletionCard } from "./widgets/profile-completion";
import { NewAssessmentCard } from "./widgets/new-assessment";
import { QuickActions } from "./widgets/quick-actions";
import { PerformanceSummary } from "./widgets/performance-summary";
import { BenchmarkWidget } from "./widgets/benchmark";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function DashboardHome() {
  const { user } = useAuth();

  // Fetch user's completed assessments to show benchmark data
  const { data: assessments } = useQuery<{
    success: boolean;
    assessments: Array<{
      id: number;
      title: string;
      status: string;
      completedOn: string | null;
      score: number | null;
    }>;
  }>({
    queryKey: ["/api/assessments"],
    enabled: !!user,
  });

  // Find the most recent completed assessment for benchmark comparison
  const latestCompletedAssessment = assessments?.assessments
    ?.filter((a) => a.status === "completed" && a.completedOn)
    ?.sort(
      (a, b) =>
        new Date(b.completedOn!).getTime() - new Date(a.completedOn!).getTime(),
    )?.[0];

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

          {/* Quick Actions */}
          <QuickActions />

          {/* Profile Completion Card */}
          {user && <ProfileCompletionCard user={user} />}

          {/* Performance Summary - Show for users with completed assessments */}
          {latestCompletedAssessment && (
            <PerformanceSummary 
              assessmentId={latestCompletedAssessment.id}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
