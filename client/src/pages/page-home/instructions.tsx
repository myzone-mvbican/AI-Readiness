import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface InstructionsProps {
  onStartAssessment: () => void;
}

export function Instructions({ onStartAssessment }: InstructionsProps) {
  return (
    <div className="bg-gradient-to-r from-[#1C2D8A] to-[#3651DA] overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 lg:space-x-12 items-stretch text-white">
          {/* Left Column - Survey Instructions */}
          <div className="section-space-y text-white">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              Survey Instructions
            </h2>
            <p className="text-base lg:text-lg leading-relaxed mb-8">
              This assessment consists of multiple sections covering different
              aspects of AI readiness. Each section will evaluate a specific
              dimension of your organization's capabilities.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-blue-600 border-white hover:bg-blue-50 hover:text-blue-700 font-bold px-8"
              onClick={onStartAssessment}
            >
              Start Assessment
            </Button>
          </div>

          {/* Right Column - How to Complete */}
          <div className="section-space-y bg-[#213499] -mx-[1rem] lg:mx-0 px-4 lg:px-12 relative after:absolute after:top-0 after:block after:w-full after:h-full after:left-full after:bg-inherit">
            <h3 className="text-xl font-bold mb-6">
              How to complete this assessment:
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <ArrowRight className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p>
                  Answer all questions honestly for the most accurate results
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <ArrowRight className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p>
                  Take approximately 10 minutes to complete all sections
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <ArrowRight className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p>
                  You can save your progress and return later
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <ArrowRight className="h-5 w-5 text-blue-200 mt-1 flex-shrink-0" />
                <p>
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
