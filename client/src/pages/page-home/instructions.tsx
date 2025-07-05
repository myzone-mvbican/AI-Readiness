import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

interface InstructionsProps {
  onStartAssessment: () => void;
}

export function Instructions({ onStartAssessment }: InstructionsProps) {
  return (
    <div className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Survey Instructions */}
          <div className="text-white">
            <h2 className="text-3xl font-extrabold mb-6">
              Survey Instructions
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              This assessment consists of multiple sections covering different aspects of AI readiness. Each section will evaluate a specific dimension of your organization's capabilities.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-blue-600 border-white hover:bg-blue-50 hover:text-blue-700 px-8"
              onClick={onStartAssessment}
            >
              Start Assessment
            </Button>
          </div>

          {/* Right Column - How to Complete */}
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-6">
              How to complete this assessment:
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p className="text-blue-100">
                  Answer all questions honestly for the most accurate results
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p className="text-blue-100">
                  Take approximately 10 minutes to complete all sections
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p className="text-blue-100">
                  You can save your progress and return later
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p className="text-blue-100">
                  Generate a PDF report of your results when finished
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}