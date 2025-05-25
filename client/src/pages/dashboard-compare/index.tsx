import { DashboardLayout } from "@/components/layout/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function DashboardCompare() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 space-y-3">
          <div className="col-span-1">
            <div className="col-span-1 flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-foreground" />
              <h2 className="text-xl text-foreground font-semibold">
                Benchmark Comparison
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              Assessment comparisons have moved to individual assessment pages for a better experience.
            </p>
          </div>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Feature Moved</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Benchmark comparisons are now available directly within each completed assessment.
              </p>
              <p className="text-muted-foreground">
                This provides more detailed, assessment-specific insights and better contextual analysis.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">How to access comparisons:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to your Assessments page</li>
                <li>Click on any completed assessment</li>
                <li>Navigate to the "Compare" tab</li>
              </ol>
            </div>

            <Link href="/dashboard/assessments">
              <Button size="lg" className="w-full sm:w-auto">
                View Your Assessments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}