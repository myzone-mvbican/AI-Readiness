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
} from "@shared/validation/validation-schemas";

export default function AuthPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation(); 
  const [activeTab, setActiveTab] = useState("login");
  const { user, isLoading, loginMutation, registerMutation, googleLoginMutation } = useAuth();
  
  // Check if Google OAuth is configured
  const isGoogleAuthEnabled = !!import.meta.env.GOOGLE_CLIENT_ID;

  // Google login handlers
  const handleGoogleSuccess = async (credentialResponse: any) => {
    await googleLoginMutation.mutateAsync({ credential: credentialResponse.credential });
  };

  const handleGoogleError = () => {
    toast({
      title: "Google login failed",
      description: "There was a problem with your Google login.",
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
      employeeCount: "10-49",
      industry: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    await loginMutation.mutateAsync(data)
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    await registerMutation.mutateAsync(data);
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
              {/* Google Sign-In Option - Only show if configured */}
              {isGoogleAuthEnabled ? (
                <>
                  <div className="w-full mb-6 flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      text={activeTab === "login" ? "signin_with" : "signup_with"}
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
                    disabled={loginMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {(loginMutation.isPending) ? "Signing in..." : "Sign in"}
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
                    disabled={registerMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create account"}
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
