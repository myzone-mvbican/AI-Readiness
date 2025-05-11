import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/dashboard";

export default function SurveyError() {
  return (
    <DashboardLayout title="Loading Assessment">
      <div className="space-y-6">
        <div className="flex justify-center items-center p-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mb-4 mx-auto text-primary" />
            <h3 className="text-lg font-medium mb-2">
              Loading assessment data...
            </h3>
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </DashboardLayout>
  );
}
