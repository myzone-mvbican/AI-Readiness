import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
  type SignupFormValues,
} from "@/schemas/validation-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AuthPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

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
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Submit login data to the API
      const response = await apiRequest("POST", "/api/login", data);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Login successful!",
          description: "Welcome back to MyZone AI.",
          duration: 3000,
        });

        // Redirect to dashboard
        setLocation("/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: result.message || "Invalid email or password.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      toast({
        title: "Login failed",
        description: "There was a problem with your login. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Submit data to the API
      const response = await apiRequest("POST", "/api/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Registration successful!",
          description: "Your account has been created. Redirecting to the dashboard.",
          duration: 3000,
        });
        
        // Redirect to the dashboard
        setLocation("/dashboard");
      } else {
        toast({
          title: "Registration failed",
          description: result.message || "There was a problem with your registration.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      
      toast({
        title: "Registration failed",
        description: "There was a problem with your registration. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      console.log("Google login success:", credentialResponse);

      toast({
        title: "Google login successful!",
        description: "Welcome to MyZone AI.",
        duration: 3000,
      });

      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error("Error with Google login:", error);

      toast({
        title: "Google login failed",
        description: "There was a problem with your Google login.",
        variant: "destructive",
        duration: 3000,
      });
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 rounded-xl bg-white shadow-xl overflow-hidden">
        {/* Hero section */}
        <div className="hidden md:flex flex-col bg-blue-600 p-12 text-white justify-center">
          <div>
            <h1 className="text-3xl font-bold mb-4">MyZone AI Readiness</h1>
            <p className="text-lg mb-6">
              Assess your organization's AI maturity and get personalized recommendations to accelerate your AI journey.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Detailed AI readiness assessment</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Industry benchmark comparisons</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Personalized improvement roadmap</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Form section */}
        <div className="p-8 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to MyZone AI</h2>
            <p className="text-gray-600 mt-2">Your AI Readiness Assessment platform</p>
          </div>
          
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </Tabs>
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
                    {activeTab === "login" ? "Sign in with Google" : "Sign up with Google"}
                  </span>
                </div>

                <div className="hidden">
                  <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                    />
                  </GoogleOAuthProvider>
                </div>
              </div>

              {/* Divider */}
              <div className="relative w-full mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* LOGIN FORM */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                  {/* Email field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="email"
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
                        htmlFor="password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </Label>
                      <a href="#" className="text-sm text-blue-600 hover:underline">
                        Forgot password?
                      </a>
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
                <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="name"
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
                      htmlFor="email"
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

                  {/* Password field */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      {...registerSignup("password")}
                      className={signupErrors.password ? "border-red-500" : ""}
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
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="signup-confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerSignup("confirmPassword")}
                      className={signupErrors.confirmPassword ? "border-red-500" : ""}
                    />
                    {signupErrors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {signupErrors.confirmPassword.message}
                      </p>
                    )}
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
          </Card>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}