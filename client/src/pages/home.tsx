import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center md:text-left md:flex md:items-center md:justify-between">
            <div className="md:max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-blue-600">
                MyZone AI Readiness Survey
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl">
                Welcome! This AI Readiness Assessment should be completed quarterly as one of your foundational AI KPIs (Key Performance Indicators). It takes approximately 10 minutes to complete. You can save your results as a PDF or compare with industry benchmarks.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  size="lg" 
                  className="bg-primary-500 hover:bg-primary-600 text-white transition-colors rounded-md"
                >
                  Start Assessment
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary-500 text-primary-500 hover:bg-primary-50 transition-colors rounded-md"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="hidden md:block md:w-1/3 lg:w-2/5">
              <div className="relative w-full h-80 rounded-lg shadow-xl overflow-hidden bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800">AI Readiness</div>
                    <div className="mt-2 text-xl text-gray-600">Benchmark your organization</div>
                    <div className="mt-4 inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg">
                      <div className="text-3xl font-bold text-primary-500">KPI</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Benefits of the Assessment</h2>
            <p className="mt-4 text-lg text-gray-600">
              Understand your organization's AI readiness and get actionable insights
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-blue-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-primary-500 text-2xl font-semibold mb-3">Benchmark</div>
              <p className="text-gray-700">Compare your AI readiness with industry standards and competitors</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-blue-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-primary-500 text-2xl font-semibold mb-3">Track Progress</div>
              <p className="text-gray-700">Monitor your improvement over time with quarterly assessments</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-blue-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-primary-500 text-2xl font-semibold mb-3">Get Insights</div>
              <p className="text-gray-700">Receive tailored recommendations to improve your AI capabilities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
