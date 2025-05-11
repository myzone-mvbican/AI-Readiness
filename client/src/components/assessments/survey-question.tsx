import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { QuestionRating } from '@/components/survey/question-rating';
import { SurveyQuestion } from '@/lib/survey-data';

interface SurveyQuestionComponentProps {
  currentStep: number;
  totalSteps: number;
  surveyQuestion: SurveyQuestion | undefined;
  value: number | null;
  onChange: (value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function SurveyQuestionComponent({
  currentStep,
  totalSteps,
  surveyQuestion,
  value,
  onChange,
  onNext,
  onPrevious,
  isSubmitting
}: SurveyQuestionComponentProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-muted-foreground">
        Question {currentStep + 1} of {totalSteps}
      </h3>
      
      {/* Display the question text with description from CSV */}
      <p className="text-lg mb-6">
        {surveyQuestion?.text || `Question ${currentStep + 1}`}
      </p>
      
      <QuestionRating
        question="What is your level of agreement with this statement?"
        value={value}
        onChange={onChange}
        disabled={isSubmitting}
        questionDescription={surveyQuestion?.description}
      />
      
      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}