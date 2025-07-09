import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Survey, Assessment } from "@shared/types";
import CategoriesRadarChart from "../radar";

interface ScreenResultsData {
  assessment: Assessment & { survey?: Survey };
}

export default function ScreenResults({ assessment }: ScreenResultsData) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-x-3">
          <span>AI Readiness Score: {(assessment.score ?? 0) / 10}/10</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="p-2">
              This score represents your organization's current AI readiness
              level.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription>
          Based on your responses, your organization is at the
          {(assessment.score ?? 0) >= 80
            ? " advanced "
            : (assessment.score ?? 0) >= 60
              ? " intermediate "
              : (assessment.score ?? 0) >= 40
                ? " developing "
                : " beginning "}
          stage of AI readiness.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CategoriesRadarChart assessment={assessment} />
      </CardContent>
    </Card>
  );
}
