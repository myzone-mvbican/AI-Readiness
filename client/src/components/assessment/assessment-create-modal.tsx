import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAssessmentCreateModal } from "@/hooks/use-assessment-create-modal";

interface Survey {
  id: number;
  title: string;
  description: string;
  status: string;
  version: string;
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
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  surveyTemplateId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Please select a survey template",
  }),
});

type CreateAssessmentFormValues = z.infer<typeof createAssessmentFormSchema>;

export function AssessmentCreateModal() {
  const assessmentCreateModal = useAssessmentCreateModal();
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
      title: "",
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
            (team: { id: number }) => team.id === selectedTeamData.id
          );
          
          if (!teamExists) {
            console.log("Selected team no longer accessible, clearing selection");
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
  const { 
    data: surveysData, 
    isLoading: isSurveysLoading
  } = useQuery({
    queryKey: ["/api/surveys", teamId],
    enabled: assessmentCreateModal.isOpen,
  });

  // Handle survey error fallback
  useEffect(() => {
    // Check if we have a query error by seeing if surveys is missing but should be loaded
    if (isSurveysLoading === false && !surveysData && teamId !== 0) {
      console.warn(`Possible issue with team ${teamId}, falling back to global surveys`);
      
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

  // Process the surveys data to get public surveys
  const publicSurveys = ((surveysData as any)?.success && Array.isArray((surveysData as any)?.surveys))
    ? (surveysData as any).surveys.filter((survey: Survey) => survey.status === "public")
    : [];
    
  // Set surveys state - this allows the component to use the same variable name as before
  const surveys = publicSurveys;

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
        title: values.title,
        surveyTemplateId: parseInt(values.surveyTemplateId),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create assessment");
      }

      // Invalidate assessments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });

      // Close the modal
      assessmentCreateModal.onClose();

      // Reset the form
      form.reset();

      // Navigate to the assessment page
      navigate(`/dashboard/assessments/${data.assessment.id}`);

      toast({
        title: "Success",
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
          <DialogTitle>Start New Assessment</DialogTitle>
          <DialogDescription>
            Choose a survey template to begin your AI readiness assessment.
          </DialogDescription>
        </DialogHeader>

        {isSurveysLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading survey templates...</span>
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Title</FormLabel>
                    <FormControl>
                      <Input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter assessment title"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your assessment a descriptive title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surveyTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Survey Template</FormLabel>
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
                        {surveys.map((survey: Survey) => (
                          <SelectItem
                            key={survey.id}
                            value={survey.id.toString()}
                          >
                            {survey.title}
                          </SelectItem>
                        ))}
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
                  onClick={assessmentCreateModal.onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Start Assessment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
