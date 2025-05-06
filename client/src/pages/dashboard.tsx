import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ClipboardIcon, ClockIcon, PlusCircleIcon } from "lucide-react";
import SurveyForm from "@/components/survey/survey-form";
import { SurveySummary } from "@/schemas/survey-schema";
import { useToast } from "@/hooks/use-toast";

// Previous survey placeholder data
const previousSurveys = [
  { id: 1, title: "Q1 2025 Assessment", date: "March 15, 2025", status: "Completed" },
  { id: 2, title: "Q4 2024 Assessment", date: "December 10, 2024", status: "Completed" },
  { id: 3, title: "Q3 2024 Assessment", date: "September 5, 2024", status: "Completed" },
];

export default function Dashboard() {
  const [isCreatingNewSurvey, setIsCreatingNewSurvey] = useState(false);
  const { toast } = useToast();

  // Handle creating a new survey
  const handleCreateNewSurvey = () => {
    setIsCreatingNewSurvey(true);
  };

  // Handle survey completion
  const handleSurveyComplete = (data: SurveySummary) => {
    console.log("Survey completed with data:", data);
    
    // You could send this data to your backend here

    toast({
      title: "Survey Completed",
      description: "Your AI Readiness Assessment has been submitted successfully!",
    });
    
    // Reset form state
    setIsCreatingNewSurvey(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">AI Readiness Assessment</h1>
      
      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        {/* Sidebar with previous surveys */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Previous Assessments</CardTitle>
              <CardDescription>View your assessment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previousSurveys.map((survey) => (
                  <div 
                    key={survey.id} 
                    className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="mr-3 h-9 w-9 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full">
                      <ClipboardIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{survey.title}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        <span>{survey.date}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckIcon className="h-3 w-3 mr-1" />
                        {survey.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Assessments</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Not sure how to answer? Contact our AI readiness experts for personalized guidance.
              </p>
              <Button variant="outline" className="w-full">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content with dynamic survey form */}
        <div>
          {isCreatingNewSurvey ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">MyZone AI Readiness Assessment</h2>
              <p className="text-gray-600 mb-6">
                This assessment will help you understand your organization's readiness for AI adoption. 
                Please answer all questions honestly to get the most accurate assessment.
              </p>
              
              <SurveyForm onComplete={handleSurveyComplete} />
            </div>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Start a New Assessment</CardTitle>
                <CardDescription>
                  Complete the quarterly assessment to evaluate your AI readiness. This typically takes 10-15 minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-md border p-6 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                    <PlusCircleIcon className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Create Q2 2025 Assessment</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Evaluate your organization's AI readiness for the current quarter
                  </p>
                  <Button 
                    onClick={handleCreateNewSurvey}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Start New Assessment
                  </Button>
                </div>
                
                <Separator className="my-8" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Why Regular Assessment Matters</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Track your organization's AI maturity over time</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Identify opportunities for improvement in your AI strategy</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Compare your progress against industry benchmarks</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Set realistic goals for your AI initiatives</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}