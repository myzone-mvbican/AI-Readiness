import { useState, useEffect, useRef } from "react";
import { SurveyQuestion as QuestionType, answerOptions } from "@/models/survey-data";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SurveyQuestionProps {
  question: QuestionType;
  value: string; 
  onChange: (id: number, value: string) => void;
  isLastQuestion: boolean;
  onNavigateToNext: () => void;
}

export default function SurveyQuestion({ 
  question, 
  value, 
  onChange, 
  isLastQuestion,
  onNavigateToNext
}: SurveyQuestionProps) {
  const questionRef = useRef<HTMLDivElement>(null);
  const [answered, setAnswered] = useState(!!value);

  // Smooth scroll to this question when it comes into view
  useEffect(() => {
    // Skip if already answered (prevents jumping on form load)
    if (!answered && questionRef.current) {
      const headerOffset = 100; // Account for sticky header
      const elementPosition = questionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, [answered]);

  const handleChange = (value: string) => {
    onChange(question.id, value);
    setAnswered(true);
    
    // After answering, either scroll to next question or show continue button
    if (!isLastQuestion) {
      setTimeout(() => {
        onNavigateToNext();
      }, 300);
    }
  };

  return (
    <div 
      ref={questionRef}
      className="py-6 border-b border-gray-200 last:border-b-0"
      id={`question-${question.id}`}
    >
      <div className="flex items-start gap-2 mb-4">
        <div className="font-medium text-gray-800">{question.id}.</div>
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <div className="font-medium text-gray-800">{question.summary}</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 rounded-full">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>{question.details}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <RadioGroup 
        value={value} 
        onValueChange={handleChange}
        className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4"
      >
        {answerOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`q${question.id}-${option.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`q${question.id}-${option.value}`}
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}