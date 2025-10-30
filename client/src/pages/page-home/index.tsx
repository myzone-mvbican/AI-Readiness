import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAssessment } from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { GuestAssessment } from "./assessment";
import { Hero } from "./hero";
import { Benefits } from "./benefits";
import { Instructions } from "./instructions";
import { Categories } from "./categories";
import { Services } from "./services";
import { Cta } from "./cta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const { user } = useAuth();
  const assessmentCreateModal = useAssessment();
  const [showGuestAssessment, setShowGuestAssessment] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(
    window.location.hash === "#start"
  );

  const handleAssessmentStart = () => {
    if (user) {
      // If user is logged in, use the existing assessment modal
      assessmentCreateModal.onOpen();
    } else {
      // If no user is logged in, show the guest dialog
      setShowGuestDialog(true);
    }
  };

  // Listen for hash changes (e.g., from header button)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#start") {
        if (user) {
          // If user is logged in, use the existing assessment modal
          assessmentCreateModal.onOpen();
        } else {
          // If no user is logged in, show the guest dialog
          setShowGuestDialog(true);
        }
        // Clear hash after opening dialog
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [user, assessmentCreateModal]); // Re-run when user or modal changes

  return (
    <>
      {/* Hero Section (Hidden when assessment is shown) */}
      {showGuestAssessment ? (
        <div className="container flex flex-col flex-grow py-8">
          <GuestAssessment onClose={() => setShowGuestAssessment(false)} />
        </div>
      ) : (
        <>
          <Hero onStartAssessment={handleAssessmentStart} />
          <Benefits />
          <Instructions onStartAssessment={handleAssessmentStart} />
          <Categories />
          <Services />
          <Cta onStartAssessment={handleAssessmentStart} />
        </>
      )}

      {/* Guest Dialog */}
      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Start Your Assessment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose how you'd like to proceed with your AI Readiness Assessment
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setShowGuestDialog(false);
                setShowGuestAssessment(true);
              }}
            >
              Continue as Guest
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-sm text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Link href="/auth">
              <Button
                variant="outline"
                size="lg"
                className="w-full dark:text-white"
              >
                Log in to your account
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
