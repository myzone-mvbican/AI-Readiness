import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GuestAssessmentStartRequest } from "@shared/types";

// Form validation schema
const guestAssessmentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
});

type GuestAssessmentFormValues = z.infer<typeof guestAssessmentFormSchema>;

interface GuestAssessmentStartFormProps {
  onClose?: () => void;
}

export function GuestAssessmentStartForm({ onClose }: GuestAssessmentStartFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<GuestAssessmentFormValues>({
    resolver: zodResolver(guestAssessmentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
    },
  });

  const onSubmit = async (values: GuestAssessmentFormValues) => {
    setIsLoading(true);

    try {
      // Get the default public survey ID (this should be fetched from a public API endpoint)
      // For now, we'll use a simplified approach with a single public survey
      const publicSurveyId = 1; // Default public survey ID

      const requestData: GuestAssessmentStartRequest = {
        ...values,
        surveyId: publicSurveyId,
      };

      // Store guest user info in localStorage
      localStorage.setItem("guestUser", JSON.stringify({
        name: values.name,
        email: values.email,
        company: values.company || ""
      }));

      // Redirect to assessment page
      navigate(`/assessment/guest/${publicSurveyId}`);
      
      // If we had an API endpoint for creating a guest session token we would call it here
      // For now, just store data locally and redirect
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error starting guest assessment:", error);
      toast({
        title: "Error",
        description: "Failed to start assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                Enter your full name to personalize your assessment
              </FormDescription>
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
                <Input placeholder="your.email@example.com" type="email" {...field} />
              </FormControl>
              <FormDescription>
                Your email is used to save your assessment results
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your company name" {...field} />
              </FormControl>
              <FormDescription>
                Providing your company helps customize recommendations
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Start Assessment
        </Button>
      </form>
    </Form>
  );
}