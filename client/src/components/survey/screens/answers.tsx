import React from "react";
import { InfoIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Survey, Assessment, CsvQuestion } from "@shared/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScreenAnswers {
  assessment: Assessment & { survey?: Survey & { questions?: CsvQuestion[] } };
}

export default function ScreenAnswers({ assessment }: ScreenAnswers) {
  const answers = assessment.answers || [];
  const questions = assessment.survey?.questions || [];

  // Helper function to find question text by ID
  const getQuestionTextById = (
    questionId: number | null | undefined,
  ): string => {
    if (questionId === null || questionId === undefined) {
      return `Unknown Question`;
    }
    // Find the matching question by number
    const question = questions.find(
      (q: CsvQuestion) => Number(q.id) === questionId,
    );
    return question?.question || `Question ${questionId}`;
  };

  return (
    <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
      <div>
        {answers.map((answer: any, index: number) => (
          <div key={`answer-${index}`}>
            <div className="flex items-start gap-2">
              <h3 className="text-sm text-foreground md:text-base font-medium flex-1">
                Question {index + 1}: {getQuestionTextById(answer.q)}
              </h3>
              {questions.find((q: CsvQuestion) => Number(q.id) === answer.q)
                ?.details && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 dark:text-white flex-shrink-0 mt-1" />
                  </TooltipTrigger>
                  <TooltipContent className="p-2 max-w-[400px]">
                    {
                      questions.find(
                        (q: CsvQuestion) => Number(q.id) === answer.q,
                      )?.details
                    }
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Your answer:{" "}
              <span className="font-medium">
                {answer.a === 2
                  ? "Strongly Agree"
                  : answer.a === 1
                    ? "Agree"
                    : answer.a === 0
                      ? "Neutral"
                      : answer.a === -1
                        ? "Disagree"
                        : answer.a === -2
                          ? "Strongly Disagree"
                          : "Not answered"}
              </span>
            </p>
            <Separator className="my-4" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
