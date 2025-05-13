import React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertCompletedProps {
  completeDialogOpen: boolean;
  setCompleteDialogOpen: (open: boolean) => void;
  isSubmitting: boolean;
  confirmComplete: () => void;
}

export default function AlertCompleted({
  completeDialogOpen,
  setCompleteDialogOpen,
  isSubmitting,
  confirmComplete,
}: AlertCompletedProps) {
  return (
    <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Assessment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to complete this assessment? Once completed,
            you won't be able to make any further changes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              confirmComplete();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Yes, Complete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
