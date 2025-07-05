export function Services() {
  return (
    <div className="py-20 bg-white dark:bg-slate-900">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            <h2 className="text-4xl font-extrabold text-foreground mb-6">
              Explore the 8 Pillars
              <br />
              of AI Readiness
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
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

          {/* Right Column - Dashboard Mockup */}
          <div className="relative">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              {/* Browser Header */}
              <div className="flex items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-700 rounded mx-4 px-3 py-1 text-sm text-gray-500 dark:text-gray-400">
                  myzone.ai/dashboard
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Assessment Completed</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">AI Readiness Score: 8.2/10</h3>
                  </div>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm">
                    Download Report
                  </button>
                </div>

                {/* Chart Area */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 h-48">
                  <div className="flex items-center justify-center h-full">
                    {/* Radar Chart Mockup */}
                    <div className="relative w-40 h-40">
                      <svg
                        width="160"
                        height="160"
                        viewBox="0 0 160 160"
                        className="absolute inset-0"
                      >
                        {/* Background Grid */}
                        <g transform="translate(80, 80)">
                          {/* Concentric circles */}
                          <circle
                            cx="0"
                            cy="0"
                            r="60"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r="40"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r="20"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                          
                          {/* Radar lines */}
                          {Array.from({ length: 8 }, (_, i) => {
                            const angle = (i * 45) - 90;
                            const rad = (angle * Math.PI) / 180;
                            const x = Math.cos(rad) * 60;
                            const y = Math.sin(rad) * 60;
                            return (
                              <line
                                key={i}
                                x1="0"
                                y1="0"
                                x2={x}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                              />
                            );
                          })}
                          
                          {/* Data polygon */}
                          <polygon
                            points="0,-50 35,-35 45,0 30,30 0,40 -25,25 -40,0 -30,-25"
                            fill="rgba(59, 130, 246, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Strategy & Vision</span>
                    <span className="font-medium text-foreground">9.2/10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data & Information</span>
                    <span className="font-medium text-foreground">8.5/10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Technology & Integration</span>
                    <span className="font-medium text-foreground">7.8/10</span>
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-xs text-muted-foreground">+ 5 more categories</span>
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