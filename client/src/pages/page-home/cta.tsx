import { Button } from "@/components/ui/button";

interface CtaProps {
  onStartAssessment: () => void;
}

export function Cta({ onStartAssessment }: CtaProps) {
  return (
    <div className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
      {/* Background AI Network Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 600"
          className="w-full h-full"
        >
          {/* Central AI Icon */}
          <g transform="translate(300, 250)">
            {/* Central Square with AI */}
            <rect
              x="35"
              y="35"
              width="80"
              height="80"
              rx="8"
              fill="rgba(255,255,255,0.9)"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth="2"
            />
            <text
              x="75"
              y="85"
              textAnchor="middle"
              fill="rgba(59, 130, 246, 1)"
              fontSize="24"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              AI
            </text>
            
            {/* Orbital Rings */}
            <circle
              cx="75"
              cy="75"
              r="120"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
              strokeDasharray="5,5"
            />
            <circle
              cx="75"
              cy="75"
              r="160"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              strokeDasharray="3,7"
            />
            
            {/* Connection Lines */}
            <line
              x1="75"
              y1="-45"
              x2="75"
              y2="35"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            />
            <line
              x1="195"
              y1="75"
              x2="115"
              y2="75"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            />
            <line
              x1="75"
              y1="195"
              x2="75"
              y2="115"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            />
            <line
              x1="-45"
              y1="75"
              x2="35"
              y2="75"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            />
            
            {/* Corner Nodes */}
            <circle cx="75" cy="-45" r="8" fill="rgba(255,255,255,0.8)" />
            <circle cx="195" cy="75" r="8" fill="rgba(255,255,255,0.8)" />
            <circle cx="75" cy="195" r="8" fill="rgba(255,255,255,0.8)" />
            <circle cx="-45" cy="75" r="8" fill="rgba(255,255,255,0.8)" />
            
            {/* Diagonal Connections */}
            <line
              x1="131"
              y1="19"
              x2="115"
              y2="35"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
            <line
              x1="131"
              y1="131"
              x2="115"
              y2="115"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
            <line
              x1="19"
              y1="131"
              x2="35"
              y2="115"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
            <line
              x1="19"
              y1="19"
              x2="35"
              y2="35"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
          </g>
          
          {/* Floating Particles */}
          <circle cx="100" cy="100" r="2" fill="rgba(255,255,255,0.6)">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="800" cy="150" r="1.5" fill="rgba(255,255,255,0.5)">
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="950" cy="300" r="2.5" fill="rgba(255,255,255,0.4)">
            <animate
              attributeName="opacity"
              values="0.1;0.7;0.1"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="150" cy="400" r="1.8" fill="rgba(255,255,255,0.6)">
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="1050" cy="450" r="1.2" fill="rgba(255,255,255,0.5)">
            <animate
              attributeName="opacity"
              values="0.2;0.9;0.2"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Visual Space (AI Network handled by background) */}
          <div className="hidden lg:block">
            {/* This space is for the visual - handled by background SVG */}
          </div>
          
          {/* Right Column - CTA Content */}
          <div className="text-white text-center lg:text-left">
            <h2 className="text-4xl font-extrabold mb-6">
              AI Readiness Assessment
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-md">
              Take the AI Readiness Assessment to gauge your organization's preparedness. Ready to begin?
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-blue-600 border-white hover:bg-blue-50 hover:text-blue-700 px-8 py-3 text-lg font-semibold"
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