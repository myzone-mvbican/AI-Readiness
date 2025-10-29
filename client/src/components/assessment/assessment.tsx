import { useEffect, useState, useMemo } from "react";
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
  teams?: { id: number; name: string }[];
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

  // Fetch teams data using React Query
  const { data: teamsData } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teams");
      const { data } = await res.json();
      return data || {};
    },
    select: (data) => data.data || [],
    enabled: assessmentCreateModal.isOpen,
  });

  // Handle team selection and storage events
  useEffect(() => {
    const loadTeamFromStorage = () => {
      const savedTeam = localStorage.getItem("selectedTeam");
      if (savedTeam) {
        try {
          const parsedTeam = JSON.parse(savedTeam);
          // Validate team against actual teams data
          if (teamsData && teamsData.length > 0) {
            const validTeam = teamsData.find((team: any) => team.id === parsedTeam.id);
            if (validTeam) {
              setSelectedTeam(parsedTeam);
            } else {
              console.warn("Selected team not found in teams data, clearing...");
              localStorage.removeItem("selectedTeam");
              setSelectedTeam(null);
            }
          } else {
            // Teams data not loaded yet, set team temporarily
            setSelectedTeam(parsedTeam);
          }
        } catch (e) {
          console.warn("Invalid team data in localStorage, clearing...");
          localStorage.removeItem("selectedTeam");
          setSelectedTeam(null);
        }
      } else {
        setSelectedTeam(null);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "selectedTeam" && assessmentCreateModal.isOpen) {
        if (event.newValue !== null) {
          try {
            const newTeam = JSON.parse(event.newValue);
            setSelectedTeam(newTeam);
          } catch (e) {
            console.error("Error parsing team from storage event:", e);
          }
        } else {
          setSelectedTeam(null);
        }
      }
    };

    // Load team when modal opens
    if (assessmentCreateModal.isOpen) {
      loadTeamFromStorage();
    } else {
      // Reset team state when modal closes
      setSelectedTeam(null);
    }

    // Add storage event listener
    window.addEventListener("storage", handleStorageChange);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [assessmentCreateModal.isOpen, teamsData]);

  const form = useForm<CreateAssessmentFormValues>({
    resolver: zodResolver(createAssessmentFormSchema),
    defaultValues: {
      surveyTemplateId: "",
    },
  });

  // Fetch all surveys for assessment modal
  const { data: allSurveysData, isLoading: isSurveysLoading } = useQuery({
    queryKey: ["/api/surveys/all"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/surveys/all`);
      const { data } = await res.json();
      return data;
    },
    enabled: assessmentCreateModal.isOpen,
    staleTime: 30000,
  });

  // Process surveys to filter for public status
  const processSurveys = (data: any) => {
    return data?.filter((survey: Survey) => survey?.status === "public") || [];
  };

  const allPublicSurveys = processSurveys(allSurveysData);

  // Filter surveys based on team context
  const filteredSurveys = useMemo(() => {
    if (selectedTeam !== null) {
      // When a team is selected, show global surveys + team-specific surveys
      return allPublicSurveys.filter((survey: Survey) => {
        const teams = survey.teams || [];
        const isGlobal = teams.length === 0;
        const isForSelectedTeam = teams.some((team: { id: number; name: string }) => team.id === selectedTeam.id);
        return isGlobal || isForSelectedTeam;
      });
    } else {
      // When no team is selected, show ONLY global surveys
      return allPublicSurveys.filter((survey: Survey) => {
        const teams = survey.teams || [];
        return teams.length === 0;
      });
    }
  }, [allPublicSurveys, selectedTeam, isSurveysLoading, allSurveysData]);

  const surveys = filteredSurveys;
  const availableSurveys = surveys.length > 0;

  // Fetch completion status for surveys
  const { data: completionData, isLoading: isCompletionLoading } = useQuery({
    queryKey: ["/api/surveys/completion-status"],
    enabled: assessmentCreateModal.isOpen && surveys.length > 0,
  });

  const onSubmit = async (values: CreateAssessmentFormValues) => {
    setIsLoading(true);

    try {
      // Check if we have surveys available (either team-specific or global)
      if (surveys.length === 0) {
        toast({
          title: "Error",
          description: "No survey templates are available. Please contact your administrator.",
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
        throw new Error(data.error?.message || "Failed to create assessment");
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
      navigate(`/dashboard/assessments/${data.data.assessment.id}`);

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
          <div className="space-y-4">
            {!selectedTeam && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> No team selected. You're viewing global survey templates available to all users.
                </p>
              </div>
            )}
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
                        <SelectContent key={`surveys-${surveys.length}-${selectedTeam?.id || 'none'}`}>
                          {surveys.map((survey: Survey) => {
                            const status = (completionData as any)?.data?.completionStatus?.[
                              survey.id
                            ];
                            const canTake = status?.canTake !== false;
                            const isLimited = survey.completionLimit !== null;
                            const completionsUsed = status?.completionCount || 0;

                            return (
                              <SelectItem
                                key={survey.id}
                                value={survey.id.toString()}
                                disabled={!canTake}
                              >
                                <div className="flex flex-col items-start">
                                  <span>{survey.title}</span>
                                  {isLimited && (
                                    <span className="text-xs text-muted-foreground">
                                      {canTake
                                        ? `${completionsUsed}/${survey.completionLimit} completions used`
                                        : `Limit reached (${survey.completionLimit}/${survey.completionLimit})`}
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
                    const selectedSurvey = surveys.find(
                      (s: Survey) => s.id.toString() === selectedSurveyId,
                    );
                    const status = selectedSurvey?.id ? (completionData as any)?.data?.completionStatus?.[
                      selectedSurvey.id
                    ] : null;
                    const canTake = !selectedSurvey || status?.canTake !== false;
                    const isLimitReached =
                      selectedSurvey &&
                      selectedSurvey.completionLimit &&
                      !canTake;
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
                              <p>
                                You have reached the completion limit for this
                                survey ({completionCount}/
                                {selectedSurvey.completionLimit})
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return (
                      <Button
                        type="submit"
                        disabled={isLoading || !selectedSurveyId}
                      >
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
