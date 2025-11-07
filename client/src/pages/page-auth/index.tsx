import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from "@react-oauth/google";
import { MicrosoftLoginButton } from "@/components/microsoft-login-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { IndustrySelect } from "@/components/industries";
import { useAuth } from "@/hooks/use-auth";
import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
  type SignupFormValues,
} from "@shared/validation/validation-schemas";

export default function AuthPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const {
    user,
    isLoading,
    loginMutation,
    registerMutation,
    googleLoginMutation,
    microsoftLoginMutation,
  } = useAuth();

  // Check if Google OAuth is configured
  const isGoogleAuthEnabled = !!import.meta.env.GOOGLE_CLIENT_ID;

  // Check if Microsoft OAuth is configured
  const isMicrosoftAuthEnabled = !!import.meta.env.VITE_MICROSOFT_CLIENT_ID;

  // Detect if we're in a popup window (opened by MSAL)
  const isPopup = window.opener && window.opener !== window;

  // If we're in a popup, show loading state while MSAL handles the callback
  if (isPopup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  // Google login handlers
  const handleGoogleSuccess = async (credentialResponse: any) => {
    await googleLoginMutation.mutateAsync({
      credential: credentialResponse.credential,
    });
  };

  const handleGoogleError = () => {
    toast({
      title: "Google login failed",
      description: "There was a problem with your Google login.",
      variant: "destructive",
      duration: 3000,
    });
  };

  // Microsoft login handlers
  const handleMicrosoftSuccess = async (credentialResponse: any) => {
    await microsoftLoginMutation.mutateAsync({
      credential: credentialResponse.credential,
    });
  };

  const handleMicrosoftError = () => {
    toast({
      title: "Microsoft login failed",
      description: "There was a problem with your Microsoft login.",
      variant: "destructive",
      duration: 3000,
    });
  };

  // Redirect if user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form setup
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      employeeCount: "10-49",
      industry: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    // Normalize email (trim and lowercase) before submission
    const normalizedData = {
      ...data,
      email: data.email.trim().toLowerCase(),
    };
    await loginMutation.mutateAsync(normalizedData);
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    // Normalize form data (trim strings, lowercase email) before submission
    const normalizedData = {
      ...data,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      company: data.company.trim(),
    };
    await registerMutation.mutateAsync(normalizedData);
  };

  return (
    <div className="container flex flex-col flex-grow">
      {/* Form section */}
      <div className="w-full max-w-[600px] mx-auto py-8 flex flex-col flex-grow justify-center">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Keeran
          </h2>
          <p className="text-gray-600 mt-2">
            Your AI Readiness Assessment platform
          </p>
        </div>

        <Card className="border-0 shadow-none">
          {/* Microsoft Sign-In Option - Only show if configured */}
          {isMicrosoftAuthEnabled ? (
            <>
              <div className="w-full mb-6 flex justify-center px-6 pt-6">
                <MicrosoftLoginButton
                  onSuccess={handleMicrosoftSuccess}
                  onError={handleMicrosoftError}
                  text={activeTab === "login" ? "signin_with" : "signup_with"}
                />
              </div>

              {/* Divider */}
              <div className="relative w-full mb-6 px-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-900"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="w-7 h-7 grid place-items-center bg-white dark:bg-gray-900 rounded-full text-gray-500 leading-none">
                    or
                  </span>
                </div>
              </div>
            </>
          ) : null}

          <Tabs
            defaultValue="login"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Google Sign-In Option - Only show if configured */}
              {isGoogleAuthEnabled ? (
                <>
                  <div className="w-full mb-6 flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      text={
                        activeTab === "login" ? "signin_with" : "signup_with"
                      }
                      width="100%"
                    />
                  </div>

                  {/* Divider */}
                  <div className="relative w-full mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-900"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="w-7 h-7 grid place-items-center bg-white dark:bg-gray-900 rounded-full text-gray-500 leading-none">
                        or
                      </span>
                    </div>
                  </div>
                </>
              ) : null}

              {/* LOGIN FORM */}
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    {/* Email field */}
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Email
                          </FormLabel>
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

                    {/* Password field */}
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Password
                            </FormLabel>
                            <Link href="/auth/forgot">
                              <a className="text-sm text-blue-600 hover:underline">
                                Forgot password?
                              </a>
                            </Link>
                          </div>
                          <FormControl>
                            <PasswordInput
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit button */}
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full py-2 px-4 rounded-md transition-colors"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* SIGNUP FORM */}
              <TabsContent value="signup" className="mt-0">
                <Form {...signupForm}>
                  <form
                    onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                    className="space-y-4"
                  >
                    {/* Name field */}
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="John Doe"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email field */}
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Email
                          </FormLabel>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Company field */}
                      <FormField
                        control={signupForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Company
                            </FormLabel>
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

                      {/* Company Size field */}
                      <FormField
                        control={signupForm.control}
                        name="employeeCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Company Size
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select company size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-9">
                                  1-9 employees
                                </SelectItem>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Industry field */}
                    <FormField
                      control={signupForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Industry
                          </FormLabel>
                          <FormControl>
                            <IndustrySelect field={field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password field */}
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Password
                            </FormLabel>
                            <FormControl>
                              <PasswordInput
                                placeholder="••••••••"
                                showStrengthMeter={true}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Confirm Password field */}
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Confirm Password
                            </FormLabel>
                            <FormControl>
                              <PasswordInput
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit button */}
                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full text-white py-2 px-4 rounded-md transition-colors"
                    >
                      {registerMutation.isPending
                        ? "Creating account..."
                        : "Create account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
