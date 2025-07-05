import React from "react";
import { Button } from "@/components/ui/button";

interface HeroProps {
    onStartAssessment: () => void;
}

// Sample functional component
export const Hero: React.FC<HeroProps> = ({ onStartAssessment }) => {
    return (
        <div className="section-space-y bg-blue-800">
            <div className="container">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="max-w-2xl space-y-6 lg:space-y-8 text-white">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            MyZone AI <br />
                            Readiness Survey
                        </h1>
                        <p className="text-base md:text-xl">
                            Welcome! This AI Readiness Assessment should be
                            completed quarterly as one of your foundational AI
                            KPIs (Key Performance Indicators).
                        </p>
                        <p className="text-base md:text-xl">
                            It takes approximately 10 minutes to complete. You
                            can save your results as a PDF or compare with
                            industry benchmarks.
                        </p>
                        <Button
                            size="lg"
                            onClick={onStartAssessment}
                            className="bg-white hover:bg-white text-blue-600 font-bold rounded-md shadow-md px-6"
                        >
                            Start Assessment
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
