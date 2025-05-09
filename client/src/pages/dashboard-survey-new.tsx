import { useState } from "react";
import SurveyForm from "@/components/survey/survey-form";
import { SurveySummary } from "@/schemas/survey-schema";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard";

export default function Dashboard() {
  const [isCreatingNewSurvey, setIsCreatingNewSurvey] = useState(true);
  const { toast } = useToast();

  // Handle survey completion
  const handleSurveyComplete = (data: SurveySummary) => {
    console.log("Survey completed with data:", data);

    // You could send this data to your backend here
    toast({
      title: "Survey Completed",
      description:
        "Your AI Readiness Assessment has been submitted successfully!",
    });

    // Navigate or reset based on your needs
  };

  return (
    <DashboardLayout title="New Assessment">
      <div className="flex flex-col">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">
            New Assessment
          </h1>
          <p className="text-muted-foreground mt-2 mb-6">
            Complete this assessment to evaluate your organization's AI
            readiness
          </p>
        </div>
        <SurveyForm onComplete={handleSurveyComplete} />
      </div>
    </DashboardLayout>
  );
}
