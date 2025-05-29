import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SurveyCompleted from "@/components/survey/survey-completed";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { GuestUser, clearGuestAssessmentData } from "@/lib/localStorage";
import { Assessment, CsvQuestion } from "@shared/types";
import DialogUserCreate from "./dialog-user-create";
import { AssessmentStage } from ".";

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
  const [startNew, setStartNew] = useState<boolean>(false);

  const AdditionalActions = () => {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => setShowSignupModal(true)}>
              <UserPlus className="h-4 w-4" />
              <span className="relative">Create Account</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Create an account to track your progress, view assessment history,
              and get personalized recommendations. Your assessment data will be
              linked to your new account.
            </p>
          </TooltipContent>
        </Tooltip>

        {startNew && (
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
        )}
      </>
    );
  };

  return (
    <>
      <div className="w-full space-y-6">
        <SurveyCompleted
          assessment={assessment}
          questions={questions}
          additionalActions={<AdditionalActions />}
        />
      </div>
      {/* Account creation modal */}
      <DialogUserCreate
        open={showSignupModal}
        guestUser={guestUser}
        onOpenChange={setShowSignupModal}
        closeModal={() => setShowSignupModal(false)}
      />
    </>
  );
}
