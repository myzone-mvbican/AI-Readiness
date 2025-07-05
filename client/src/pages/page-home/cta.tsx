import { Button } from "@/components/ui/button";

interface CtaProps {
  onStartAssessment: () => void;
}

export function Cta({ onStartAssessment }: CtaProps) {
  return (
    <div className="section-space-y bg-gradient-to-br from-[#1C2D8A] via-[#3651DA] to-[#1C2D8A]">
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Visual Space (AI Network handled by background) */}
          <div className="hidden lg:block">
            {/* This space is for the visual - handled by background SVG */}
          </div>

          {/* Right Column - CTA Content */}
          <div className="text-white text-center lg:text-left">
            <h2 className="section__title mb-6">AI Readiness Assessment</h2>
            <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Take the AI Readiness Assessment to gauge your organization's
              preparedness. Ready to begin?
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-blue-600 border-white hover:bg-blue-50 hover:text-blue-700 px-8 font-bold"
              onClick={onStartAssessment}
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
