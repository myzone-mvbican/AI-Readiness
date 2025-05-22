import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuestUser, clearGuestAssessmentData } from "@/lib/localStorage";
import { AssessmentStage } from ".";
import DialogUserExists from "./dialog-user-exists";

// Form validation schema
const guestAssessmentFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  company: z.string().min(1, { message: "Company name is required" }),
  employeeCount: z.enum(["1-9", "10-49", "50-249", "250-999", "1000+"], {
    errorMap: () => ({ message: "Please select your company size" }),
  }),
  industry: z.enum(
    [
      "technology",
      "healthcare",
      "finance",
      "retail",
      "manufacturing",
      "education",
      "government",
      "energy",
      "transportation",
      "other",
    ],
    {
      errorMap: () => ({ message: "Please select your industry" }),
    },
  ),
});

type GuestAssessmentFormValues = z.infer<typeof guestAssessmentFormSchema>;

interface GuestAssessmentFormProps {
  saveGuestUser: (values: Omit<GuestUser, "id">) => GuestUser;
  setGuestUser: (user: GuestUser | null) => void;
  onCancel?: () => void;
  setStage: (stage: AssessmentStage) => void;
}

export default function GuestAssessmentForm({
  saveGuestUser,
  setGuestUser,
  onCancel,
  setStage,
}: GuestAssessmentFormProps) {
  const [showExistingAccountModal, setShowExistingAccountModal] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<GuestAssessmentFormValues>({
    resolver: zodResolver(guestAssessmentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      employeeCount: undefined,
      industry: undefined,
    },
  });

  const handleSubmit = async (values: GuestAssessmentFormValues) => {
    setIsLoading(true);

    try {
      // Check if user with this email already exists
      const response = await fetch(
        `/api/public/users/exists?email=${encodeURIComponent(values.email)}`,
      );
      const data = await response.json();

      if (data.exists) {
        setShowExistingAccountModal(true);
      } else {
        // Store guest user info in localStorage and proceed
        const savedUser = saveGuestUser(values);
        setGuestUser(savedUser);

        // Move to survey questions stage
        setStage(AssessmentStage.SURVEY_QUESTIONS);
      }
    } catch (error) {
      // If check fails, proceed as normal
      const savedUser = saveGuestUser(values);
      setGuestUser(savedUser);
      setStage(AssessmentStage.SURVEY_QUESTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-lg m-auto">
        <CardHeader>
          <CardTitle>Start Your AI Readiness Assessment</CardTitle>
          <CardDescription>
            Complete this quick survey to evaluate your organization's AI
            readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
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
                        placeholder="you@example.com"
                        {...field}
                      />
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
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Your organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-9">1-9 employees</SelectItem>
                        <SelectItem value="10-49">10-49 employees</SelectItem>
                        <SelectItem value="50-249">50-249 employees</SelectItem>
                        <SelectItem value="250-999">
                          250-999 employees
                        </SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">
                          Manufacturing
                        </SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="energy">Energy</SelectItem>
                        <SelectItem value="transportation">
                          Transportation
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Start Assessment"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* Existing account modal */}
      <DialogUserExists
        open={showExistingAccountModal}
        onOpenChange={setShowExistingAccountModal}
        onCancel={() => {
          clearGuestAssessmentData(); // Clear all guest data including user info
          setGuestUser(null); // Reset guest user state
          setStage(AssessmentStage.INFO_COLLECTION);
        }}
      />
    </>
  );
}
