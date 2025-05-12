import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useAssessmentCreateModal } from "@/hooks/use-assessment-create-modal";

export default function Home() {
  const assessmentCreateModal = useAssessmentCreateModal();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24">
        <div className="container">
          <div className="text-center md:text-left md:flex md:items-center md:justify-between">
            <div className="md:max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-700">
                MyZone AI Readiness Survey
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl md:pe-8">
                Welcome! This AI Readiness Assessment should be completed
                quarterly as one of your foundational AI KPIs (Key Performance
                Indicators). It takes approximately 10 minutes to complete. You
                can save your results as a PDF or compare with industry
                benchmarks.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  onClick={assessmentCreateModal.onOpen}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-md shadow-md px-6 py-3 w-full sm:w-auto"
                >
                  Start Assessment
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors rounded-md w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block md:w-1/3 lg:w-2/5">
              <div className="relative w-full h-80 rounded-lg shadow-md overflow-hidden bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800">
                      AI Readiness
                    </div>
                    <div className="mt-2 text-xl text-gray-600">
                      Benchmark your organization
                    </div>
                    <div className="mt-4 inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg">
                      <div className="text-3xl font-bold text-primary-500">
                        KPI
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              Understand your organization's AI readiness and get actionable
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
