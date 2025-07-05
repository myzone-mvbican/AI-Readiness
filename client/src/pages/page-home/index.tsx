import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, DollarSign, Users, Shield, GraduationCap, Settings, Database, Zap } from "lucide-react";
import { useAssessment } from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { GuestAssessment } from "./assessment";
import { Hero } from "./hero";
import { Benefits } from "./benefits";
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
  const [hash, setHash] = useState(window.location.hash);
  const [showGuestDialog, setShowGuestDialog] = useState(hash === "#start");

  const handleAssessmentStart = () => {
    if (user) {
      // If user is logged in, use the existing assessment modal
      assessmentCreateModal.onOpen();
    } else {
      // If no user is logged in, show the guest dialog
      setShowGuestDialog(true);
    }
  };

  useEffect(() => {
    // Function to handle hash change
    const handleHashChange = () => {
      if (hash) {
        handleAssessmentStart();
      }
    };

    handleHashChange();
  }, [hash]);

  return (
    <>
      {/* Hero Section (Hidden when assessment is shown) */}
      {showGuestAssessment ? (
        <div className="container flex flex-col flex-grow py-8">
          <GuestAssessment onClose={() => setShowGuestAssessment(false)} />
        </div>
      ) : (
        <>
          <Hero onStartAssessment={handleAssessmentStart}/>
          <Benefits />

          {/* Assessment Categories Section */}
          <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-foreground mb-4">
                  Comprehensive AI Readiness Assessment Areas
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Evaluate your organization across 8 critical dimensions that form the foundation of successful AI implementation
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Strategy & Vision */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Strategy & Vision
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assess your organization's AI strategic alignment, leadership commitment, and long-term vision for AI transformation
                  </p>
                </div>

                {/* Financial & Resources */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Financial & Resources
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Evaluate budget allocation, resource planning, and investment readiness for AI initiatives
                  </p>
                </div>

                {/* Culture & Change-Readiness */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Culture & Change-Readiness
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Measure organizational openness to change, innovation mindset, and employee adaptability to AI technologies
                  </p>
                </div>

                {/* Governance, Ethics & Risk */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Governance, Ethics & Risk
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Review AI governance frameworks, ethical considerations, risk management, and compliance readiness
                  </p>
                </div>

                {/* Skills & Literacy */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Skills & Literacy
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Analyze current team capabilities, digital literacy levels, and training needs for AI adoption
                  </p>
                </div>

                {/* Process & Operations */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                      <Settings className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Process & Operations
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Examine operational efficiency, process documentation, and workflow optimization opportunities
                  </p>
                </div>

                {/* Data & Information */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Data & Information
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assess data quality, accessibility, structure, and readiness for AI model training and analytics
                  </p>
                </div>

                {/* Technology & Integration */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground ml-3">
                      Technology & Integration
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Evaluate existing technology infrastructure, system integration capabilities, and technical readiness
                  </p>
                </div>
              </div>

              <div className="text-center mt-12">
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Each category provides detailed insights and personalized recommendations, helping you understand exactly where your organization stands and what steps to take next on your AI journey.
                </p>
                <Button
                  size="lg"
                  onClick={handleAssessmentStart}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  Start Your Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
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
