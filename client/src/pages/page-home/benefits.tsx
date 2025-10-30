import React from "react";

import iconOne from "@/assets/icon-ai-readiness-1.svg";
import iconTwo from "@/assets/icon-ai-readiness-2.svg";
import iconThree from "@/assets/icon-ai-readiness-3.svg";

interface BenefitCardProps {
    title: string;
    description: string;
    icon: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
    title,
    description,
    icon,
}) => {
    return (
        <div className="bg-white dark:bg-gray-900 text-center rounded-lg p-6 lg:py-10 shadow-[0_20px_50px_0px_#00000008]">
            <div className="flex justify-center mb-4 lg:mb-6">
                <img
                    src={icon}
                    alt="AI Readiness Icon"
                    className="size-16 lg:size-24"
                />
            </div>
            <div className="text-foreground text-xl lg:text-2xl font-bold mb-3">
                {title}
            </div>
            <p className="text-foreground">{description}</p>
        </div>
    );
};

const benefitsData = [
    {
        title: "Benchmark",
        description:
            "Compare your AI readiness with industry standards and competitors",
        icon: iconOne,
    },
    {
        title: "Track Progress",
        description:
            "Monitor your improvement over time with quarterly assessments",
        icon: iconTwo,
    },
    {
        title: "Get Insights",
        description:
            "Receive tailored recommendations to improve your AI capabilities",
        icon: iconThree,
    },
];

export const Benefits: React.FC = () => {
    return (
        <div className="section-space-y bg-radial-gradient">
            <div className="container">
                <div className="text-center">
                    <h2 className="section__title text-foreground">
                        Benefits of the Assessment
                    </h2>
                    <p className="mt-4 text-base lg:text-lg text-muted-foreground">
                        Understand your organization&apos;s AI readiness and get
                        actionable insights
                    </p>
                </div>
                <div className="mt-12 lg:mt-16 grid gap-8 md:grid-cols-3">
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
