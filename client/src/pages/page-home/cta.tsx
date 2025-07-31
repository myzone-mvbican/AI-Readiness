import React from "react";
import { Button } from "@/components/ui/button"; 
import { useIsMobile } from "@/hooks/use-mobile";
import image from '@/assets/Keeran_Coworkers.jpg';

interface CtaProps {
  onStartAssessment: () => void;
}

export function Cta({ onStartAssessment }: CtaProps) { 

  return (
    <div className="section-space-y bg-primary">
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Visual Space with tsParticles */}
          <div className="relative">
            <img className="rounded-[20px]" src={image} />
          </div>

          {/* Right Column - CTA Content */}
          <div className="text-white text-center lg:text-left">
            <h2 className="section__title mb-6">Ready to See Where You Stand?</h2>
            <p className="text-base lg:text-[18px] leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Let’s figure it out together. Take the survey to see how prepared your business is to put AI to work for your team and goals.
            </p>
            <Button
              size="lg" 
              className="rounded-full bg-white hover:bg-[#072B3D] text-primary border-white font-bold text-base"
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
