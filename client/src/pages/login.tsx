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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      
      // Redirect to dashboard
      setLocation("/dashboard");
      
      toast({
        title: "Login successful!",
        description: "Welcome to MyZone AI.",
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome to MyZone AI</h1>
        <p className="mt-3 text-lg text-gray-600">
          Sign in to access your AI Readiness Assessment
        </p>
      </div>
      
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6">
            {/* Google Sign-In Option */}
            <div className="w-full">
              <Button 
                className="w-full flex items-center justify-center bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm"
                variant="outline"
                onClick={() => {
                  // Trigger Google login programmatically
                  document.querySelector<HTMLDivElement>("[id^='google_btn']")?.click();
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
                  <path d="M6.52 7.013V10.3h3.84c-.507 1.787-1.973 2.827-3.84 2.827-2.387 0-4.333-1.92-4.333-4.307s1.947-4.307 4.333-4.307c1.013 0 1.92.387 2.627 1.147l2.307-2.307C10.333 1.44 8.413.667 6.52.667 2.973.667 0 3.64 0 7.187s2.973 6.52 6.52 6.52c3.84 0 6.4-2.667 6.4-6.4 0-.48-.053-.96-.16-1.414H6.52v1.12z" fill="#34A853"/>
                  <path d="M.89 5.867V8.8h3.027c-.387-1.12-1.147-1.92-2.44-2.293L.89 5.867z" fill="#FBBC05"/>
                  <path d="M6.52 7.013V4.393h6.4c-.053-.347-.267-1.027-.56-1.5C11.307 1.6 9.173.667 6.52.667 2.973.667 0 3.64 0 7.187s2.973 6.52 6.52 6.52c3.84 0 6.4-2.667 6.4-6.4 0-.48-.053-.96-.16-1.414H6.52v1.12z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </Button>
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
            
            {/* Custom Login Form */}
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Login with Email</h3>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
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