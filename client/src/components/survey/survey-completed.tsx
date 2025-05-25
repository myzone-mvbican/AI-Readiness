import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Loader2,
  InfoIcon,
  GitCompare,
  FileBarChart2,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Assessment, Survey } from "@shared/types";
import { formatDate } from "@/lib/utils";
import { AssessmentPDFDownloadButton } from "./assessment-pdf";
// Screens
import ScreenResults from "./screens/results";
import ScreenAnswers from "./screens/answers";
import ScreenCompare from "./screens/compare";
import ScreenRecommendations from "./screens/recommendations";

interface SurveyCompletedProps {
  assessment: Assessment & { survey?: Survey };
  additionalActions?: React.ReactNode;
}

export default function SurveyCompleted({
  assessment,
  additionalActions,
}: SurveyCompletedProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 space-y-6 md:space-y-0 py-4">
        <div className="col-span-1 self-end flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-start">
            <h2 className="text-xl md:text-2xl text-foreground font-bold">
              Assessment Completed
            </h2>
            <p className="text-sm md:text-normal text-muted-foreground mt-2">
              You scored {(assessment.score ?? 0) / 10} out of 10 on this AI
              readiness assessment.
            </p>
            <p className="text-sm md:text-normal text-muted-foreground">
              Completed on:{" "}
              {formatDate(assessment.completedOn?.toString() || new Date())}
            </p>
          </div>
        </div>
        <div className="col-span-1 self-center sm:flex sm:justify-end">
          <div className="flex flex-col gap-4">
            {additionalActions}
            {assessment?.recommendations === null ? (
              <Tooltip defaultOpen>
                <TooltipTrigger asChild>
                  <Button disabled variant="secondary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing PDF...
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="p-2 max-w-xs">
                  <p>
                    Don't reload the page - Our AI Agent is crafting a beautiful
                    PDF for you.
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <AssessmentPDFDownloadButton assessment={assessment} />
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="results" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="results">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <GitCompare className="size-4" />
                  <span className="text-[8px] md:text-sm">Results</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                View the overall assessment results.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="responses">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <ListTodo className="size-4" />
                  <span className="text-[8px] md:text-sm">Responses</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                See all your responses from the assessment.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <InfoIcon className="size-4" />
                  <span className="text-[8px] md:text-sm">Recommendations</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                Review AI-generated improvement suggestions.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="compare">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4">
                  <FileBarChart2 className="size-4" />
                  <span className="text-[8px] md:text-sm">Compare</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                Compare your assessment with others.
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <ScreenResults assessment={assessment} />
        </TabsContent>

        <TabsContent value="responses">
          <ScreenAnswers assessment={assessment} />
        </TabsContent>

        <TabsContent value="suggestions">
          <ScreenRecommendations assessment={assessment} />
        </TabsContent>

        <TabsContent value="compare">
          <ScreenCompare assessment={assessment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
