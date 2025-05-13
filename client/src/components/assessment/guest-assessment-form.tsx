import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { GuestAssessmentStartRequest } from "@shared/types";

// Form validation schema
const guestAssessmentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
});

type GuestAssessmentFormValues = z.infer<typeof guestAssessmentFormSchema>;

interface GuestAssessmentFormProps {
  onSubmit: (data: GuestAssessmentFormValues) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function GuestAssessmentForm({ 
  onSubmit, 
  isLoading = false,
  onCancel 
}: GuestAssessmentFormProps) {
  const { toast } = useToast();

  const form = useForm<GuestAssessmentFormValues>({
    resolver: zodResolver(guestAssessmentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
    },
  });

  const handleSubmit = async (values: GuestAssessmentFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
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
                <Input placeholder="your.email@example.com" type="email" {...field} />
              </FormControl>
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
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Assessment
          </Button>
        </div>
      </form>
    </Form>
  );
}