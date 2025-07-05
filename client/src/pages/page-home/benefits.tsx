import React from "react";

export const Benefits: React.FC = () => {
    return (
        <div className="bg-accent dark:bg-muted py-16 md:py-24 lg:py-32">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
                        Benefits of the Assessment
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Understand your organization&apos;s AI readiness and get
                        actionable insights
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    {/* Feature 1 */}
                    <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-foreground text-2xl font-semibold mb-3">
                            Benchmark
                        </div>
                        <p className="text-muted-foreground">
                            Compare your AI readiness with industry standards
                            and competitors
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-foreground text-2xl font-semibold mb-3">
                            Track Progress
                        </div>
                        <p className="text-muted-foreground">
                            Monitor your improvement over time with quarterly
                            assessments
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-foreground text-2xl font-semibold mb-3">
                            Get Insights
                        </div>
                        <p className="text-muted-foreground">
                            Receive tailored recommendations to improve your AI
                            capabilities
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Benefits;
