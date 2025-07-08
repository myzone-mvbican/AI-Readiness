import { DashboardLayout } from "@/components/layout/dashboard";
import { Settings } from "lucide-react";
import { PDFDownloadTool } from "./tools/report";
import { BenchmarkStatsTool } from "./tools/stats";

export default function AdminSettings() {

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-xl text-foreground font-semibold">
                Admin Settings
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              Administrative tools and system maintenance functions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Benchmark Statistics Tool */}
          <BenchmarkStatsTool />

          {/* PDF Download Tool */}
          <PDFDownloadTool />
        </div>
      </div>
    </DashboardLayout>
  );
}
