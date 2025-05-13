import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";
import { useAssessmentCreateModal } from "@/hooks/use-assessment-create-modal";
import { useAuth } from "@/hooks/use-auth";
import { GuestAssessment } from "@/components/assessment/guest-assessment";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const assessmentCreateModal = useAssessmentCreateModal();
  const { user } = useAuth();
  const [showGuestAssessment, setShowGuestAssessment] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  const handleAssessmentStart = () => {
    if (user) {
      // If user is logged in, use the existing assessment modal
      assessmentCreateModal.onOpen();
    } else {
      // If no user is logged in, show the guest dialog
      setShowGuestDialog(true);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Guest Assessment Section */}
      {showGuestAssessment && (
        <div className="container py-8">
          <GuestAssessment onClose={() => setShowGuestAssessment(false)} />
        </div>
      )}

      {/* Guest Dialog */}
      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Your Assessment</DialogTitle>
            <DialogDescription>
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
            
            <Link href="/auth?mode=login">
              <Button variant="outline" size="lg" className="w-full">
                Log in to your account
              </Button>
            </Link>
            
            <Link href="/auth?mode=register">
              <Button variant="link" size="sm" className="w-full">
                Don't have an account? Register here
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section (Hidden when assessment is shown) */}
      {!showGuestAssessment && (
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-700 mb-6">
                MyZone AI Readiness Survey
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8">
                Welcome! This AI Readiness Assessment should be completed
                quarterly as one of your foundational AI KPIs (Key Performance
                Indicators). It takes approximately 10 minutes to complete. You
                can save your results as a PDF or compare with industry
                benchmarks.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleAssessmentStart}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md px-6"
                >
                  Start Assessment
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md px-6"
                  >
                    Learn More
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section (Hidden when assessment is shown) */}
      {!showGuestAssessment && (
        <div className="py-12 bg-white dark:bg-muted">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-foreground">
                Benefits of the Assessment
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Understand your organization&apos;s AI readiness and get actionable
                insights
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-foreground text-2xl font-semibold mb-3">
                  Benchmark
                </div>
                <p className="text-muted-foreground">
                  Compare your AI readiness with industry standards and
                  competitors
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-foreground text-2xl font-semibold mb-3">
                  Track Progress
                </div>
                <p className="text-muted-foreground">
                  Monitor your improvement over time with quarterly assessments
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-foreground text-2xl font-semibold mb-3">
                  Get Insights
                </div>
                <p className="text-muted-foreground">
                  Receive tailored recommendations to improve your AI capabilities
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}