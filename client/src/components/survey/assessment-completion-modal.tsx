import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import SurveyCompleted from "./survey-completed";
import { Assessment, CsvQuestion, Survey } from "@shared/types";

interface AssessmentCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment & { survey?: Survey };
  questions: CsvQuestion[];
  additionalActions?: React.ReactNode;
}

export function AssessmentCompletionModal({
  open,
  onOpenChange,
  assessment,
  questions,
  additionalActions,
}: AssessmentCompletionModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="max-h-[80vh] overflow-y-auto">
      <SurveyCompleted
        assessment={assessment}
        questions={questions}
        additionalActions={additionalActions}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                Assessment Results
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-6 w-6 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-0">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              Assessment Results
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}