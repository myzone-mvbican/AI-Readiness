import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndustrySelect } from "@/components/industries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  GuestUser as StorageGuestUser,
  clearGuestAssessmentData,
} from "@/lib/localStorage";
import { SignupFormValues, signupSchema } from "@/schemas/validation-schemas";
import { IndustryCode } from "@/lib/industry-validation";
import { navigate } from "wouter/use-browser-location";

interface DialogUserCreateProps {
  open: boolean;
  closeModal: () => void;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
  guestUser: StorageGuestUser | null;
}

export default function DialogUserExists({
  open,
  closeModal,
  onOpenChange,
  guestUser,
}: DialogUserCreateProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form with zod validation
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: guestUser?.name || "",
      email: guestUser?.email || "",
      company: guestUser?.company || "",
      employeeCount: (guestUser?.employeeCount as "1-9" | "10-49" | "50-249" | "250-999" | "1000+") || "10-49",
      industry: (guestUser?.industry as IndustryCode) || "541511",
      password: "",
      confirmPassword: "",
    },
  });

  // Update form values when guest user changes or when signup modal opens
  useEffect(() => {
    if (guestUser) {
      form.setValue("name", guestUser.name || "");
      form.setValue("email", guestUser.email || "");
      form.setValue("company", guestUser.company || "");
      form.setValue("employeeCount", (guestUser.employeeCount as "1-9" | "10-49" | "50-249" | "250-999" | "1000+") || "10-49");
      form.setValue("industry", (guestUser.industry as IndustryCode) || "541511");
    }
  }, [guestUser, form, open]);

  // Handle registration form submission
  const handleRegistration = async (values: SignupFormValues) => {
    setIsSubmitting(true);

    try {
      // Call the register API
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      closeModal();

      // Registration successful
      toast({
        title: "Account created",
        description:
          "Your assessment has been linked to your new account. You can now log in with your credentials.",
        action: (
          <ToastAction
            altText="Go to Authentification"
            onClick={() => {
              navigate("/auth");
            }}
          >
            Login
          </ToastAction>
        ),
      });

      // Clear the guest data from localStorage
      clearGuestAssessmentData();
    } catch (error) {
      toast({
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>
            Create an account to save your assessment history and track your
            progress over time.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleRegistration as any)}
            className="space-y-4 py-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Email used for assessment cannot be changed
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Your Company"
                        {...field}
                      />
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
                    <IndustrySelect
                      field={field}
                      formControl={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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
  );
}
