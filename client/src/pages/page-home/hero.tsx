import { Button } from "@/components/ui/button";
// import Particles, { initParticlesEngine } from "@tsparticles/react";
// import { loadSlim } from "@tsparticles/slim";
// import { loadPolygonMaskPlugin } from "@tsparticles/plugin-polygon-mask";
// import type { Engine } from "@tsparticles/engine";
// import { useIsMobile } from "@/hooks/use-mobile";
// import homeTop from "@/assets/home-top-v3.svg";
import homeTopImage from "@/assets/ai-readiness-top.png";

interface HeroProps {
    onStartAssessment: () => void;
}

// Sample functional component
export const Hero: React.FC<HeroProps> = ({ onStartAssessment }) => {
    // const [init, setInit] = React.useState(false);
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
    //                 value: 150,
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
    //             scale: 0.975,
    //             type: "inline",
    //             url: homeTop,
    //             position: {
    //                 x: 9.75,
    //                 y: 0,
    //             },
    //         },
    //     }),
    //     [],
    // );

    const styles = {
        backgroundImage: `url(${homeTopImage})`,
        mixBlendMode: "screen",
    };

    return (
        <div className="bg-blue-800">
            <div className="container">
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
                    <div className="section-space-y max-w-[435px] space-y-6 lg:space-y-8 text-white">
                        <h1 className="section__title tracking-tight">
                            MyZone AI <br />
                            Readiness Survey
                        </h1>
                        <p className="text-base xl:text-xl">
                            Welcome! This AI Readiness Assessment should be
                            completed quarterly as one of your foundational AI
                            KPIs (Key Performance Indicators).
                        </p>
                        <p className="text-base xl:text-xl">
                            It takes approximately 10 minutes to complete. You
                            can save your results as a PDF or compare with
                            industry benchmarks.
                        </p>
                        <Button
                            size="lg"
                            onClick={onStartAssessment}
                            className="bg-white hover:bg-white text-blue-600 font-bold text-base"
                        >
                            Start Assessment
                        </Button>
                    </div>
                    <div className="relative aspect-[625/645]">
                        <div
                            className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat"
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
