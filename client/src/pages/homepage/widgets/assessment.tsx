import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { AssessmentAnswer } from "@shared/types";
import SurveyCompleted from "@/components/survey/survey-completed";
import { GuestAssessmentForm } from "./guest-form";
import GuestSurvey from "./guest-survey";
import {
  getGuestUser,
  saveGuestUser,
  GuestUser as StorageGuestUser,
  hasSavedGuestAssessment,
  clearGuestAssessmentDataForSurvey,
  getGuestAssessmentData,
  clearGuestAssessmentData,
} from "@/lib/localStorage";

enum AssessmentStage {
  INFO_COLLECTION,
  SURVEY_QUESTIONS,
  COMPLETED,
}

// Registration form schema
const registrationSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface GuestAssessmentProps {
  onClose?: () => void;
}

export function GuestAssessment({ onClose }: GuestAssessmentProps) {
  const [stage, setStage] = useState<AssessmentStage>(
    AssessmentStage.INFO_COLLECTION,
  );
  const { toast } = useToast();

  // Load guest user info from localStorage using our utility
  const [guestUser, setGuestUser] = useState<StorageGuestUser | null>(() => {
    return getGuestUser();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<any | null>(null);
  const [questionData, setQuestionData] = useState<any | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form with zod validation
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: guestUser?.name || "",
      email: guestUser?.email || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Default survey template ID
  const defaultSurveyId = 19;

  // Check for saved answers in localStorage using our utility
  const [hasSavedAnswers, setHasSavedAnswers] = useState<boolean>(() => {
    return hasSavedGuestAssessment(defaultSurveyId);
  });

  // State to track if we're showing the resume dialog
  const [showResumeDialog, setShowResumeDialog] = useState<boolean>(false);

  // Auto-advance to survey questions if user info already exists
  useEffect(() => {
    if (guestUser && stage === AssessmentStage.INFO_COLLECTION) {
      if (hasSavedAnswers) {
        // Show resume dialog instead of auto-advancing
        setShowResumeDialog(true);
      } else {
        setStage(AssessmentStage.SURVEY_QUESTIONS);
      }
    }
  }, [guestUser, stage, hasSavedAnswers]);

  // Load survey data when entering the survey questions stage
  useEffect(() => {
    if (stage === AssessmentStage.SURVEY_QUESTIONS && !surveyData) {
      fetchSurveyData();
    }
  }, [stage, surveyData]);

  const fetchSurveyData = async () => {
    setIsLoading(true);
    try {
      // Use the public endpoint that doesn't require authentication
      const surveyResponse = await fetch(
        `/api/public/surveys/detail/${defaultSurveyId}`,
      );
      const surveyData = await surveyResponse.json();

      if (surveyData.success && surveyData.survey) {
        setSurveyData(surveyData.survey);

        // Also fetch the questions for this survey
        try {
          const questionsResponse = await fetch(
            `/api/public/surveys/${defaultSurveyId}/questions`,
          );
          const questionsData = await questionsResponse.json();

          if (questionsData.success) {
            setQuestionData(questionsData);
          }
        } catch (questionsError) {
          console.error("Error fetching questions:", questionsError);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load survey data. Please try again.",
          variant: "destructive",
        });
        // Go back to info collection stage
        setStage(AssessmentStage.INFO_COLLECTION);
      }
    } catch (error) {
      console.error("Error fetching survey:", error);
      toast({
        title: "Error",
        description: "Failed to load survey data. Please try again.",
        variant: "destructive",
      });
      // Go back to info collection stage
      setStage(AssessmentStage.INFO_COLLECTION);
    } finally {
      setIsLoading(false);
    }
  };

  // State for showing existing account modal
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [pendingGuestInfo, setPendingGuestInfo] = useState<Omit<StorageGuestUser, "id"> | null>(null);

  const handleInfoSubmit = async (values: Omit<StorageGuestUser, "id">) => {
    setIsLoading(true);
    
    try {
      // Check if user with this email already exists
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(values.email)}`);
      const data = await response.json();
      
      if (data.exists) {
        // User exists - store values temporarily and show login modal
        setPendingGuestInfo(values);
        setShowExistingAccountModal(true);
      } else {
        // Store guest user info in localStorage and proceed
        const savedUser = saveGuestUser(values);
        setGuestUser(savedUser);
        
        // Move to survey questions stage
        setStage(AssessmentStage.SURVEY_QUESTIONS);
      }
    } catch (error) {
      console.error("Error checking email:", error);
      // If check fails, proceed as normal
      const savedUser = saveGuestUser(values);
      setGuestUser(savedUser);
      setStage(AssessmentStage.SURVEY_QUESTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionsSubmit = async (answers: AssessmentAnswer[]) => {
    setIsLoading(true);
    setAnswers(answers);

    try {
      // Use the live-calculated score that's been tracked as the user answers questions
      const score = currentScore > 0 ? currentScore : calculateScore(answers);

      // Create assessment result data for local storage and display
      const assessmentResult: {
        id?: number;
        title: string;
        email?: string;
        name?: string;
        company?: string;
        surveyTemplateId: number;
        answers: AssessmentAnswer[];
        status: string;
        score: number;
      } = {
        title: `${guestUser?.name}'s AI Readiness Assessment`,
        email: guestUser?.email,
        name: guestUser?.name,
        company: guestUser?.company,
        surveyTemplateId: defaultSurveyId,
        answers: answers,
        status: "completed",
        score,
      };

      // Save to server using the public API
      const response = await fetch("/api/public/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${guestUser?.name}'s AI Readiness Assessment`,
          surveyId: defaultSurveyId,
          email: guestUser?.email,
          name: guestUser?.name,
          company: guestUser?.company || "",
          answers: answers,
          status: "completed",
          score,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to save assessment");
      }

      // Store both server ID and local copy
      if (data.assessment?.id) {
        assessmentResult.id = data.assessment.id;
      }

      // Set assessment result to be used in the completion stage
      setAssessmentResult(assessmentResult);

      // Move to completed stage
      setStage(AssessmentStage.COMPLETED);

      // No need to save assessment result in localStorage

      // Clear the answers from localStorage now that we've saved it
      clearGuestAssessmentDataForSurvey(defaultSurveyId);

      toast({
        title: "Assessment Completed",
        description:
          "Your assessment has been saved anonymously for benchmarking purposes.",
      });
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration form submission
  const handleRegistration = async (values: RegistrationFormValues) => {
    setIsSubmitting(true);

    try {
      // Call the register API
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Registration successful
      toast({
        title: "Account created successfully",
        description: "You can now log in with your credentials.",
      });

      // Optional: Automatically log in the user
      window.location.href = "/auth?registered=true";
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to calculate score
  const loadSavedAnswers = (): AssessmentAnswer[] => {
    try {
      const guestUser = getGuestUser();
      if (!guestUser) return [];

      const savedData = getGuestAssessmentData(defaultSurveyId);
      return savedData?.answers || [];
    } catch (error) {
      console.error("Error loading saved answers:", error);
      return [];
    }
  };

  const calculateScore = (answers: AssessmentAnswer[]): number => {
    // Simple scoring algorithm
    const validAnswers = answers.filter(
      (a) => a.a !== undefined && a.a !== null,
    );
    if (validAnswers.length === 0) return 0;

    const total = validAnswers.reduce((sum, answer) => {
      return sum + (answer.a || 0);
    }, 0);

    // Convert to 0-100 scale (normalize from -2 to 2 range)
    const normalized = (total / (validAnswers.length * 2) + 1) * 50;
    return Math.round(normalized);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleLoadPreviousAnswers = () => {
    // Just resume without clearing
    setShowResumeDialog(false);
    setStage(AssessmentStage.SURVEY_QUESTIONS);
  };

  const handleStartFresh = () => {
    // Clear previous answers from localStorage
    clearGuestAssessmentDataForSurvey(defaultSurveyId);
    setHasSavedAnswers(false);
    setShowResumeDialog(false);
    setStage(AssessmentStage.SURVEY_QUESTIONS);
  };

  // Render the appropriate content based on current stage
  const renderContent = () => {
    switch (stage) {
      case AssessmentStage.INFO_COLLECTION:
        return (
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Start Your AI Readiness Assessment</CardTitle>
              <CardDescription>
                Complete this quick survey to evaluate your organization's AI
                readiness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuestAssessmentForm
                onSubmit={handleInfoSubmit}
                isLoading={isLoading}
                onCancel={onClose}
              />
            </CardContent>
          </Card>
        );

      case AssessmentStage.SURVEY_QUESTIONS:
        return (
          <div className="w-full">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading survey questions...</span>
              </div>
            ) : (
              <GuestSurvey
                surveyId={defaultSurveyId}
                guestUser={guestUser || { id: "", name: "", email: "" }}
                hasSavedAnswers={hasSavedAnswers}
                onSubmit={handleQuestionsSubmit}
                onCancel={() => {
                  // Go back to info collection stage and clear ALL guest data (not just survey data)
                  clearGuestAssessmentData(); // Clear all guest data including user info
                  setGuestUser(null); // Reset guest user state
                  setHasSavedAnswers(false); // Reset saved answers flag
                  setAnswers([]); // Clear answers state
                  setStage(AssessmentStage.INFO_COLLECTION);
                }}
                onScoreChange={(score: number) => {
                  // Update the current score in real time as user selects answers
                  setCurrentScore(score);
                }}
              />
            )}
          </div>
        );

      case AssessmentStage.COMPLETED:
        return (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <SurveyCompleted
              assessment={{
                title: surveyData?.title || "AI Readiness Assessment",
                score: assessmentResult?.score || 0,
                answers: assessmentResult?.answers || [],
              }}
              surveyQuestions={questionData?.questions || []}
            />

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
                  // Reset assessment state
                  setGuestUser(null);
                  setAnswers([]);
                  setAssessmentResult(null);
                  setSurveyData(null);
                  setHasSavedAnswers(false);
                  setCurrentScore(0);
                  
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full pt-4">
      {renderContent()}

      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Previous Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              We found a partially completed assessment. Would you like to
              resume where you left off or start a new assessment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              Start New
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadPreviousAnswers}>
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Existing account modal */}
      <AlertDialog open={showExistingAccountModal} onOpenChange={setShowExistingAccountModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              An account with this email already exists. Would you like to log in with your existing account?
              Your assessment data will be saved to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (pendingGuestInfo) {
                // Store guest user info in localStorage and proceed without linking to account
                const savedUser = saveGuestUser(pendingGuestInfo);
                setGuestUser(savedUser);
                setStage(AssessmentStage.SURVEY_QUESTIONS);
              }
              setShowExistingAccountModal(false);
            }}>
              Continue as Guest
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              // Redirect to login page with email prefilled
              if (pendingGuestInfo?.email) {
                window.location.href = `/auth?email=${encodeURIComponent(pendingGuestInfo.email)}`;
              } else {
                window.location.href = '/auth';
              }
            }}>
              Log In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account creation modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Your Account</DialogTitle>
            <DialogDescription>
              Create an account to save your assessment history and track your
              progress over time.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleRegistration)}
              className="space-y-4 py-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Email used for assessment cannot be changed</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSignupModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
