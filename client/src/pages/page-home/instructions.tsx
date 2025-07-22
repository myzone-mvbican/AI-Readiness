import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface InstructionsProps {
  onStartAssessment: () => void;
}

export function Instructions({ onStartAssessment }: InstructionsProps) {
  return (
    <div className="bg-[#082B3D] overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 lg:space-x-12 items-stretch text-white">
          {/* Left Column - Survey Instructions */}
          <div className="section-space-y text-white max-w-[440px]">
            <h2 className="section__title mb-6">Survey Overview</h2>
            <p className="text-base lg:text-[18px] leading-relaxed mb-8">
              This assessment is divided into sections that look at different
              parts of your business. Each one helps you see how prepared you
              are to start using AI in a secure, thoughtful way.
            </p>
            <Button
              size="lg" 
              className="rounded-full font-bold text-base"
              onClick={onStartAssessment}
            >
              Start Assessment
            </Button>
          </div>

          {/* Right Column - How to Complete */}
          <div className="section-space-y bg-primary -mx-[1rem] lg:mx-0 px-4 lg:px-12 relative after:absolute after:top-0 after:block after:w-full after:h-full after:left-full after:bg-inherit">
            <h3 className="text-xl font-bold mb-6">
              How to complete this assessment:
            </h3>
            <div className="space-y-4 max-w-[330px]">
              <div className="flex items-start space-x-3">
                <ArrowRight className="size-5 mt-1 flex-shrink-0" />
                <p>
                  Answer each section as truthfully as you can for the best results
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <ArrowRight className="size-5 mt-1 flex-shrink-0" />
                <p>It takes about 10 minutes from start to finish</p>
              </div>
              <div className="flex items-start space-x-3">
                <ArrowRight className="size-5 mt-1 flex-shrink-0" />
                <p>You can save your progress and return later</p>
              </div>
              <div className="flex items-start space-x-3">
                <ArrowRight className="size-5 mt-1 flex-shrink-0" />
                <p>Generate a PDF report of your results when finished</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
