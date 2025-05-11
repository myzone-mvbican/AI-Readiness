import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FilePlus, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SurveyTemplate {
  id: number;
  title: string;
  questionsCount: number;
  status: string;
}

interface SurveysResponse {
  success: boolean;
  surveys: SurveyTemplate[];
}

interface CreateAssessmentResponse {
  success: boolean;
  assessment: {
    id: number;
    title: string;
  };
}

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  surveyTemplateId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Please select a survey template",
  }),
});

interface AssessmentCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssessmentCreateModal({
  open,
  onOpenChange,
}: AssessmentCreateModalProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available survey templates for public (global) surveys
  const { data: surveysData, isLoading: isLoadingSurveys } =
    useQuery<SurveysResponse>({
      queryKey: ["/api/surveys", 0], // Using 0 to fetch global surveys
      staleTime: 60 * 1000, // 1 minute
      enabled: open, // Only fetch when modal is open
    });

  // Only show public surveys as templates
  const availableSurveys =
    surveysData?.surveys.filter((survey) => survey.status === "public") || [];

  // If there's only one survey and the modal is open, auto-create the assessment with that survey
  useEffect(() => {
    if (open && !isLoadingSurveys && availableSurveys.length === 1) {
      // Auto-create assessment with the single available survey
      const title = `${availableSurveys[0].title} - ${new Date().toLocaleDateString()}`;
      handleAutoCreate(availableSurveys[0].id.toString(), title);
    }
  }, [open, isLoadingSurveys, availableSurveys.length]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      surveyTemplateId: "",
    },
  });

  // Create assessment mutation
  const createAssessmentMutation = useMutation<
    CreateAssessmentResponse,
    Error,
    z.infer<typeof formSchema>
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/assessments", {
        title: data.title,
        surveyTemplateId: parseInt(data.surveyTemplateId, 10),
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assessment created",
        description: "Your new assessment has been created successfully.",
      });
      
      // Invalidate assessments cache
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      
      // Close the modal
      onOpenChange(false);
      
      // Navigate to the assessment
      navigate(`/dashboard/assessments/${data.assessment.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating assessment",
        description: error.message || "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle auto-create for single survey scenario
  async function handleAutoCreate(surveyTemplateId: string, title: string) {
    setIsSubmitting(true);
    createAssessmentMutation.mutate({ surveyTemplateId, title });
  }

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    createAssessmentMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FilePlus className="mr-2 h-5 w-5" />
            Create New Assessment
          </DialogTitle>
          <DialogDescription>
            Start a new AI readiness assessment based on a survey template.
          </DialogDescription>
        </DialogHeader>

        {isLoadingSurveys ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading survey templates...</span>
          </div>
        ) : availableSurveys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No survey templates available.</p>
            <p className="mt-2">
              Please contact an administrator to create survey templates.
            </p>
          </div>
        ) : availableSurveys.length > 1 ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="surveyTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Survey Template</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a survey template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSurveys.map((survey) => (
                          <SelectItem
                            key={survey.id}
                            value={survey.id.toString()}
                          >
                            {survey.title} ({survey.questionsCount} questions)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the survey template for this assessment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Title</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g., Q2 2025 AI Readiness Assessment"
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

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Assessment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Creating assessment...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}