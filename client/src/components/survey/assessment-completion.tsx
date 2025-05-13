import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Download, BarChart, RefreshCw, CheckCircle2, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AssessmentAnswer } from "@shared/types";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Tooltip as RechartsTooltip,
  ResponsiveContainer 
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Registration form schema
const registrationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password" }),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface AssessmentCompletionProps {
  assessment: any;
  survey: any;
  guestMode?: boolean;
  onSignUp?: (data: RegistrationFormValues) => void;
  onStartNew?: () => void;
}

export function AssessmentCompletion({
  assessment,
  survey,
  guestMode = false,
  onSignUp,
  onStartNew,
}: AssessmentCompletionProps) {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize react-hook-form with zod validation
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: assessment?.name || "",
      email: assessment?.email || "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle registration form submission
  const handleRegistration = (values: RegistrationFormValues) => {
    setIsSubmitting(true);
    
    if (onSignUp) {
      onSignUp(values);
    } else {
      // Fallback if onSignUp not provided
      window.location.href = "/auth?mode=register";
    }
  };

  if (!assessment) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p>Assessment data not available.</p>
        </CardContent>
      </Card>
    );
  }

  const score = assessment.score || 0;
  const getScoreColor = (score: number) => {
    if (score < 30) return "text-red-500";
    if (score < 60) return "text-amber-500";
    return "text-green-500";
  };

  const getProgressColor = (score: number) => {
    if (score < 30) return "bg-red-500";
    if (score < 60) return "bg-amber-500";
    return "bg-green-500";
  };

  const getAssessmentSummary = (score: number) => {
    if (score < 30) {
      return "Your organization is in the early stages of AI readiness. Focus on building foundational capabilities, including data infrastructure and basic AI awareness.";
    } else if (score < 60) {
      return "Your organization has made some progress toward AI readiness. Continue to develop your data strategy, upskill your workforce, and explore AI use cases.";
    } else {
      return "Your organization demonstrates strong AI readiness. Focus on scaling your AI initiatives, refining governance practices, and staying ahead of emerging AI trends.";
    }
  };

  // Process assessment data for the radar chart
  const processChartData = () => {
    // Group answers by category
    const categoryScores: Record<string, { sum: number, count: number }> = {};
    
    assessment.answers.forEach((answer: AssessmentAnswer) => {
      // Find the question to get its category
      const question = survey?.questions?.find((q: any) => q.id === answer.q);
      if (!question || answer.a === null) return;
      
      const category = question.category || "Uncategorized";
      
      if (!categoryScores[category]) {
        categoryScores[category] = { sum: 0, count: 0 };
      }
      
      // Convert -2 to 2 scale to 0 to 100
      const normalizedValue = ((answer.a + 2) / 4) * 100;
      categoryScores[category].sum += normalizedValue;
      categoryScores[category].count += 1;
    });
    
    // Calculate averages and format for chart
    return Object.entries(categoryScores).map(([category, { sum, count }]) => ({
      category,
      value: Math.round(sum / count),
    }));
  };

  const chartData = processChartData();

  return (
    <>
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Assessment Results</CardTitle>
          <CardDescription>
            Your AI Readiness assessment has been completed
          </CardDescription>
          
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Overall Score</h3>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </span>
                  <span className="text-sm text-muted-foreground pb-1">/100</span>
                </div>
              </div>
              
              <Progress 
                value={score} 
                max={100} 
                className="w-full sm:w-2/3 h-8" 
                indicatorClassName={getProgressColor(score)}
              />
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Assessment Summary</h3>
              <p className="text-muted-foreground">
                {getAssessmentSummary(score)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList className="mb-4">
              <TabsTrigger value="chart">
                <BarChart className="h-4 w-4 mr-2" />
                Results Chart
              </TabsTrigger>
              <TabsTrigger value="responses">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Your Responses
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart">
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-video h-[400px]">
                    <ChartContainer className="h-full">
                      <RadarChart 
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                        className="m-auto"
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" tick={{ fill: '#888', fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Your Score"
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.4}
                        />
                        <RechartsTooltip />
                      </RadarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="responses">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                {assessment.answers && assessment.answers.map((answer: AssessmentAnswer, index: number) => {
                  // Get the question
                  const questionNumber = answer.q;
                  const question = survey?.questions?.find((q: any) => q.id === questionNumber);
                  if (!question) return null;
                  
                  // Calculate answer value text
                  const answerValue = answer.a;
                  let answerText = "Not answered";
                  if (answerValue === -2) answerText = "Strongly Disagree";
                  else if (answerValue === -1) answerText = "Disagree";
                  else if (answerValue === 0) answerText = "Neutral";
                  else if (answerValue === 1) answerText = "Agree";
                  else if (answerValue === 2) answerText = "Strongly Agree";
                  
                  return (
                    <div key={index} className="mb-4">
                      <p className="font-medium">{question.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">Your answer: {answerText}</p>
                      <Separator className="my-2" />
                    </div>
                  );
                })}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-wrap justify-center gap-4 mt-4">
          {guestMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="w-full sm:w-auto px-6"
                    onClick={() => setShowSignupModal(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Create an account to track your progress, <br />view assessment history, and get personalized recommendations</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button
            variant="outline"
            className="w-full sm:w-auto px-6"
            onClick={() => {
              // Download feature would be implemented here
              alert("Download functionality would be implemented here");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          
          {onStartNew && (
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6"
              onClick={onStartNew}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Start New Assessment
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Account creation modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Your Account</DialogTitle>
            <DialogDescription>
              Create an account to save your assessment history and track your progress over time.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegistration)} className="space-y-4 py-2">
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
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
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
                      <Input type="password" placeholder="Create a password" {...field} />
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
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowSignupModal(false)}>
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
    </>
  );
}