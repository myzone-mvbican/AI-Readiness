import { Button } from "@/components/ui/button";
import homeTopImage from "@/assets/Keeran_BrandGuide.png";

interface HeroProps {
    onStartAssessment: () => void;
}

// Sample functional component
export const Hero: React.FC<HeroProps> = ({ onStartAssessment }) => {
    return (
        <div className="bg-gradient-to-br from-[#E6EAEC] to-white">
            <div className="container">
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
                    <div className="section-space-y max-w-[435px] space-y-6 lg:space-y-8">
                        <h1 className="tracking-tight">
                            Keeran AI <br />
                            Readiness <br />
                            Assessment
                        </h1>
                        <p className="text-base xl:text-xl">
                            Take this 10-minute assessment to find out where
                            your business stands with AI. Compare your results
                            across industry benchmarks, and track your progress
                            quarter by quarter.
                        </p>
                        <Button
                            size="lg"
                            onClick={onStartAssessment}
                            className="rounded-full font-bold text-base"
                        >
                            Start Assessment
                        </Button>
                    </div>
                    <div className="flex flex-col h-full">
                        <img
                            className="block mt-auto"
                            src={homeTopImage}
                            alt="Keeran Networks man with laptop"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
