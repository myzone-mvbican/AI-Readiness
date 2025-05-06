import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  PlusCircleIcon,
} from "lucide-react";
import SurveyForm from "@/components/survey/survey-form";
import { SurveySummary } from "@/schemas/survey-schema";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

// Previous survey placeholder data
const previousSurveys = [
  {
    id: 1,
    title: "Q1 2025 Assessment",
    date: "March 15, 2025",
    status: "Completed",
  },
  {
    id: 2,
    title: "Q4 2024 Assessment",
    date: "December 10, 2024",
    status: "Completed",
  },
  {
    id: 3,
    title: "Q3 2024 Assessment",
    date: "September 5, 2024",
    status: "Completed",
  },
];

export default function Dashboard() {
  const [isCreatingNewSurvey, setIsCreatingNewSurvey] = useState(true);
  const { toast } = useToast();

  // Handle survey completion
  const handleSurveyComplete = (data: SurveySummary) => {
    console.log("Survey completed with data:", data);

    // You could send this data to your backend here
    toast({
      title: "Survey Completed",
      description: "Your AI Readiness Assessment has been submitted successfully!",
    });

    // Navigate or reset based on your needs
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Assessment</h1>
          <p className="text-muted-foreground mt-2 mb-6">
            Complete this assessment to evaluate your organization's AI readiness
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                MyZone AI Readiness Assessment
              </h2>
              <p className="text-muted-foreground mb-6">
                This assessment will help you understand your organization's
                readiness for AI adoption. Please answer all questions honestly
                to get the most accurate assessment.
              </p>

              <SurveyForm onComplete={handleSurveyComplete} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
