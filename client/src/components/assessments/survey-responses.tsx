import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getQuestionTextById } from '@/lib/survey-data';
import { AssessmentAnswer } from '@shared/schema';

interface SurveyResponsesProps {
  answers: AssessmentAnswer[];
}

export function SurveyResponses({ answers }: SurveyResponsesProps) {
  return (
    <ScrollArea className="h-[500px] rounded-md border p-4">
      {answers.map((answer, index) => (
        <div key={answer.q} className="py-4">
          <h3 className="font-medium">
            Question {index + 1}: {getQuestionTextById(answer.q)}
          </h3>
          <p className="mt-2">
            Your answer: {
              answer.a === 2 ? "Strongly Agree" :
              answer.a === 1 ? "Agree" :
              answer.a === 0 ? "Neutral" :
              answer.a === -1 ? "Disagree" :
              answer.a === -2 ? "Strongly Disagree" :
              "Not answered"
            }
          </p>
          {answer.r && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Your notes:</p>
              <p className="text-sm mt-1 bg-muted p-2 rounded">{answer.r}</p>
            </div>
          )}
          <div className="border-b mt-4"></div>
        </div>
      ))}
    </ScrollArea>
  );
}