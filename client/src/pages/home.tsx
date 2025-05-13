import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, User, Users } from "lucide-react";
import { useAssessmentCreateModal } from "@/hooks/use-assessment-create-modal";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { GuestAssessmentStartForm } from "@/components/assessment/guest-assessment-start-form";

export default function Home() {
  const assessmentCreateModal = useAssessmentCreateModal();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(user ? "account" : "guest");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-700">
                MyZone AI Readiness Survey
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-600">
                Welcome! This AI Readiness Assessment should be completed
                quarterly as one of your foundational AI KPIs (Key Performance
                Indicators). It takes approximately 10 minutes to complete. You
                can save your results as a PDF or compare with industry
                benchmarks.
              </p>
              <div className="mt-8">
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors rounded-md"
                  >
                    Learn More
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div>
              <Card className="p-6 shadow-lg">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="guest" className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Guest</span>
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Account</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="guest" className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">Start as Guest</h3>
                      <p className="text-muted-foreground">No account required. Results saved to your email.</p>
                    </div>
                    <GuestAssessmentStartForm />
                  </TabsContent>
                  
                  <TabsContent value="account" className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">With Your Account</h3>
                      <p className="text-muted-foreground">Access all surveys and track progress over time.</p>
                    </div>
                    {user ? (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={assessmentCreateModal.onOpen}
                      >
                        Start Assessment
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Link href="/auth?mode=login">
                          <Button className="w-full" size="lg">
                            Log In to Start
                          </Button>
                        </Link>
                        <p className="text-sm text-center text-muted-foreground">
                          Don&apos;t have an account?{" "}
                          <Link href="/auth?mode=register">
                            <span className="text-blue-600 hover:underline cursor-pointer">
                              Register
                            </span>
                          </Link>
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white dark:bg-muted">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground">
              Benefits of the Assessment
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Understand your organization&apos;s AI readiness and get actionable
              insights
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-foreground text-2xl font-semibold mb-3">
                Benchmark
              </div>
              <p className="text-muted-foreground">
                Compare your AI readiness with industry standards and
                competitors
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-foreground text-2xl font-semibold mb-3">
                Track Progress
              </div>
              <p className="text-muted-foreground">
                Monitor your improvement over time with quarterly assessments
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-foreground text-2xl font-semibold mb-3">
                Get Insights
              </div>
              <p className="text-muted-foreground">
                Receive tailored recommendations to improve your AI capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}