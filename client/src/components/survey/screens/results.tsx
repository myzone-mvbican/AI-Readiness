import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Survey, Assessment } from "@shared/types";
import { isV2Recommendations } from "./recommendations";
import CategoriesRadarChart from "../radar";

interface ScreenResultsData {
  assessment: Assessment & { survey?: Survey };
  onTabChange?: (tab: string) => void;
}

export default function ScreenResults({
  assessment,
  onTabChange,
}: ScreenResultsData) {
  const recommendations = assessment.recommendations;
  const isV2Template = isV2Recommendations(recommendations);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Intro Section */}
      {isV2Template && (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎯</span>
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {recommendations.intro}
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            {/* Button Group */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => onTabChange?.("suggestions")}
                className="flex-1"
                variant="outline"
              >
                View Recommendations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild className="flex-1">
                <a
                  href="https://calendly.com/keeranmfj/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule a Consultation
                </a>
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
