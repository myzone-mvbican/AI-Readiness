import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import SurveyCompleted from "@/components/survey/survey-completed";
import { Button } from "@/components/ui/button";
import { GuestUser, clearGuestAssessmentData } from "@/lib/localStorage";
import { AssessmentStage } from ".";
import { Assessment, CsvQuestion } from "@shared/types";
import DialogUserCreate from "./dialog-user-create";

interface GuestAssessmentCompletedProps {
  assessment: Assessment;
  questions: CsvQuestion[];
  guestUser: GuestUser | null;
  setStage: (stage: AssessmentStage) => void;
}

export default function GuestAssessmentCompleted({
  assessment,
  questions,
  guestUser,
  setStage,
}: GuestAssessmentCompletedProps) {
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);

  return (
    <>
      <div className="w-full space-y-6">
        <SurveyCompleted assessment={assessment} questions={questions} />

        {/* Action buttons displayed below survey results */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowSignupModal(true)}
                  className="relative group"
                >
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary opacity-75 rounded-lg blur group-hover:opacity-100 transition duration-200"></span>
                  <span className="relative flex items-center justify-center px-6 py-2">
                    Create Account
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="p-2 max-w-xs">
                <p>
                  Create an account to track your progress, view assessment
                  history, and get personalized recommendations
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            onClick={() => {
              // Clear ALL localStorage data for guest
              clearGuestAssessmentData();

              // Return to beginning
              setStage(AssessmentStage.INFO_COLLECTION);
            }}
          >
            Start New Assessment
          </Button>
        </div>
      </div>
      {/* Account creation modal */}
      <DialogUserCreate
        open={showSignupModal}
        guestUser={guestUser}
        onOpenChange={setShowSignupModal}
      />
    </>
  );
}
