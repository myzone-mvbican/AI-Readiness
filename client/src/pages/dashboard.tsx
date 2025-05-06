import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckIcon, ClipboardIcon, ClockIcon } from "lucide-react";

// Schema definitions for each step
const step1Schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  annualRevenue: z.string().min(1, "Annual revenue is required"),
  employeeCount: z.string().min(1, "Employee count is required"),
});

const step2Schema = z.object({
  currentAiUsage: z.string().min(1, "Please select an option"),
  dataInfrastructure: z.string().min(1, "Please select an option"),
  aiExperience: z.string().min(1, "Please select an option"),
  technicalTeam: z.string().min(1, "Please select an option"),
});

const step3Schema = z.object({
  aiGoals: z.string().min(1, "AI goals are required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  challenges: z.string().min(1, "Please describe your challenges"),
  budget: z.string().min(1, "Budget range is required"),
});

// Types for our form values
type Step1FormValues = z.infer<typeof step1Schema>;
type Step2FormValues = z.infer<typeof step2Schema>;
type Step3FormValues = z.infer<typeof step3Schema>;

// Previous survey placeholder data
const previousSurveys = [
  { id: 1, title: "Q1 2023 Assessment", date: "March 15, 2023", status: "Completed" },
  { id: 2, title: "Q4 2022 Assessment", date: "December 10, 2022", status: "Completed" },
  { id: 3, title: "Q3 2022 Assessment", date: "September 5, 2022", status: "Completed" },
];

export default function Dashboard() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [formData, setFormData] = useState<{
    step1?: Step1FormValues;
    step2?: Step2FormValues;
    step3?: Step3FormValues;
  }>({});

  // Step 1 form
  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: "",
      industry: "",
      annualRevenue: "",
      employeeCount: "",
    },
  });

  // Step 2 form
  const step2Form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      currentAiUsage: "",
      dataInfrastructure: "",
      aiExperience: "",
      technicalTeam: "",
    },
  });

  // Step 3 form
  const step3Form = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      aiGoals: "",
      timeframe: "",
      challenges: "",
      budget: "",
    },
  });

  // Handle form submission for each step
  const handleStep1Submit = (data: Step1FormValues) => {
    setFormData({ ...formData, step1: data });
    setActiveStep(2);
  };

  const handleStep2Submit = (data: Step2FormValues) => {
    setFormData({ ...formData, step2: data });
    setActiveStep(3);
  };

  const handleStep3Submit = (data: Step3FormValues) => {
    setFormData({ ...formData, step3: data });
    console.log("Complete form data:", { ...formData, step3: data });
    // Here you would typically send this data to your backend
    alert("Survey completed! Thank you for your submission.");
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="w-full mb-8">
        <div className="flex justify-between">
          <div className="flex flex-col items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <span className="text-sm mt-1">Company Info</span>
          </div>
          <div className="flex-1 self-center">
            <div className={`h-1 ${activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <span className="text-sm mt-1">AI Usage</span>
          </div>
          <div className="flex-1 self-center">
            <div className={`h-1 ${activeStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              3
            </div>
            <span className="text-sm mt-1">Future Goals</span>
          </div>
        </div>
      </div>
    );
  };

  // Render the current step form
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input 
                id="companyName" 
                {...step1Form.register("companyName")} 
                className={step1Form.formState.errors.companyName ? "border-red-500" : ""}
              />
              {step1Form.formState.errors.companyName && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.companyName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                onValueChange={(value) => step1Form.setValue("industry", value)}
                defaultValue={step1Form.getValues("industry")}
              >
                <SelectTrigger id="industry" className={step1Form.formState.errors.industry ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology / Software</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {step1Form.formState.errors.industry && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.industry.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Annual Revenue</Label>
              <Select 
                onValueChange={(value) => step1Form.setValue("annualRevenue", value)}
                defaultValue={step1Form.getValues("annualRevenue")}
              >
                <SelectTrigger id="annualRevenue" className={step1Form.formState.errors.annualRevenue ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less-1m">Less than $1 million</SelectItem>
                  <SelectItem value="1m-10m">$1 million - $10 million</SelectItem>
                  <SelectItem value="10m-50m">$10 million - $50 million</SelectItem>
                  <SelectItem value="50m-100m">$50 million - $100 million</SelectItem>
                  <SelectItem value="100m-1b">$100 million - $1 billion</SelectItem>
                  <SelectItem value="more-1b">More than $1 billion</SelectItem>
                </SelectContent>
              </Select>
              {step1Form.formState.errors.annualRevenue && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.annualRevenue.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employeeCount">Number of Employees</Label>
              <Select 
                onValueChange={(value) => step1Form.setValue("employeeCount", value)}
                defaultValue={step1Form.getValues("employeeCount")}
              >
                <SelectTrigger id="employeeCount" className={step1Form.formState.errors.employeeCount ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-9">1-9</SelectItem>
                  <SelectItem value="10-49">10-49</SelectItem>
                  <SelectItem value="50-249">50-249</SelectItem>
                  <SelectItem value="250-999">250-999</SelectItem>
                  <SelectItem value="1000+">1000+</SelectItem>
                </SelectContent>
              </Select>
              {step1Form.formState.errors.employeeCount && (
                <p className="text-sm text-red-500">{step1Form.formState.errors.employeeCount.message}</p>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Next</Button>
            </div>
          </form>
        );
      
      case 2:
        return (
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
            <div className="space-y-3">
              <Label>Current AI Usage in Your Organization</Label>
              <RadioGroup 
                onValueChange={(value) => step2Form.setValue("currentAiUsage", value)}
                defaultValue={step2Form.getValues("currentAiUsage")}
                className="space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal">None - We haven't implemented any AI solutions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic" className="font-normal">Basic - Using some third-party AI tools</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="font-normal">Moderate - Custom AI solutions in specific departments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="font-normal">Advanced - Organization-wide AI implementation</Label>
                </div>
              </RadioGroup>
              {step2Form.formState.errors.currentAiUsage && (
                <p className="text-sm text-red-500">{step2Form.formState.errors.currentAiUsage.message}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label>Data Infrastructure Readiness</Label>
              <RadioGroup 
                onValueChange={(value) => step2Form.setValue("dataInfrastructure", value)}
                defaultValue={step2Form.getValues("dataInfrastructure")}
                className="space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="poor-data" />
                  <Label htmlFor="poor-data" className="font-normal">Poor - Data is siloed and difficult to access</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fair" id="fair-data" />
                  <Label htmlFor="fair-data" className="font-normal">Fair - Some data is accessible but not well-structured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="good-data" />
                  <Label htmlFor="good-data" className="font-normal">Good - Most data is accessible and fairly well-structured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id="excellent-data" />
                  <Label htmlFor="excellent-data" className="font-normal">Excellent - Comprehensive data infrastructure with robust governance</Label>
                </div>
              </RadioGroup>
              {step2Form.formState.errors.dataInfrastructure && (
                <p className="text-sm text-red-500">{step2Form.formState.errors.dataInfrastructure.message}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label>AI Experience and Training</Label>
              <RadioGroup 
                onValueChange={(value) => step2Form.setValue("aiExperience", value)}
                defaultValue={step2Form.getValues("aiExperience")}
                className="space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none-exp" id="none-exp" />
                  <Label htmlFor="none-exp" className="font-normal">None - No AI training or experience in the organization</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="limited" id="limited" />
                  <Label htmlFor="limited" className="font-normal">Limited - Few employees with AI knowledge</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate-exp" id="moderate-exp" />
                  <Label htmlFor="moderate-exp" className="font-normal">Moderate - Some teams have been trained on AI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extensive" id="extensive" />
                  <Label htmlFor="extensive" className="font-normal">Extensive - Organization-wide AI literacy and specialists on staff</Label>
                </div>
              </RadioGroup>
              {step2Form.formState.errors.aiExperience && (
                <p className="text-sm text-red-500">{step2Form.formState.errors.aiExperience.message}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label>Technical Team Capacity</Label>
              <RadioGroup 
                onValueChange={(value) => step2Form.setValue("technicalTeam", value)}
                defaultValue={step2Form.getValues("technicalTeam")}
                className="space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none-tech" id="none-tech" />
                  <Label htmlFor="none-tech" className="font-normal">None - No technical team or outsourced entirely</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="small" />
                  <Label htmlFor="small" className="font-normal">Small - Limited technical staff, primarily IT support</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate-tech" id="moderate-tech" />
                  <Label htmlFor="moderate-tech" className="font-normal">Moderate - Development team but no AI specialists</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced-tech" id="advanced-tech" />
                  <Label htmlFor="advanced-tech" className="font-normal">Advanced - Dedicated AI/ML engineers and data scientists</Label>
                </div>
              </RadioGroup>
              {step2Form.formState.errors.technicalTeam && (
                <p className="text-sm text-red-500">{step2Form.formState.errors.technicalTeam.message}</p>
              )}
            </div>
            
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Next</Button>
            </div>
          </form>
        );
      
      case 3:
        return (
          <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aiGoals">What are your primary goals for implementing AI?</Label>
              <Textarea 
                id="aiGoals" 
                {...step3Form.register("aiGoals")}
                className={step3Form.formState.errors.aiGoals ? "border-red-500" : ""}
                placeholder="Describe your goals and expected outcomes..."
                rows={4}
              />
              {step3Form.formState.errors.aiGoals && (
                <p className="text-sm text-red-500">{step3Form.formState.errors.aiGoals.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeframe">Implementation Timeframe</Label>
              <Select 
                onValueChange={(value) => step3Form.setValue("timeframe", value)}
                defaultValue={step3Form.getValues("timeframe")}
              >
                <SelectTrigger id="timeframe" className={step3Form.formState.errors.timeframe ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-3-months">0-3 months</SelectItem>
                  <SelectItem value="3-6-months">3-6 months</SelectItem>
                  <SelectItem value="6-12-months">6-12 months</SelectItem>
                  <SelectItem value="1-2-years">1-2 years</SelectItem>
                  <SelectItem value="2+-years">2+ years</SelectItem>
                </SelectContent>
              </Select>
              {step3Form.formState.errors.timeframe && (
                <p className="text-sm text-red-500">{step3Form.formState.errors.timeframe.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="challenges">What are your biggest challenges or concerns about AI adoption?</Label>
              <Textarea 
                id="challenges" 
                {...step3Form.register("challenges")}
                className={step3Form.formState.errors.challenges ? "border-red-500" : ""}
                placeholder="Describe your main concerns or obstacles..."
                rows={4}
              />
              {step3Form.formState.errors.challenges && (
                <p className="text-sm text-red-500">{step3Form.formState.errors.challenges.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">AI Implementation Budget Range</Label>
              <Select 
                onValueChange={(value) => step3Form.setValue("budget", value)}
                defaultValue={step3Form.getValues("budget")}
              >
                <SelectTrigger id="budget" className={step3Form.formState.errors.budget ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-10k">Under $10,000</SelectItem>
                  <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
                  <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                  <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                  <SelectItem value="500k+">$500,000+</SelectItem>
                  <SelectItem value="undecided">Undecided/Exploring Options</SelectItem>
                </SelectContent>
              </Select>
              {step3Form.formState.errors.budget && (
                <p className="text-sm text-red-500">{step3Form.formState.errors.budget.message}</p>
              )}
            </div>
            
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Submit Survey</Button>
            </div>
          </form>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 py-8">
      {/* Left Sidebar with previous surveys */}
      <div className="lg:w-1/4">
        <Card>
          <CardHeader>
            <CardTitle>Previous Surveys</CardTitle>
            <CardDescription>Your assessment history</CardDescription>
          </CardHeader>
          <CardContent>
            {previousSurveys.length > 0 ? (
              <ul className="space-y-3">
                {previousSurveys.map((survey) => (
                  <li key={survey.id} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{survey.title}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          <span>{survey.date}</span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                        {survey.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="text-xs px-2">
                        <ClipboardIcon className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No previous surveys.</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 pt-4">
            <Button variant="outline" size="sm" className="w-full">
              View All History
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Main Content Area */}
      <div className="lg:w-3/4">
        <Card>
          <CardHeader>
            <CardTitle>New Survey</CardTitle>
            <CardDescription>Complete the assessment in 3 simple steps</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step Indicator */}
            {renderStepIndicator()}
            
            {/* Current Step Form */}
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}