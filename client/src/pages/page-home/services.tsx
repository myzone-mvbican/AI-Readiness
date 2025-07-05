import { useEffect, useState } from "react";

export function Services() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    // Trigger the laptop opening animation after component mounts
    const timer1 = setTimeout(() => setIsLoaded(true), 100);
    const timer2 = setTimeout(() => setIsOpened(true), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="py-20 bg-white dark:bg-slate-900">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            <h2 className="section__title text-foreground mb-6">
              Explore the 8 Pillars
              <br />
              of AI Readiness
            </h2>
            <p className="font-bold text-base lg:text-lg leading-relaxed mb-8">
              Gain a holistic view of your organization's preparedness across the key dimensions that drive successful AI adoption.
            </p>
            <div className="space-y-6 text-muted-foreground">
              <p className="leading-relaxed">
                Our AI Readiness Assessment dives deep into eight strategic focus areas that are critical to building a future-ready, AI-enabled organization. From leadership vision and ethical governance to data infrastructure and operational maturity, each category is designed to uncover strengths, highlight gaps, and guide your next steps with clarity.
              </p>
              <p className="leading-relaxed">
                Whether you're just starting your AI journey or scaling an existing initiative, this comprehensive evaluation framework helps you align your resources, people, and processes to the demands of AI transformation.
              </p>
            </div>
          </div>

          {/* Right Column - 3D Laptop Mockup */}
          <div className="relative flex justify-center">
            <div className="text-center">
              <div 
                className={`inline-block relative z-[3] text-center transition-opacity duration-500 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  perspective: '2400px',
                  perspectiveOrigin: '50% 100%',
                  fontSize: '0'
                }}
              >
                {/* Top Part (Screen) */}
                <div 
                  className={`inline-block relative transition-all duration-[900ms] ${
                    isOpened ? 'laptop-opened' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: '50% 100%',
                    transform: isOpened ? 'translate3d(0, 0, 0) rotateX(-90deg)' : 'translate3d(0, 0, 0) rotateX(-90deg)'
                  }}
                >
                  {/* Screen */}
                  <div 
                    className="absolute top-0 left-0 transition-all duration-[900ms]"
                    style={{
                      transformOrigin: '50% 0',
                      transform: isOpened ? 'translate3d(0, 0, -11px) rotateX(90deg) scale(1, 1)' : 'translate3d(0, 0, -11px) rotateX(90deg)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    {/* MacBook Screen Frame */}
                    <div className="relative w-96 h-60 bg-gray-800 rounded-lg p-3 shadow-2xl">
                      {/* Screen Content */}
                      <div className="w-full h-full bg-white rounded-md overflow-hidden relative">
                        {/* Browser Interface */}
                        <div className="flex items-center p-2 bg-gray-100 border-b">
                          <div className="flex space-x-1.5">
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          </div>
                          <div className="flex-1 bg-white rounded mx-4 px-2 py-1 text-xs text-gray-500">
                            myzone.ai/dashboard
                          </div>
                        </div>
                        
                        {/* Dashboard Content */}
                        <div className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                                <span className="text-xs font-medium">Assessment Completed</span>
                              </div>
                              <h3 className="text-sm font-semibold">AI Readiness Score: 8.2/10</h3>
                            </div>
                            <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                              Download
                            </button>
                          </div>

                          {/* Chart Area */}
                          <div className="bg-gray-50 rounded p-3 h-24 flex items-center justify-center">
                            <div className="relative w-20 h-20">
                              <svg width="80" height="80" viewBox="0 0 80 80">
                                <g transform="translate(40, 40)">
                                  <circle cx="0" cy="0" r="30" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                                  <circle cx="0" cy="0" r="20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                                  <circle cx="0" cy="0" r="10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                                  <polygon
                                    points="0,-25 18,-18 23,0 15,15 0,20 -13,13 -20,0 -15,-13"
                                    fill="rgba(59, 130, 246, 0.2)"
                                    stroke="#3b82f6"
                                    strokeWidth="1"
                                  />
                                </g>
                              </svg>
                            </div>
                          </div>

                          {/* Category Scores */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Strategy & Vision</span>
                              <span className="font-medium">9.2/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Data & Information</span>
                              <span className="font-medium">8.5/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Technology</span>
                              <span className="font-medium">7.8/10</span>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-400">+ 5 more categories</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Screen Cover (Back) */}
                  <div 
                    className="relative"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-96 h-60 bg-gray-700 rounded-lg shadow-2xl"></div>
                  </div>
                </div>

                {/* Bottom Part (Keyboard) */}
                <div 
                  className="absolute top-0 left-0"
                  style={{
                    transform: 'translate3d(0, 0, 0) rotateX(-90deg)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <div 
                    className="relative"
                    style={{
                      transformOrigin: '50% 0',
                      transform: 'translate3d(0,0,0) rotateX(90deg)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    {/* MacBook Base */}
                    <div className="w-96 h-64 bg-gray-300 rounded-lg shadow-xl">
                      {/* Keyboard area */}
                      <div className="p-6 pt-8">
                        <div className="bg-gray-800 rounded-md h-32 p-2">
                          {/* Simplified keyboard layout */}
                          <div className="grid grid-cols-12 gap-1 h-full">
                            {Array.from({ length: 60 }, (_, i) => (
                              <div key={i} className="bg-gray-600 rounded-sm"></div>
                            ))}
                          </div>
                        </div>
                        {/* Trackpad */}
                        <div className="mt-4 mx-auto w-24 h-16 bg-gray-700 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}