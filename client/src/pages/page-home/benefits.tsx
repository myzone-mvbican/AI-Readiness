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
            <p className="text-foreground mx-auto max-w-[295px]">{description}</p>
        </div>
    );
};

const benefitsData = [
    {
        title: "Benchmark",
        description:
            "See how your readiness compares to others in your space",
        icon: iconOne,
    },
    {
        title: "Track Progress",
        description:
            "Revisit this quarterly and watch your capabilities evolve",
        icon: iconTwo,
    },
    {
        title: "Get Clear Guidance",
        description:
            "Walk away with practical ideas to guide your next steps",
        icon: iconThree,
    },
];

export const Benefits: React.FC = () => {
    return (
        <div className="section-space-y bg-[#E6EAEC]">
            <div className="container">
                <div className="text-center">
                    <h2 className="section__title text-foreground">
                        Why Take This Assessment?
                    </h2>
                    <p className="mt-4 text-base lg:text-lg text-muted-foreground">
                        Understand where you stand with AI and what steps to take next
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
