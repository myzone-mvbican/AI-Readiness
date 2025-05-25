import React, { useState, useEffect } from "react";
import { TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard";

export function Loading({ type }: { type: string }) {
  const [text, setText] = useState<{
    head: string;
    body: string;
  }>({
    head: "",
    body: "",
  });

  useEffect(() => {
    switch (type) {
      case "loading":
        setText({
          head: "Loading",
          body: "Loading benchmark data...",
        });
        break;
      case "error":
        setText({
          head: "Benchmark data not available",
          body: "Please try again later or contact support",
        });
        break;
      case "none":
        setText({
          head: "No completed assessments found",
          body: "Complete an assessment to see benchmark comparisons",
        });
        break;
    }
  }, [type]);

  return (
    <DashboardLayout title="Loading Benchmark">
      <div className="grid grid-cols-1 space-y-6">
        <div className="grid grid-cols-1 space-y-3">
          <div className="col-span-1 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-foreground" />
            <h2 className="text-xl text-foreground font-semibold">
              Your Assessments
            </h2>
          </div>
          <p className="text-muted-foreground mt-2">
            Your company AI Readiness vs global benchmarks.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{text.head}</p>
              <p className="text-sm mt-2">{text.body}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
