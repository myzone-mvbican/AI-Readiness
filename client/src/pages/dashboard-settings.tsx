import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layout/dashboard";
import { GoogleLogin } from '@react-oauth/google';

import {
  settingsSchema,
  type SettingsFormValues,
} from "@/schemas/validation-schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { toast } = useToast();
  const { 
    user, 
    googleConnectMutation, 
    googleDisconnectMutation 
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);
  const [initialFormData, setInitialFormData] =
    useState<SettingsFormValues | null>(null);
    
  // Google authentication handlers
  const handleGoogleSuccess = useCallback((credentialResponse: any) => {
    setIsConnectingGoogle(true);
    googleConnectMutation.mutate(
      { credential: credentialResponse.credential },
      {
        onSettled: () => setIsConnectingGoogle(false)
      }
    );
  }, [googleConnectMutation]);
  
  const handleGoogleError = useCallback(() => {
    toast({
      title: "Google Sign-In Failed",
      description: "There was a problem connecting your Google account.",
      variant: "destructive"
    });
  }, [toast]);
  
  const handleDisconnectGoogle = useCallback(() => {
    setIsDisconnectingGoogle(true);
    googleDisconnectMutation.mutate(undefined, {
      onSettled: () => setIsDisconnectingGoogle(false)
    });
  }, [googleDisconnectMutation]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
    control,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      company: "",
      employeeCount: undefined,
      industry: undefined,
      password: "",
      confirmPassword: "",
    },
  });

  // Load user data when available
  useEffect(() => {
    if (user) {
      const formData = {
        name: user.name || "",
        company: user.company || "",
        employeeCount: (user.employeeCount as any) || undefined,
        industry: (user.industry as any) || undefined,
        password: "",
        confirmPassword: "",
      };

      // Set initial form data for dirty check comparison
      setInitialFormData(formData);

      // Reset form with user data
      reset(formData);
    }
  }, [user, reset]);

  const password = watch("password");
  const showConfirmPassword = password && password.length > 0;

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare update data - only include fields that have changed
      const updateData: Record<string, any> = {};

      if (data.name !== initialFormData?.name) updateData.name = data.name;
      if (data.company !== initialFormData?.company)
        updateData.company = data.company;
      if (data.employeeCount !== initialFormData?.employeeCount)
        updateData.employeeCount = data.employeeCount;
      if (data.industry !== initialFormData?.industry)
        updateData.industry = data.industry;

      // Only include password if it's not empty
      if (data.password) updateData.password = data.password;

      // Submit to API
      const response = await apiRequest("PUT", `/api/user`, updateData);
      const result = await response.json();

      if (response.ok) {
        // Update with the latest user data returned from the server
        const updatedUser = result.user;

        // Update the user data in the auth context
        queryClient.setQueryData(["/api/user"], updatedUser);

        // Create a new form data object from the updated user
        const updatedFormData = {
          name: updatedUser.name || "",
          company: updatedUser.company || "",
          employeeCount: (updatedUser.employeeCount as any) || undefined,
          industry: (updatedUser.industry as any) || undefined,
          password: "",
          confirmPassword: "",
        };

        // Update initial form data to reflect the new state from the server
        setInitialFormData(updatedFormData);

        // Reset form with updated data but clear password fields
        reset(updatedFormData);

        toast({
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
          title: "Success",
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
        description:
          "There was a problem updating your profile. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Account Settings">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Two-column settings layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profile section */}
          <div className="md:col-span-1">
            <div className="sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Update your personal information and password
              </p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                {/* Name field */}
                <div className="space-y-1 mb-6">
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
                <div className="space-y-1 mb-6">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">
                    Email address cannot be changed
                  </p>
                </div>

                {/* Password field (optional) */}
                <div className="space-y-1 mb-6">
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
              </CardContent>
            </Card>
          </div>

          {/* Company Information section */}
          <div className="md:col-span-1">
            <div className="sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Company Information
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Your organization details
              </p>
            </div>
          </div>

          <div className="md:col-span-3">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Company field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="company"
                      className="text-sm font-medium text-gray-700"
                    >
                      Company
                    </Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Your company name"
                      {...register("company")}
                      className={errors.company ? "border-red-500" : ""}
                    />
                    {errors.company && (
                      <p className="text-sm text-red-500">
                        {errors.company.message}
                      </p>
                    )}
                  </div>

                  {/* Employee Count field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="employeeCount"
                      className="text-sm font-medium text-gray-700"
                    >
                      Employee Count
                    </Label>
                    <Controller
                      name="employeeCount"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="employeeCount"
                            className={
                              errors.employeeCount ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select employee count" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-9">1-9 employees</SelectItem>
                            <SelectItem value="10-49">
                              10-49 employees
                            </SelectItem>
                            <SelectItem value="50-249">
                              50-249 employees
                            </SelectItem>
                            <SelectItem value="250-999">
                              250-999 employees
                            </SelectItem>
                            <SelectItem value="1000+">
                              1000+ employees
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.employeeCount && (
                      <p className="text-sm text-red-500">
                        {errors.employeeCount.message}
                      </p>
                    )}
                  </div>

                  {/* Industry field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="industry"
                      className="text-sm font-medium text-gray-700"
                    >
                      Industry
                    </Label>
                    <Controller
                      name="industry"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="industry"
                            className={errors.industry ? "border-red-500" : ""}
                          >
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">
                              Technology / Software
                            </SelectItem>
                            <SelectItem value="healthcare">
                              Healthcare
                            </SelectItem>
                            <SelectItem value="finance">
                              Finance / Insurance
                            </SelectItem>
                            <SelectItem value="retail">
                              Retail / E-commerce
                            </SelectItem>
                            <SelectItem value="manufacturing">
                              Manufacturing
                            </SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="government">
                              Government
                            </SelectItem>
                            <SelectItem value="energy">
                              Energy / Utilities
                            </SelectItem>
                            <SelectItem value="transportation">
                              Transportation / Logistics
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.industry && (
                      <p className="text-sm text-red-500">
                        {errors.industry.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save settings button - full width at the bottom */}
        <div className="mt-10 border-t pt-6">
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
