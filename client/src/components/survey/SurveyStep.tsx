import { SurveySection, SurveyFormData } from "@/models/survey-data";
import SurveyQuestion from "./SurveyQuestion";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";

interface SurveyStepProps {
  section: SurveySection;
  formData: SurveyFormData;
  onUpdateFormData: (questionId: number, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export default function SurveyStep({
  section,
  formData,
  onUpdateFormData,
  onNext,
  onBack,
  isFirstStep,
  isLastStep
}: SurveyStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Build dynamic Zod schema based on questions
  const buildStepSchema = () => {
    const schemaFields: Record<string, z.ZodString> = {};
    section.questions.forEach(question => {
      schemaFields[`q${question.id}`] = z.string({
        required_error: `Please answer question ${question.id}`
      });
    });
    return z.object(schemaFields);
  };

  // Create the type based on the schema
  type StepFormValues = z.infer<ReturnType<typeof buildStepSchema>>;

  // Initialize form with react-hook-form and zod validation
  const form = useForm<StepFormValues>({
    resolver: zodResolver(buildStepSchema()),
    defaultValues: section.questions.reduce((acc, question) => {
      acc[`q${question.id}`] = formData[question.id.toString()] || "";
      return acc;
    }, {} as Record<string, string>),
    mode: "onChange"
  });

  // Check if all questions are answered
  const allQuestionsAnswered = section.questions.every(
    question => !!formData[question.id.toString()]
  );

  // Handle value changes
  const handleQuestionChange = (id: number, value: string) => {
    onUpdateFormData(id, value);
    form.setValue(`q${id}`, value, { shouldValidate: true });
  };

  // Handle next button click
  const handleNext = () => {
    if (allQuestionsAnswered) {
      onNext();
    } else {
      // Find the first unanswered question and scroll to it
      const unansweredQuestion = section.questions.find(
        question => !formData[question.id.toString()]
      );
      if (unansweredQuestion) {
        const questionElement = document.getElementById(`question-${unansweredQuestion.id}`);
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Scroll to top of form when step changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [section.category]);

  // Function to navigate to the next question
  const navigateToNextQuestion = (currentIndex: number) => {
    if (currentIndex < section.questions.length - 1) {
      const nextQuestionElement = document.getElementById(
        `question-${section.questions[currentIndex + 1].id}`
      );
      if (nextQuestionElement) {
        const headerOffset = 100; // Same as in SurveyQuestion
        const elementPosition = nextQuestionElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="border rounded-lg bg-white shadow-sm">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-xl font-semibold text-gray-800">{section.category}</h2>
          <p className="text-gray-500 mt-1">Complete all questions in this section to continue</p>
        </div>
        
        <div className="p-6">
          {section.questions.map((question, index) => (
            <SurveyQuestion
              key={question.id}
              question={question}
              value={formData[question.id.toString()] || ""}
              onChange={handleQuestionChange}
              isLastQuestion={index === section.questions.length - 1}
              onNavigateToNext={() => navigateToNextQuestion(index)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isFirstStep}
        >
          Back
        </Button>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleNext}
          disabled={!allQuestionsAnswered}
        >
          {isLastStep ? "Review Answers" : "Next Section"}
        </Button>
      </div>
    </div>
  );
}