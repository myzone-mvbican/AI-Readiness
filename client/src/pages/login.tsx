import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormValues,
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
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
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
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome Back
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Sign in to access your AI Readiness Assessment
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {/* Google Sign-In Option */}
            <div className="w-full">
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
                  Sign in with Google
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
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email Login Form */}
            <div className="w-full">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email field */}
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
                    placeholder="john@example.com"
                    {...register("email")}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
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
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
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
                
                <div className="text-center text-sm text-gray-600 mt-4">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          By logging in, you agree to our Terms of Service and Privacy Policy.
          Your data will be used anonymously for benchmarking purposes.
        </p>
      </div>
    </div>
  );
}
