import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAssessment } from "@/hooks/use-assessment";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Survey {
  id: number;
  title: string;
  description: string;
  status: string;
  version: string;
  completionLimit: number | null;
}

// Type definition for selected team
interface TeamWithRole {
  id: number;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const createAssessmentFormSchema = z.object({
  surveyTemplateId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Please select a survey template",
  }),
});

type CreateAssessmentFormValues = z.infer<typeof createAssessmentFormSchema>;

export function Assessment() {
  const assessmentCreateModal = useAssessment();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<TeamWithRole | null>(null);

  // Load selected team from localStorage whenever the modal opens
  useEffect(() => {
    // Only load team when the modal is opened
    if (assessmentCreateModal.isOpen) {
      // Check if we have a token (are logged in)
      const currentToken = localStorage.getItem("token");

      // If no token is present, don't load any team selection
      if (!currentToken) {
        localStorage.removeItem("selectedTeam");
        setSelectedTeam(null);
        return;
      }

      const savedTeam = localStorage.getItem("selectedTeam");
      if (savedTeam) {
        try {
          setSelectedTeam(JSON.parse(savedTeam));
        } catch (e) {
          setSelectedTeam(null);
        }
      } else {
        setSelectedTeam(null);
      }
    }
  }, [assessmentCreateModal.isOpen]);

  const form = useForm<CreateAssessmentFormValues>({
    resolver: zodResolver(createAssessmentFormSchema),
    defaultValues: {
      surveyTemplateId: "",
    },
  });

  // Fetch teams data using React Query
  const { data: teamsData } = useQuery({
    queryKey: ["/api/teams"],
    enabled: assessmentCreateModal.isOpen,
  });

  // Effect to handle team verification when teams data changes
  useEffect(() => {
    if (teamsData && (teamsData as any).success) {
      const storedTeam = localStorage.getItem("selectedTeam");
      if (storedTeam) {
        try {
          const selectedTeamData = JSON.parse(storedTeam);
          const teamExists = (teamsData as any).teams.some(
            (team: { id: number }) => team.id === selectedTeamData.id,
          );

          if (!teamExists) {
            console.warn("Selected team no longer accessible.");
            localStorage.removeItem("selectedTeam");
            setSelectedTeam(null);
          }
        } catch (e) {
          localStorage.removeItem("selectedTeam");
          setSelectedTeam(null);
        }
      }
    }
  }, [teamsData]);

  // Get team ID for surveys query
  const teamId = selectedTeam?.id || 0;

  // Fetch surveys based on selected team
  const { data: surveysData, isLoading: isSurveysLoading } = useQuery({
    queryKey: ["/api/surveys", teamId],
    enabled: assessmentCreateModal.isOpen,
  });

  // Process the surveys data to get public surveys first
  const publicSurveys =
    (surveysData as any)?.success &&
    Array.isArray((surveysData as any)?.surveys)
      ? (surveysData as any).surveys.filter(
          (survey: Survey) => survey.status === "public",
        )
      : [];

  // Set surveys state - this allows the component to use the same variable name as before
  const surveys = publicSurveys;

  // Fetch completion status for surveys
  const { data: completionData } = useQuery({
    queryKey: ["/api/surveys/completion-status"],
    enabled: assessmentCreateModal.isOpen && surveys.length > 0,
  });

  // Handle survey error fallback
  useEffect(() => {
    // Check if we have a token (are logged in)
    const currentToken = localStorage.getItem("token");

    // If no token is present, do nothing
    if (!currentToken) {
      return;
    }

    // Check if we have a query error by seeing if surveys is missing but should be loaded
    if (isSurveysLoading === false && !surveysData && teamId !== 0) {
      // Clear the selected team since it's no longer accessible
      setSelectedTeam(null);
      localStorage.removeItem("selectedTeam");

      // Invalidate the global surveys query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/surveys", 0] });

      toast({
        title: "Team access error",
        description: "Falling back to global surveys",
        variant: "destructive",
      });
    }
  }, [surveysData, isSurveysLoading, teamId, queryClient, toast]);



  const onSubmit = async (values: CreateAssessmentFormValues) => {
    setIsLoading(true);

    try {
      // Make sure we have a team selected before creating the assessment
      if (!selectedTeam) {
        toast({
          title: "Error",
          description: "No team selected. Please select a team first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await apiRequest("POST", "/api/assessments", {
        surveyTemplateId: parseInt(values.surveyTemplateId),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create assessment");
      }

      // Invalidate assessments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      // Invalidate completion status to update survey availability
      queryClient.invalidateQueries({ queryKey: ["/api/surveys/completion-status"] });

      // Close the modal
      assessmentCreateModal.onClose();

      // Reset the form
      form.reset();

      // Navigate to the assessment page
      navigate(`/dashboard/assessments/${data.assessment.id}`);

      toast({
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
        title: "Awesome",
        description: "Assessment created successfully",
      });
    } catch (error: any) {
      // Provide specific error message to the user
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create assessment. Please try again.",
        variant: "destructive",
      });

      // If the error is related to team access, let's refresh the team data
      if (error.message && error.message.includes("access to this team")) {
        // Refresh localStorage team data
        const savedTeam = localStorage.getItem("selectedTeam");
        if (savedTeam) {
          try {
            setSelectedTeam(JSON.parse(savedTeam));
          } catch (e) {
            // Clear invalid team data
            localStorage.removeItem("selectedTeam");
            setSelectedTeam(null);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const availableSurveys = surveys.length > 0;

  return (
    <Dialog
      open={assessmentCreateModal.isOpen}
      onOpenChange={assessmentCreateModal.onClose}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Start New Assessment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a survey template to begin your AI readiness assessment.
          </DialogDescription>
        </DialogHeader>

        {isSurveysLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-foreground">
              Loading survey templates...
            </span>
          </div>
        ) : !availableSurveys ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              No survey templates are available. Please contact your
              administrator.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              <FormField
                control={form.control}
                name="surveyTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Survey Template
                    </FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a survey template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {surveys.map((survey: Survey) => {
                          const status = (completionData as any)?.data?.[survey.id];
                          const canTake = status?.canTake !== false;
                          const isLimited = survey.completionLimit !== null;
                          const completionsUsed = status?.completionCount || 0;
                          
                          return (
                            <SelectItem
                              key={survey.id}
                              value={survey.id.toString()}
                              disabled={!canTake}
                            >
                              <div className="flex flex-col">
                                <span>{survey.title}</span>
                                {isLimited && (
                                  <span className="text-xs text-muted-foreground">
                                    {canTake 
                                      ? `${completionsUsed}/${survey.completionLimit} completions used`
                                      : `Limit reached (${survey.completionLimit}/${survey.completionLimit})`
                                    }
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the assessment template you want to complete
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="text-foreground"
                  onClick={assessmentCreateModal.onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                {(() => {
                  const selectedSurveyId = form.watch("surveyTemplateId");
                  const selectedSurvey = surveys.find((s: Survey) => s.id.toString() === selectedSurveyId);
                  const status = (completionData as any)?.data?.[selectedSurvey?.id];
                  const canTake = !selectedSurvey || status?.canTake !== false;
                  const isLimitReached = selectedSurvey && selectedSurvey.completionLimit && !canTake;
                  const completionCount = status?.completionCount || 0;

                  if (isLimitReached) {
                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button type="submit" disabled={true}>
                                {isLoading && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Start Assessment
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>You have reached the completion limit for this survey ({completionCount}/{selectedSurvey.completionLimit})</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return (
                    <Button type="submit" disabled={isLoading || !selectedSurveyId}>
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Start Assessment
                    </Button>
                  );
                })()}
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
