import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Survey, Assessment } from "@shared/types";

interface ScreenRecommendations {
  assessment: Assessment & { survey?: Survey };
  isLoading?: boolean;
}

export default function ScreenRecommendations({
  assessment,
  isLoading,
}: ScreenRecommendations) {
  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Our AI agent is working to create actionable recommendations based
            on your assessment results. It will be ready in a moment - we will
            let you know once is done.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
      <div className="space-y-6">
        <div className="markdown-text">
          <ReactMarkdown>
            {assessment.recommendations || "No recommendations found."}
          </ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
