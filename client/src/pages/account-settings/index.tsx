import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layout/dashboard";
import { GoogleLogin } from "@react-oauth/google";
import { MicrosoftLoginButton } from "@/components/microsoft-login-button";

import {
  settingsSchema,
  type SettingsFormValues,
} from "@shared/validation/validation-schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndustrySelect } from "@/components/industries";

export default function SettingsPage() {
  const { toast } = useToast();
  const {
    user,
    googleConnectMutation,
    googleDisconnectMutation,
    microsoftConnectMutation,
    microsoftDisconnectMutation,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);
  const [isConnectingMicrosoft, setIsConnectingMicrosoft] = useState(false);
  const [isDisconnectingMicrosoft, setIsDisconnectingMicrosoft] =
    useState(false);
  const [initialFormData, setInitialFormData] =
    useState<SettingsFormValues | null>(null);

  // Check if OAuth secrets are configured
  const hasGoogleOAuth = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasMicrosoftOAuth = !!import.meta.env.VITE_MICROSOFT_CLIENT_ID;

  // Google authentication handlers
  const handleGoogleSuccess = useCallback(
    (credentialResponse: any) => {
      setIsConnectingGoogle(true);
      googleConnectMutation.mutate(
        { credential: credentialResponse.credential },
        {
          onSettled: () => setIsConnectingGoogle(false),
        },
      );
    },
    [googleConnectMutation],
  );

  const handleGoogleError = useCallback(() => {
    toast({
      title: "Google Sign-In Failed",
      description: "There was a problem connecting your Google account.",
      variant: "destructive",
    });
  }, [toast]);

  const handleDisconnectGoogle = useCallback(() => {
    setIsDisconnectingGoogle(true);
    googleDisconnectMutation.mutate(undefined, {
      onSettled: () => setIsDisconnectingGoogle(false),
    });
  }, [googleDisconnectMutation]);

  // Microsoft authentication handlers
  const handleMicrosoftSuccess = useCallback(
    (credentialResponse: any) => {
      setIsConnectingMicrosoft(true);
      microsoftConnectMutation.mutate(
        { credential: credentialResponse.credential },
        {
          onSettled: () => setIsConnectingMicrosoft(false),
        },
      );
    },
    [microsoftConnectMutation],
  );

  const handleMicrosoftError = useCallback(() => {
    toast({
      title: "Microsoft Sign-In Failed",
      description: "There was a problem connecting your Microsoft account.",
      variant: "destructive",
    });
  }, [toast]);

  const handleDisconnectMicrosoft = useCallback(() => {
    setIsDisconnectingMicrosoft(true);
    microsoftDisconnectMutation.mutate(undefined, {
      onSettled: () => setIsDisconnectingMicrosoft(false),
    });
  }, [microsoftDisconnectMutation]);

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

  // CSRF token is now read directly from cookie - no initialization needed

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
        const updatedUser = result.data?.user;

        // Update the query cache with the correct API response format
        queryClient.setQueryData(["/api/user"], {
          success: true,
          data: { user: updatedUser },
        });

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
          description: result.error?.message || "Failed to update your profile",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
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
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
        Account Settings
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Two-column settings layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profile section */}
          <div className="md:col-span-1">
            <div className="sticky top-[5rem]">
              <h2 className="text-lg font-semibold text-foreground">
                Profile Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
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
                  <PasswordInput
                    id="password"
                    placeholder="Leave blank to keep current password"
                    {...register("password")}
                    value={password}
                    showStrengthMeter={!!password}
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
                    <PasswordInput
                      id="confirmPassword"
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
            <div className="sticky top-[5rem]">
              <h2 className="text-lg font-semibold text-foreground">
                Company Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
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
                      render={({ field }) => <IndustrySelect field={field} />}
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

        {/* Connected Accounts section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="md:col-span-1">
            <div className="sticky top-[5rem]">
              <h2 className="text-lg font-semibold text-foreground">
                Connected Accounts
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your connected social accounts
              </p>
            </div>
          </div>

          <div className="md:col-span-3">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {hasGoogleOAuth && (
                    <div>
                      <h3 className="text-base font-medium mb-3">
                        Google Account
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                          </div>
                          <div>
                            {user?.googleId ? (
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  Google account connected
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  You can use Google to sign in to your account
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  Connect Google account
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Link your Google account for easier sign-in
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          {user?.googleId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isDisconnectingGoogle}
                              onClick={handleDisconnectGoogle}
                              className="text-muted-foreground border-muted-foreground"
                            >
                              {isDisconnectingGoogle
                                ? "Disconnecting..."
                                : "Disconnect"}
                            </Button>
                          ) : (
                            <div className="flex justify-center">
                              <div className="relative">
                                {isConnectingGoogle && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="w-5 h-5 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                  </div>
                                )}
                                <div
                                  className={
                                    isConnectingGoogle ? "opacity-50" : ""
                                  }
                                >
                                  <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    useOneTap
                                    type="icon"
                                    shape="circle"
                                    theme="outline"
                                    locale="en"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {hasMicrosoftOAuth && (
                    <div>
                      <h3 className="text-base font-medium mb-3">
                        Microsoft Account
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              className="w-5 h-5"
                            >
                              <path fill="#f25022" d="M0 0h11.377v11.372H0z" />
                              <path
                                fill="#00a4ef"
                                d="M12.623 0H24v11.372H12.623z"
                              />
                              <path fill="#7fba00" d="M0 12.628h11.377V24H0z" />
                              <path
                                fill="#ffb900"
                                d="M12.623 12.628H24V24H12.623z"
                              />
                            </svg>
                          </div>
                          <div>
                            {user?.microsoftId ? (
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  Microsoft account connected
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  You can use Microsoft to sign in to your
                                  account
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  Connect Microsoft account
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Link your Microsoft account for easier sign-in
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          {user?.microsoftId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isDisconnectingMicrosoft}
                              onClick={handleDisconnectMicrosoft}
                              className="text-muted-foreground border-muted-foreground"
                            >
                              {isDisconnectingMicrosoft
                                ? "Disconnecting..."
                                : "Disconnect"}
                            </Button>
                          ) : (
                            <div className="flex justify-center">
                              <div className="relative">
                                {isConnectingMicrosoft && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="w-5 h-5 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                  </div>
                                )}
                                <div
                                  className={
                                    isConnectingMicrosoft ? "opacity-50" : ""
                                  }
                                >
                                  <MicrosoftLoginButton
                                    onSuccess={handleMicrosoftSuccess}
                                    onError={handleMicrosoftError}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasGoogleOAuth && !hasMicrosoftOAuth && (
                    <div className="text-sm text-muted-foreground">
                      No OAuth providers configured. Contact your administrator
                      to enable Google or Microsoft sign-in.
                    </div>
                  )}
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
