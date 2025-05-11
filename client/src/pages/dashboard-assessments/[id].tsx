import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Loader2, Save, CheckCircle2, AlertTriangle, ChevronLeft, ArrowLeft, ArrowRight } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import { Assessment } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AssessmentResponse {
  success: boolean;
  assessment: Assessment & { survey: { title: string } };
}

interface UpdateAssessmentResponse {
  success: boolean;
  assessment: Assessment;
}

/**
 * Component for rating a survey question
 */
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

function QuestionRating({ 
  question, 
  value, 
  onChange, 
  disabled,
  questionDescription
}: { 
  question: string; 
  value: number | null; 
  onChange: (value: number) => void;
  disabled: boolean;
  questionDescription?: string;
}) {
  const options = [
    { value: -2, label: "Strongly Disagree" },
    { value: -1, label: "Disagree" },
    { value: 0, label: "Neutral" },
    { value: 1, label: "Agree" },
    { value: 2, label: "Strongly Agree" },
  ];

  // Properly handle the equality comparison for the zero value
  const isOptionSelected = (optionValue: number) => {
    if (value === null) return false;
    // Use strict equality to properly compare the value with 0
    return value === optionValue;
  };

  return (
    <div className="py-4">
      <div className="flex items-start mb-3">
        <h3 className="text-md font-medium">{question}</h3>
        {questionDescription && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-2 text-muted-foreground hover:text-foreground">
                  <HelpCircle size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-md p-4">
                <p className="text-sm">{questionDescription}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 rounded-md border ${
              isOptionSelected(option.value)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent hover:text-accent-foreground"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AssessmentDetailPage() {
  const [, params] = useRoute("/dashboard/assessments/:id");
  const [, navigate] = useLocation();
  const assessmentId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Array<{q: string; a: number | null; r?: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  
  // Questions text mapping with descriptions for tooltips
  // In a real application, this would come from your survey template CSV or database
  const assessmentQuestions = [
    {
      text: "We have a clear AI strategy aligned with our business goals",
      description: "A well-defined AI strategy helps prioritize initiatives and ensures resources are allocated efficiently toward business objectives."
    },
    {
      text: "Our organization has invested in AI training for employees",
      description: "Upskilling employees with AI knowledge creates internal champions and reduces resistance to adoption."
    },
    {
      text: "We have implemented AI solutions that demonstrably improve our business processes",
      description: "Successful AI implementations should show measurable improvements in efficiency, cost reduction, or new capabilities."
    },
    {
      text: "Data governance practices in our organization support AI initiatives",
      description: "Strong data governance ensures AI systems have access to high-quality, properly managed data sources."
    },
    {
      text: "We have a pipeline to identify and prioritize AI use cases",
      description: "A systematic approach to identifying use cases helps focus on high-value applications and prevents resource waste."
    },
    {
      text: "Our organization has the necessary technical infrastructure for AI deployment",
      description: "Adequate computing resources, data storage, and integration capabilities are essential for successful AI implementation."
    },
    {
      text: "Our leadership team actively champions AI adoption",
      description: "Executive sponsorship is critical for securing resources and driving organizational change toward AI adoption."
    },
    {
      text: "We have an ethical framework for AI implementation",
      description: "Ethical guidelines help ensure AI systems are developed responsibly and maintain stakeholder trust."
    },
    {
      text: "We measure and track the ROI of our AI investments",
      description: "Clear measurement frameworks help demonstrate value and guide future investment decisions."
    },
    {
      text: "We engage with external AI partners and the wider AI ecosystem",
      description: "External partnerships provide access to specialized expertise and help stay current with rapidly evolving AI technologies."
    },
    {
      text: "We have a dedicated team focused on AI implementation",
      description: "A specialized team can develop expertise and accelerate AI adoption across the organization."
    },
    {
      text: "Our data infrastructure allows for real-time analytics and decision-making",
      description: "Real-time capabilities enable more responsive business operations and improved customer experiences."
    },
    {
      text: "We regularly review and update our AI governance policies",
      description: "As AI technologies and regulations evolve, governance policies must be regularly updated to remain effective."
    },
    {
      text: "We actively monitor for bias in our AI systems",
      description: "Identifying and addressing bias is essential for fair, ethical AI systems that serve all stakeholders."
    },
    {
      text: "We have mechanisms to explain AI decisions to stakeholders",
      description: "Explainability builds trust and helps meet regulatory requirements for transparency."
    }
  ];
  
  // Fetch assessment data
  const {
    data,
    isLoading,
    error,
  } = useQuery<AssessmentResponse>({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !!assessmentId,
    staleTime: 30 * 1000, // 30 seconds
  });
  
  const assessment = data?.assessment;
  
  // Set answers from fetched data
  useEffect(() => {
    if (assessment?.answers) {
      setAnswers(assessment.answers);
    }
  }, [assessment]);
  
  // Find first unanswered question and navigate to it
  useEffect(() => {
    if (answers.length > 0 && assessment && assessment.status !== "completed") {
      // Find the first unanswered question
      const firstUnansweredIndex = answers.findIndex(a => a.a === null);
      
      if (firstUnansweredIndex !== -1) {
        // If there's an unanswered question, go to it
        setCurrentStep(firstUnansweredIndex);
      }
    }
  }, [answers, assessment]);
  
  // Update assessment mutation
  const updateAssessmentMutation = useMutation<
    UpdateAssessmentResponse,
    Error, 
    { status?: string; answers: typeof answers }
  >({
    mutationFn: async (updateData) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/assessments/${assessmentId}`,
        updateData
      );
      return response.json();
    },
    onSuccess: (data, variables) => {
      // If completing the assessment, navigate to results view
      if (variables.status === "completed") {
        toast({
          title: "Assessment completed",
          description: "Your AI readiness assessment has been completed successfully."
        });
        
        // Invalidate queries
        queryClient.invalidateQueries({ 
          queryKey: [`/api/assessments/${assessmentId}`]
        });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/assessments"]
        });
        
        navigate(`/dashboard/assessments`);
      } else {
        // Just saving progress
        toast({
          title: "Progress saved",
          description: "Your progress has been saved."
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error updating assessment",
        description: error.message || "Failed to update assessment. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
      setCompleteDialogOpen(false);
    }
  });
  
  // Handle saving progress
  const handleSave = () => {
    setIsSubmitting(true);
    updateAssessmentMutation.mutate({
      status: "in-progress",
      answers
    });
  };
  
  // Handle completing assessment
  const handleComplete = () => {
    // Check if all questions have been answered
    const allAnswered = answers.every(answer => answer.a !== null);
    
    if (!allAnswered) {
      toast({
        title: "Unable to complete",
        description: "Please answer all questions before completing the assessment.",
        variant: "destructive"
      });
      return;
    }
    
    setCompleteDialogOpen(true);
  };
  
  // Confirm assessment completion
  const confirmComplete = () => {
    setIsSubmitting(true);
    updateAssessmentMutation.mutate({
      status: "completed",
      answers
    });
  };
  
  // Handle updating an answer
  const updateAnswer = (questionIndex: number, value: number) => {
    const newAnswers = [...answers];
    if (newAnswers[questionIndex]) {
      newAnswers[questionIndex] = {
        ...newAnswers[questionIndex],
        a: value
      };
      setAnswers(newAnswers);
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!answers.length) return 0;
    const answeredCount = answers.filter(a => a.a !== null).length;
    return Math.round((answeredCount / answers.length) * 100);
  };
  
  // Get formatted date
  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Function to prepare data for radar chart
  const getRadarChartData = () => {
    if (!assessment || !answers || answers.length === 0) return [];
    
    // Group questions into categories
    const categories = {
      "Strategy & Vision": assessmentQuestions.slice(0, 2),
      "Implementation": assessmentQuestions.slice(2, 4),
      "Data & Information": assessmentQuestions.slice(4, 6),
      "Technology & Integration": assessmentQuestions.slice(6, 8),
      "Skills & Literacy": assessmentQuestions.slice(8, 10), 
      "Governance & Risk": assessmentQuestions.slice(10, 12),
      "Culture & Change-Readiness": assessmentQuestions.slice(12, 15)
    };
    
    // Calculate average score for each category
    const categoryScores = Object.entries(categories).map(([name, questions]) => {
      const questionIndices = questions.map(q => assessmentQuestions.indexOf(q));
      const categoryAnswers = questionIndices.map(idx => idx >= 0 && idx < answers.length ? answers[idx] : null).filter(Boolean);
      
      // Calculate average score
      const sum = categoryAnswers.reduce((acc, ans) => {
        // Convert from -2 to +2 scale to 0 to 10 scale
        const score = ans && ans.a !== null ? ((ans.a + 2) * 2.5) : 0;
        return acc + score;
      }, 0);
      
      const avg = categoryAnswers.length > 0 
        ? Math.round((sum / categoryAnswers.length) * 10) / 10
        : 0;
        
      return {
        subject: name,
        score: avg,
        fullMark: 10,
      };
    });
    
    return categoryScores;
  };
  
  // Is assessment completed?
  const isCompleted = assessment?.status === "completed";
  const progressPercentage = calculateProgress();
  
  // Get status badge
  const getStatusBadge = () => {
    const status = assessment?.status || "";
    
    switch(status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout title="Assessment">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !assessment) {
    return (
      <DashboardLayout title="Assessment">
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/assessments")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Assessments
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load assessment. It may have been deleted or you don't have permission to view it.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/dashboard/assessments")}>
                Return to Assessments
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={assessment.title}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/assessments")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Assessments
          </Button>
          
          {!isCompleted && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Progress
              </Button>
              
              <Button 
                onClick={handleComplete}
                disabled={isSubmitting || progressPercentage < 100}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete Assessment
              </Button>
            </div>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{assessment.title}</CardTitle>
                <CardDescription className="mt-2">
                  Based on: {assessment.survey.title}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge()}
                <span className="text-sm text-muted-foreground">
                  Created: {getFormattedDate(assessment.createdAt)}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {!isCompleted && (
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Completion Progress</span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            
            {assessment.status === "completed" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-6">
                  <div className="bg-green-100 rounded-full p-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Assessment Completed</h2>
                  <p className="text-muted-foreground mt-2">
                    You scored {assessment.score} out of 100 on this AI readiness assessment.
                  </p>
                </div>
                
                <Tabs defaultValue="results" className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="responses">Your Responses</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="results" className="py-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Readiness Score: {assessment.score}/100</CardTitle>
                        <CardDescription>
                          This score represents your organization's current AI readiness level
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Radar Chart */}
                        <div className="py-4">
                          <h3 className="font-medium mb-4">AI Readiness By Category</h3>
                          <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart outerRadius="80%" data={getRadarChartData()}>
                                <PolarGrid strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: 'var(--foreground)' }} />
                                <Radar
                                  name="Organization Score"
                                  dataKey="score"
                                  stroke="var(--primary)"
                                  fill="var(--primary)"
                                  fillOpacity={0.5}
                                />
                                <RechartsTooltip formatter={(value) => [`${value}/10`, 'Score']} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div className="py-4">
                          <h3 className="font-medium mb-2">What This Score Means</h3>
                          <p className="text-muted-foreground">
                            Based on your responses, your organization is at the
                            {assessment.score && assessment.score >= 80
                              ? " advanced "
                              : assessment.score && assessment.score >= 60
                              ? " intermediate "
                              : assessment.score && assessment.score >= 40
                              ? " developing "
                              : " beginning "}
                            stage of AI readiness.
                          </p>
                        </div>
                        
                        <div className="py-4">
                          <h3 className="font-medium mb-2">Recommendations</h3>
                          <p className="text-muted-foreground">
                            Consider focusing on improving your data governance and AI strategy alignment.
                            Regular reassessments every quarter can help track your organization's progress.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="responses">
                    <ScrollArea className="h-[500px] rounded-md border p-4">
                      {answers.map((answer, index) => (
                        <div key={answer.q} className="py-4">
                          <h3 className="font-medium">
                            Question {index + 1}: {assessmentQuestions[index]?.text || `Question ${index + 1}`}
                          </h3>
                          <p className="mt-2">
                            Your answer: {
                              answer.a === 2 ? "Strongly Agree" :
                              answer.a === 1 ? "Agree" :
                              answer.a === 0 ? "Neutral" :
                              answer.a === -1 ? "Disagree" :
                              answer.a === -2 ? "Strongly Disagree" :
                              "Not answered"
                            }
                          </p>
                          <Separator className="my-4" />
                        </div>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Assessment Questions</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      {currentStep + 1} of {answers.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(Math.min(answers.length - 1, currentStep + 1))}
                      disabled={currentStep === answers.length - 1}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
                
                <Card className="border-2 border-muted">
                  <CardContent className="pt-6">
                    {answers.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold">
                          Question {currentStep + 1} of {answers.length}
                        </h3>
                        
                        {/* Display the question text with tooltip */}
                        <p className="text-lg mb-6">
                          {assessmentQuestions[currentStep]?.text || `Question ${currentStep + 1}`}
                        </p>
                        
                        <QuestionRating
                          question="What is your level of agreement with this statement?"
                          value={answers[currentStep]?.a || null}
                          onChange={(value) => updateAnswer(currentStep, value)}
                          disabled={isSubmitting}
                          questionDescription={assessmentQuestions[currentStep]?.description}
                        />
                        
                        <div className="flex justify-between mt-6 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Button>
                          
                          <Button
                            onClick={() => setCurrentStep(Math.min(answers.length - 1, currentStep + 1))}
                            disabled={currentStep === answers.length - 1}
                          >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important Note</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your answers are saved when you click "Save Progress". To finalize your assessment,
                      answer all questions and click "Complete Assessment". Completed assessments cannot be modified.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          {!isCompleted && (
            <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard/assessments")}
              >
                Cancel
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Progress
                </Button>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-block">
                        <Button 
                          onClick={handleComplete}
                          disabled={isSubmitting || progressPercentage < 100}
                          className={(progressPercentage < 100) ? "opacity-50" : ""}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Complete Assessment
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-2">
                      {progressPercentage < 100 
                        ? "Please answer all questions to complete the assessment" 
                        : "Complete assessment and view results"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
      
      {/* Confirmation Dialog for Completing Assessment */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to complete this assessment? Once completed, you won't be able to make any further changes.
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
    </DashboardLayout>
  );
}