import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
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
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isSurveysLoading, setIsSurveysLoading] = useState(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<TeamWithRole | null>(null);

  // Load selected team from localStorage whenever the modal opens
  useEffect(() => {
    // Only load team when the modal is opened
    if (assessmentCreateModal.isOpen) {
      const savedTeam = localStorage.getItem("selectedTeam");
      if (savedTeam) {
        try {
          setSelectedTeam(JSON.parse(savedTeam));
        } catch (e) {
          console.error("Error parsing saved team:", e);
          setSelectedTeam(null);
        }
      } else {
        setSelectedTeam(null);
      }
    }
  }, [assessmentCreateModal.isOpen]);

  const form = useForm<CreateAssessmentFormValues>({
    resolver: zodResolver(createAssessmentFormSchema),
  });

  useEffect(() => {
    const fetchSurveys = async () => {
      // First clear any existing surveys to avoid stale data
      setSurveys([]);
      setIsSurveysLoading(true);
      
      try {
        // Get the teamId from localStorage, or use 0 for global surveys
        const teamId = selectedTeam?.id || 0;
        console.log(`Fetching surveys for team ID: ${teamId}`);
        
        const response = await apiRequest("GET", `/api/surveys/${teamId}`);
        const data = await response.json();

        if (data.success) {
          // Filter published surveys
          const filteredSurveys = data.surveys.filter(
            (survey: Survey) => survey.status === "public",
          );

          console.log(`Found ${filteredSurveys.length} published surveys for team ${teamId}`);
          setSurveys(filteredSurveys);
        } else {
          console.error("API returned error:", data.message);
          toast({
            title: "Error",
            description: data.message || "Failed to load survey templates",
            variant: "destructive",
          });
          // Reset surveys to empty array on error
          setSurveys([]);
        }
      } catch (error: any) {
        console.error("Error fetching surveys:", error.message || error);
        toast({
          title: "Error",
          description: error.message || "Failed to load survey templates",
          variant: "destructive",
        });
        // Reset surveys to empty array on error
        setSurveys([]);
      } finally {
        setIsSurveysLoading(false);
      }
    };

    // Only fetch surveys if modal is open and we have team information
    if (assessmentCreateModal.isOpen) {
      fetchSurveys();
    }
  }, [assessmentCreateModal.isOpen, toast, selectedTeam]);

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

      console.log(`Creating assessment for team: ${selectedTeam.id} (${selectedTeam.name}), survey: ${values.surveyTemplateId}`);
      
      const response = await apiRequest("POST", "/api/assessments", {
        title: values.title,
        surveyTemplateId: parseInt(values.surveyTemplateId),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
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
      console.error("Error creating assessment:", error);
      
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
            console.error("Error parsing saved team:", e);
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
                      <input
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
                        {surveys.map((survey) => (
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
