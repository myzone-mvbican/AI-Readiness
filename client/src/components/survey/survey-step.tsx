import React, { useRef, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { createSurveyStepSchema, SurveyQuestion, SurveySection, SurveyStepFormValues } from "@/schemas/survey-schema";
import SurveyQuestionItem from "./survey-question";

interface SurveyStepProps {
  section: SurveySection;
  onNextStep: (sectionData: SurveyStepFormValues) => void;
  onPrevStep: () => void;
  initialData?: SurveyStepFormValues;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export default function SurveyStep({ 
  section, 
  onNextStep, 
  onPrevStep,
  initialData = {},
  isFirstStep = false,
  isLastStep = false
}: SurveyStepProps) {
  // Create refs for each question for scrolling
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const HEADER_OFFSET = 80; // Adjust based on your header height

  // Create dynamic schema based on questions in this section
  const schema = createSurveyStepSchema(section.questions);
  type FormValues = z.infer<typeof schema>;
  
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData as any,
    mode: "onChange"
  });
  
  const { handleSubmit, control, formState, watch } = form;
  const { isValid, errors } = formState;
  
  // Watch for changes to scroll to the next unanswered question
  const formValues = watch();
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    onNextStep(data);
  };
  
  // Handle smooth scrolling to the next question when a question is answered
  const handleQuestionAnswered = (answeredQuestionNumber: number) => {
    // Find the next unanswered question
    const currentIndex = section.questions.findIndex(q => q.number === answeredQuestionNumber);
    
    if (currentIndex < section.questions.length - 1) {
      const nextQuestionRef = questionRefs.current[currentIndex + 1];
      
      if (nextQuestionRef) {
        setTimeout(() => {
          window.scrollTo({
            top: nextQuestionRef.offsetTop - HEADER_OFFSET,
            behavior: "smooth"
          });
        }, 300);
      }
    }
  };

  return (
    <div className="my-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{section.category}</h2>
      
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {section.questions.map((question, index) => (
            <SurveyQuestionItem
              key={question.number}
              question={question}
              control={control}
              onAnswered={handleQuestionAnswered}
              questionRef={(el) => questionRefs.current[index] = el}
            />
          ))}
          
          <div className="flex justify-between pt-4">
            {!isFirstStep && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onPrevStep}
              >
                Previous
              </Button>
            )}
            
            <div className="ml-auto">
              <Button 
                type="submit" 
                disabled={!isValid}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLastStep ? "Review Answers" : "Next"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}