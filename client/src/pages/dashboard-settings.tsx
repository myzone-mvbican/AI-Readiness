import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/schemas/validation-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layout/dashboard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock user data - in a real app, this would come from your auth context or API
const mockUserData = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  company: "Acme Inc",
  employeeCount: "10-49",
  industry: "technology",
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: mockUserData.name,
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const showConfirmPassword = password && password.length > 0;

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setIsSubmitting(true);
      setUpdateSuccess(false);
      
      // Prepare update data - only include non-empty fields
      const updateData: Record<string, any> = {};
      
      if (data.name) updateData.name = data.name;
      if (data.password) updateData.password = data.password;
      
      // Submit to API
      const response = await apiRequest("PUT", `/api/users/${mockUserData.id}`, updateData);
      const result = await response.json();
      
      if (response.ok) {
        setUpdateSuccess(true);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          duration: 3000,
        });
      } else {
        toast({
          title: "Update failed",
          description: result.message || "Failed to update your profile",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account profile information and password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {updateSuccess && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your profile has been updated successfully.
                </AlertDescription>
              </Alert>
            )}
          
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name field */}
              <div className="space-y-1">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email field (disabled) */}
              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={mockUserData.email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  Email address cannot be changed
                </p>
              </div>

              {/* Password field (optional) */}
              <div className="space-y-1">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password field (shown only if password is entered) */}
              {showConfirmPassword && (
                <div className="space-y-1">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              )}
            
              <CardFooter className="flex justify-end px-0 pb-0">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
        
        {/* Additional account information or other settings could go here */}
        <Card className="shadow-sm mt-8">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Your organization details (read-only)
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Company</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {mockUserData.company}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Employee Count</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {mockUserData.employeeCount}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Industry</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {mockUserData.industry === "technology" ? "Technology / Software" : 
                   mockUserData.industry === "healthcare" ? "Healthcare" : 
                   mockUserData.industry === "finance" ? "Finance / Insurance" : 
                   mockUserData.industry}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}