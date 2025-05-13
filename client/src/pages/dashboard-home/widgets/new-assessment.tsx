import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useAssessmentCreateModal } from "@/hooks/use-assessment-create-modal";

export function NewAssessmentCard() {
  const assessmentCreateModal = useAssessmentCreateModal();

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg font-medium">
          Start New Assessment
        </CardTitle>
        <CardDescription className="text-center">
          Measure your organization AI readiness
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="rounded-full bg-primary/10 p-3 mb-3">
            <PlusCircle className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Complete the latest assessment to measure your organization's AI
            readiness (and compare with industry averages - soon).
          </p>
          <Button className="w-full" onClick={assessmentCreateModal.onOpen}>
            <PlusCircle />
            Start New Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
