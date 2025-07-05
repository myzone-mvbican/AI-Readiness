
import React from "react";
import { BarChart3, TrendingUp, Lightbulb } from "lucide-react";

interface BenefitCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ title, description, icon }) => {
    return (
        <div className="bg-white dark:bg-gray-900 text-center rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    {icon}
                </div>
            </div>
            <div className="text-foreground text-xl lg:text-2xl font-bold mb-3">
                {title}
            </div>
            <p className="text-foreground">
                {description}
            </p>
        </div>
    );
};

const benefitsData = [
    {
        title: "Benchmark",
        description: "Compare your AI readiness with industry standards and competitors",
        icon: <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
    },
    {
        title: "Track Progress",
        description: "Monitor your improvement over time with quarterly assessments",
        icon: <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
    },
    {
        title: "Get Insights",
        description: "Receive tailored recommendations to improve your AI capabilities",
        icon: <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
    }
];

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
                    {benefitsData.map((benefit, index) => (
                        <BenefitCard
                            key={index}
                            title={benefit.title}
                            description={benefit.description}
                            icon={benefit.icon}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Benefits;
