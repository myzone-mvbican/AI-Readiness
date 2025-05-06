import React, { useState, useEffect } from "react";
import { SurveySection, SurveyStepFormValues, SurveySummary } from "@/schemas/survey-schema";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SurveyStep from "./survey-step";
import SurveySummaryComponent from "./survey-summary";
import SurveyCompletion from "./survey-completion";
import { loadSurveyData } from "@/lib/survey-data";
import { useToast } from "@/hooks/use-toast";

interface SurveyFormProps {
  onComplete?: (data: SurveySummary) => void;
}

export default function SurveyForm({ onComplete }: SurveyFormProps) {
  const [sections, setSections] = useState<SurveySection[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SurveySummary>({});
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const { toast } = useToast();

  // Load survey data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadSurveyData();
        setSections(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load survey data:", error);
        toast({
          title: "Error",
          description: "Failed to load survey questions. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle when a step is completed
  const handleNextStep = (stepData: SurveyStepFormValues) => {
    // Save the data for this step
    setFormData(prev => ({
      ...prev,
      [currentStep]: stepData
    }));

    // If this was the last step, show the summary
    if (currentStep === sections.length - 1) {
      setShowSummary(true);
    } else {
      // Otherwise, go to the next step
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  // Handle going back to the previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  // Handle editing a specific section
  const handleEditSection = (sectionIndex: number) => {
    setCurrentStep(sectionIndex);
    setShowSummary(false);
  };

  // Handle final submission
  const handleSubmit = () => {
    if (onComplete) {
      onComplete(formData);
    }
    
    // Show success toast
    toast({
      title: "Survey Completed",
      description: "Your AI Readiness Assessment has been submitted successfully!",
    });
    
    // Show completion screen with results
    setShowSummary(false);
    setShowCompletion(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600">Loading survey questions...</span>
      </div>
    );
  }

  // If on completion screen, render the SurveyCompletion component
  if (showCompletion) {
    return <SurveyCompletion surveyData={formData} sections={sections} />;
  }

  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        {showSummary ? (
          <SurveySummaryComponent 
            sections={sections}
            surveyData={formData}
            onSubmit={handleSubmit}
            onEdit={handleEditSection}
          />
        ) : (
          <>
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Section {currentStep + 1} of {sections.length}</span>
                <span>{sections[currentStep]?.category}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current step */}
            {sections.length > 0 && (
              <SurveyStep
                section={sections[currentStep]}
                onNextStep={handleNextStep}
                onPrevStep={handlePrevStep}
                initialData={formData[currentStep]}
                isFirstStep={currentStep === 0}
                isLastStep={currentStep === sections.length - 1}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}