import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/schemas/validation-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      employeeCount: "",
      industry: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Form submitted:", data);
      
      // Redirect to survey page
      setLocation("/survey");
      
      toast({
        title: "Login successful!",
        description: "Welcome to the AI Readiness Survey.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      
      toast({
        title: "Login failed",
        description: "There was a problem with your login.",
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
        description: "Welcome to the AI Readiness Survey.",
        duration: 3000,
      });
      
      // Redirect to survey page
      setLocation("/survey");
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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Login to AI Readiness Survey</h1>
        <p className="mt-3 text-lg text-gray-600">
          Access your assessment or create a new one
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Google Sign-In Option */}
        <Card>
          <CardHeader>
            <CardTitle>Sign in with Google</CardTitle>
            <CardDescription>
              The fastest way to get started with your assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
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
          </CardContent>
        </Card>
        
        {/* Custom Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Login</CardTitle>
            <CardDescription>
              Enter your details to start the assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name field */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
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
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Email field */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Company field */}
              <div className="space-y-1">
                <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                  Company
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Inc."
                  {...register("company")}
                  className={errors.company ? "border-red-500" : ""}
                />
                {errors.company && (
                  <p className="text-sm text-red-500">{errors.company.message}</p>
                )}
              </div>

              {/* Employee Count field */}
              <div className="space-y-1">
                <Label htmlFor="employeeCount" className="text-sm font-medium text-gray-700">
                  Number of Employees
                </Label>
                <Select 
                  onValueChange={(value) => setValue("employeeCount", value)}
                  defaultValue=""
                >
                  <SelectTrigger id="employeeCount" className={errors.employeeCount ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-9">1-9</SelectItem>
                    <SelectItem value="10-49">10-49</SelectItem>
                    <SelectItem value="50-149">50-149</SelectItem>
                    <SelectItem value="150-499">150-499</SelectItem>
                    <SelectItem value="500-999">500-999</SelectItem>
                    <SelectItem value="1000+">1000+</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employeeCount && (
                  <p className="text-sm text-red-500">{errors.employeeCount.message}</p>
                )}
              </div>

              {/* Industry field */}
              <div className="space-y-1">
                <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                  Industry
                </Label>
                <Select 
                  onValueChange={(value) => setValue("industry", value)}
                  defaultValue=""
                >
                  <SelectTrigger id="industry" className={errors.industry ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology / Software</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="media">Media / Entertainment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-red-500">{errors.industry.message}</p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors"
              >
                {isSubmitting ? "Logging in..." : "Start Assessment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          By logging in, you agree to our Terms of Service and Privacy Policy.
          Your data will be used anonymously for benchmarking purposes.
        </p>
      </div>
    </div>
  );
}