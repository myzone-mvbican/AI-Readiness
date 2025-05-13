import React from "react";

import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard";

export default function SurveyError() {
  const [, navigate] = useLocation();

  return (
    <DashboardLayout title="Assessment Error">
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/assessments")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Assessments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Failed to load assessment. It may have been deleted or you don't
              have permission to view it.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/dashboard/assessments")}>
              Return to Assessments
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
