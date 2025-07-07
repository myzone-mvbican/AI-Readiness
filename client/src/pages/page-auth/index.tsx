import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from "@react-oauth/google";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndustrySelect } from "@/components/industries";
import { useAuth } from "@/hooks/use-auth";
import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
  type SignupFormValues,
} from "@/schemas/validation-schemas";

export default function AuthPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { user, loginMutation, registerMutation, googleLoginMutation } =
    useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // Login form setup
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form setup
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    setValue,
    control,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      employeeCount: undefined,
      industry: undefined,
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);

      // Use the loginMutation from our auth hook
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      // Wait a moment for auth state to update, then redirect
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    } catch (error) {
      console.error("Error submitting login form:", error);
      // Error handling is done in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      setIsSubmitting(true);

      // Use the registerMutation from our auth hook
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        company: data.company,
        employeeCount: data.employeeCount,
        industry: data.industry,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      // Redirect happens automatically in useEffect when user is set
    } catch (error) {
      console.error("Error submitting registration form:", error);
      // Error handling is done in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsSubmitting(true);

      // Use the googleLoginMutation from our auth hook
      await googleLoginMutation.mutateAsync({
        credential: credentialResponse.credential,
      });

      // Redirect happens automatically in useEffect when user is set
    } catch (error) {
      console.error("Error with Google login:", error);

      // Error handling is done in the mutation, but we can add an additional message
      toast({
        title: "Google login failed",
        description: "There was a problem with your Google login.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Google login failed",
      description: "There was a problem with your Google login.",
      variant: "destructive",
      duration: 3000,
    });
  };

  return (
    <div className="container flex flex-col flex-grow">
      {/* Form section */}
      <div className="w-full max-w-[600px] mx-auto py-8 flex flex-col flex-grow justify-center">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to MyZone AI
          </h2>
          <p className="text-gray-600 mt-2">
            Your AI Readiness Assessment platform
          </p>
        </div>

        <Card className="border-0 shadow-none">
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
              {/* Google Sign-In Option */}
              <div className="w-full mb-6">
                <div
                  className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // Trigger Google login programmatically
                    document
                      .querySelector<HTMLDivElement>("[id^='google_btn']")
                      ?.click();
                  }}
                >
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google logo"
                    className="w-6 h-6 mr-2"
                  />
                  <span className="text-gray-700 font-medium">
                    {activeTab === "login"
                      ? "Sign in with Google"
                      : "Sign up with Google"}
                  </span>
                </div>

                <div className="hidden">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    auto_select={false}
                  />
                </div>
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

              {/* LOGIN FORM */}
              <TabsContent value="login" className="mt-0">
                <form
                  onSubmit={handleLoginSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  {/* Email field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="login-email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      {...registerLogin("email")}
                      className={loginErrors.email ? "border-red-500" : ""}
                    />
                    {loginErrors.email && (
                      <p className="text-sm text-red-500">
                        {loginErrors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label
                        htmlFor="login-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </Label>
                      <Link href="/auth/forgot">
                        <a className="text-sm text-blue-600 hover:underline">
                          Forgot password?
                        </a>
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      {...registerLogin("password")}
                      className={loginErrors.password ? "border-red-500" : ""}
                    />
                    {loginErrors.password && (
                      <p className="text-sm text-red-500">
                        {loginErrors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP FORM */}
              <TabsContent value="signup" className="mt-0">
                <form
                  onSubmit={handleSignupSubmit(onSignupSubmit)}
                  className="space-y-4"
                >
                  {/* Name field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="signup-name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      {...registerSignup("name")}
                      className={signupErrors.name ? "border-red-500" : ""}
                    />
                    {signupErrors.name && (
                      <p className="text-sm text-red-500">
                        {signupErrors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      {...registerSignup("email")}
                      className={signupErrors.email ? "border-red-500" : ""}
                    />
                    {signupErrors.email && (
                      <p className="text-sm text-red-500">
                        {signupErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company field */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="signup-company"
                        className="text-sm font-medium text-gray-700"
                      >
                        Company
                      </Label>
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Your Company"
                        {...registerSignup("company")}
                        className={signupErrors.company ? "border-red-500" : ""}
                      />
                      {signupErrors.company && (
                        <p className="text-sm text-red-500">
                          {signupErrors.company.message}
                        </p>
                      )}
                    </div>

                    {/* Company Size field */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="signup-employee-count"
                        className="text-sm font-medium text-gray-700"
                      >
                        Company Size
                      </Label>
                      <Controller
                        control={control}
                        name="employeeCount"
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger
                              id="signup-employee-count"
                              className={
                                signupErrors.employeeCount
                                  ? "border-red-500"
                                  : ""
                              }
                            >
                              <SelectValue placeholder="Select company size" />
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
                      {signupErrors.employeeCount && (
                        <p className="text-sm text-red-500">
                          {signupErrors.employeeCount.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Industry field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="signup-industry"
                      className="text-sm font-medium text-gray-700"
                    >
                      Industry
                    </Label>
                    <Controller
                      control={control}
                      name="industry"
                      render={({ field }) => (
                        <IndustrySelect
                          field={field}
                          error={!!signupErrors.industry}
                          className={
                            signupErrors.industry ? "border-red-500" : ""
                          }
                        />
                      )}
                    />
                    {signupErrors.industry && (
                      <p className="text-sm text-red-500">
                        {signupErrors.industry.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Password field */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="signup-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        {...registerSignup("password")}
                        className={
                          signupErrors.password ? "border-red-500" : ""
                        }
                      />
                      {signupErrors.password && (
                        <p className="text-sm text-red-500">
                          {signupErrors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password field */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="signup-confirmPassword"
                        className="text-sm font-medium text-gray-700"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="signup-confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...registerSignup("confirmPassword")}
                        className={
                          signupErrors.confirmPassword ? "border-red-500" : ""
                        }
                      />
                      {signupErrors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {signupErrors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {isSubmitting ? "Creating account..." : "Create account"}
                  </Button>
                </form>
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
