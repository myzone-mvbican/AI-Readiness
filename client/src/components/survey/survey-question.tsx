import React, { useRef } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RatingOption, ratingOptions, SurveyQuestion } from "@/schemas/survey-schema";
import { Control } from "react-hook-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface SurveyQuestionProps {
  question: SurveyQuestion;
  control: Control<any>;
  onAnswered?: (questionNumber: number) => void;
  questionRef?: React.RefObject<HTMLDivElement>;
}

export default function SurveyQuestionItem({ 
  question, 
  control, 
  onAnswered,
  questionRef
}: SurveyQuestionProps) {
  const radioRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // When a radio button is selected, trigger the onAnswered callback
  const handleRadioChange = (value: RatingOption) => {
    if (onAnswered) {
      onAnswered(question.number);
    }
  };

  return (
    <div 
      ref={questionRef}
      className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100"
      id={`question-${question.number}`}
    >
      <FormField
        control={control}
        name={`question_${question.number}`}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <div className="flex items-start">
              <FormLabel className="text-lg font-medium flex-1">
                <span className="text-primary-600 mr-2">Q{question.number}.</span>
                {question.question}
              </FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <HelpCircle size={18} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4">
                    <p>{question.details}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value);
                  handleRadioChange(value as RatingOption);
                }}
                value={field.value}
                className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 mt-3"
              >
                {ratingOptions.map((option, index) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      ref={el => radioRefs.current[index] = el} 
                      value={option} 
                      id={`${question.number}-${option}`} 
                    />
                    <label 
                      htmlFor={`${question.number}-${option}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}