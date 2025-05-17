import React from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AISuggestionsProps {
  content: string | null;
  isLoading: boolean;
  error: Error | null;
  isActive: boolean;
}

export default function AISuggestions({
  content,
  isLoading,
  error,
  isActive,
}: AISuggestionsProps) {
  // If tab isn't active but we're still loading, show minimal message
  if (!isActive) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <p className="text-muted-foreground">
          {isLoading 
            ? "AI recommendations are being generated..."
            : "Select this tab to view AI recommendations"}
        </p>
      </div>
    );
  }

  // Show loading state when visible
  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-330px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Our AI agent is working to create actionable recommendations
            based on your assessment results. It will be ready in a moment.
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-[calc(100dvh-330px)] p-4">
        <Alert variant="destructive">
          <AlertTitle>Error generating recommendations</AlertTitle>
          <AlertDescription>
            We couldn't generate AI recommendations at this time. Please try
            again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show recommendations
  return (
    <ScrollArea className="h-[calc(100dvh-330px)] rounded-md border p-4">
      <div className="space-y-6">
        <div className="markdown-text">
          <ReactMarkdown>{content || 'No recommendations found.'}</ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
