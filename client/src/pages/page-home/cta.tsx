import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadPolygonMaskPlugin } from "@tsparticles/plugin-polygon-mask";
import type { Engine } from "@tsparticles/engine";
import homeBottom from "@/assets/home-bottom-v2.svg";

interface CtaProps {
  onStartAssessment: () => void;
}

export function Cta({ onStartAssessment }: CtaProps) {
  const [init, setInit] = React.useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
      await loadPolygonMaskPlugin(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      fpsLimit: 60,
      fullScreen: false,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "bubble",
          },
        },
        modes: {
          bubble: {
            distance: 40,
            duration: 2,
            opacity: 8,
            size: 6,
            speed: 3,
          },
        },
      },
      particles: {
        color: {
          value: "#fff",
          animation: {
            enable: true,
            speed: 20,
            sync: true,
          },
        },
        links: {
          blink: false,
          color: "random",
          consent: false,
          distance: 20,
          enable: true,
          opacity: 0.4,
          width: 1.2,
        },
        move: {
          enable: true,
          outModes: "bounce",
          speed: { min: 0.5, max: 1 },
        },
        number: {
          value: 150,
        },
        opacity: {
          random: false,
          animation: {
            enable: true,
            speed: 1.5,
            sync: false,
          },
          value: { min: 0.1, max: 0.8 },
        },
        shape: {
          type: "circle",
        },
        size: {
          random: true,
          animation: {
            enable: true,
            speed: 30,
            sync: false,
          },
          value: { min: 0.2, max: 1 },
        },
      },
      polygon: {
        draw: {
          enable: true,
          stroke: {
            color: "#fff",
            width: 0.4,
            opacity: 0.3,
          },
        },
        move: {
          radius: 8,
        },
        inline: {
          arrangement: "equidistant",
        },
        scale: 1,
        type: "inline",
        url: homeBottom,
        position: {
          x: 0,
          y: 1,
        },
      },
    }),
    [],
  );

  return (
    <div className="section-space-y bg-gradient-to-br from-[#1C2D8A] via-[#3651DA] to-[#1C2D8A]">
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Visual Space with tsParticles */}
          <div className="hidden lg:block relative aspect-[4/3.5]">
            <div className="absolute inset-0 z-0">
              {init && (
                <Particles
                  id="tsparticles-cta"
                  options={options}
                  className="w-full h-full relative"
                />
              )}
            </div>
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
