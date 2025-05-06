import { useEffect, useState } from "react";
import { surveyData, SurveyFormData } from "@/models/survey-data";
import SurveyStep from "@/components/survey/SurveyStep";
import SurveySummary from "@/components/survey/SurveySummary";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

export default function SurveyPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<SurveyFormData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();

  // Calculate progress percentage
  const totalQuestions = surveyData.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
  
  const answeredQuestions = Object.keys(formData).length;
  
  const progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

  // Update form data when a question is answered
  const handleUpdateFormData = (questionId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [questionId.toString()]: value
    }));
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < surveyData.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Edit a specific section
  const handleEditSection = (sectionIndex: number) => {
    setCurrentStep(sectionIndex);
    setShowSummary(false);
  };

  // Submit the form
  const handleSubmit = () => {
    // Here you would typically send the data to an API
    console.log("Form submitted:", formData);
    
    toast({
      title: "Assessment Submitted",
      description: "Your AI readiness assessment has been successfully submitted.",
    });
    
    // Redirect to dashboard after submission
    setTimeout(() => {
      setLocation("/dashboard");
    }, 1500);
  };

  return (
    <div className="container max-w-5xl py-12">
      <div className="mb-10 space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">AI Readiness Assessment</h1>
        <p className="text-gray-600 max-w-3xl">
          Complete this assessment to evaluate your organization's readiness to adopt and implement AI technologies.
          Answer all questions to get a comprehensive analysis.
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex gap-2 text-sm text-blue-700">
            <ChevronRight className="h-5 w-5 text-blue-500" />
            <p>
              <span className="font-semibold">Tip:</span> Each question includes an information
              icon with additional context to help you provide accurate answers.
            </p>
          </div>
        </Card>
      </div>

      {showSummary ? (
        <SurveySummary
          sections={surveyData}
          formData={formData}
          onBack={handleBack}
          onEdit={handleEditSection}
          onSubmit={handleSubmit}
        />
      ) : (
        <SurveyStep
          section={surveyData[currentStep]}
          formData={formData}
          onUpdateFormData={handleUpdateFormData}
          onNext={handleNext}
          onBack={handleBack}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === surveyData.length - 1}
        />
      )}
    </div>
  );
}