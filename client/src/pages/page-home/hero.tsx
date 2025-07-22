import { Button } from "@/components/ui/button";
// import { useState, useEffect, useMemo } from "react";
// import { loadSlim } from "@tsparticles/slim";
// import Particles, { initParticlesEngine } from "@tsparticles/react";
// import { loadPolygonMaskPlugin } from "@tsparticles/plugin-polygon-mask";
// import type { Engine } from "@tsparticles/engine";
// import { useIsMobile } from "@/hooks/use-mobile";
import homeTopImage from "@/assets/Keeran_BrandGuide.png";

interface HeroProps {
    onStartAssessment: () => void;
}

// Sample functional component
export const Hero: React.FC<HeroProps> = ({ onStartAssessment }) => {
    // const [init, setInit] = useState(false);
    // const isMobile = useIsMobile();

    // useEffect(() => {
    //     initParticlesEngine(async (engine: Engine) => {
    //         await loadSlim(engine);
    //         await loadPolygonMaskPlugin(engine);
    //     }).then(() => {
    //         setInit(true);
    //     });
    // }, []);

    // const options = useMemo(
    //     () => ({
    //         fpsLimit: 60,
    //         fullScreen: false,
    //         interactivity: {
    //             events: {
    //                 onHover: {
    //                     enable: true,
    //                     mode: "bubble",
    //                 },
    //             },
    //             modes: {
    //                 bubble: {
    //                     distance: 40,
    //                     duration: 2,
    //                     opacity: 8,
    //                     size: 5,
    //                     speed: 3,
    //                 },
    //             },
    //         },
    //         particles: {
    //             color: {
    //                 value: "#fff",
    //                 animation: {
    //                     enable: true,
    //                     speed: 20,
    //                     sync: true,
    //                 },
    //             },
    //             links: {
    //                 blink: false,
    //                 color: "random",
    //                 consent: false,
    //                 distance: 30,
    //                 enable: true,
    //                 opacity: 0.3,
    //                 width: 1,
    //             },
    //             move: {
    //                 enable: true,
    //                 outModes: "bounce",
    //                 speed: { min: 0.5, max: 1 },
    //             },
    //             number: {
    //                 value: 100,
    //             },
    //             opacity: {
    //                 animation: {
    //                     enable: true,
    //                     speed: 3,
    //                     sync: false,
    //                 },
    //                 random: false,
    //                 value: { min: 0.05, max: 1 },
    //             },
    //             shape: {
    //                 type: "circle",
    //             },
    //             size: {
    //                 random: true,
    //                 animation: {
    //                     enable: true,
    //                     speed: 30,
    //                     sync: false,
    //                 },
    //                 value: { min: 0.1, max: 1 },
    //             },
    //         },
    //         polygon: {
    //             draw: {
    //                 enable: true,
    //                 stroke: {
    //                     color: "#fff",
    //                     width: 0.5,
    //                     opacity: 0.2,
    //                 },
    //             },
    //             move: {
    //                 radius: 10,
    //             },
    //             inline: {
    //                 arrangement: "equidistant",
    //             },
    //             scale: .36,
    //             type: "inline",
    //             url: homeTopImage,
    //             position: {
    //                 x: 10,
    //                 y: 1,
    //             },
    //         },
    //     }),
    //     [],
    // );

    const styles = {
        backgroundImage: `url(${homeTopImage})`,
    };

    return (
        <div className="bg-gradient-to-br from-[#E6EAEC] to-white">
            <div className="container">
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
                    <div className="section-space-y max-w-[435px] space-y-6 lg:space-y-8">
                        <h1 className="section__title tracking-tight">
                            Keeran AI <br />
                            Readiness <br />
                            Assessment
                        </h1>
                        <p className="text-base xl:text-xl">
                            Take this 10-minute assessment to find out where your business stands with AI. Compare your results across industry benchmarks, and track your progress quarter by quarter.
                        </p> 
                        <Button
                            size="lg" 
                            onClick={onStartAssessment}
                            className="rounded-full font-bold text-base"
                        >
                            Start Assessment
                        </Button>
                    </div>
                    <div className="relative aspect-[625/645]">
                        <div
                            className="absolute inset-0 z-0 bg-contain bg-bottom bg-no-repeat"
                            style={styles}
                        >
                            {/* {!isMobile && init && (
                                <Particles
                                    id="tsparticles"
                                    options={options}
                                    className="absolute inset-0"
                                />
                            )} */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
