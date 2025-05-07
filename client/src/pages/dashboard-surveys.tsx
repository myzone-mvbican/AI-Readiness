import { DashboardLayout } from "@/components/layout/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, ShieldCheck } from "lucide-react";

export default function SurveysPage() {
  return (
    <DashboardLayout title="Surveys">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Admin View</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Survey Administration
            </CardTitle>
            <CardDescription>
              View and manage survey data for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is the Surveys page for administrators.
              More functionality coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}