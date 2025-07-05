import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Category {
  title: string;
  description: string;
}

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-[0_20px_50px_0px_#00000008] border-t-4 border-t-blue-500">
      <h3 className="text-lg font-bold text-foreground mb-4">
        {category.title}
      </h3>
      <p className="text-sm lg:text-base text-foreground">
        {category.description}
      </p>
    </div>
  );
};

const categoriesData: Category[] = [
  {
    title: "Strategy & Vision",
    description:
      "Compare your AI readiness with industry standards and competitors",
  },
  {
    title: "Change-Readiness & Culture",
    description:
      "Evaluates the organizational culture and readiness for change in AI contexts.",
  },
  {
    title: "Skills & Literacy",
    description:
      "Measures the knowledge and literacy levels of AI across the workforce.",
  },
  {
    title: "Data & Information",
    description:
      "Assesses the management and utilization of data and information resources.",
  },
  {
    title: "Technology & Integration",
    description:
      "Evaluates the technological systems and their integration with AI processes.",
  },
  {
    title: "Process & Operations",
    description:
      "Reviews the efficiency and adaptability of operational processes with AI.",
  },
  {
    title: "Governance, Ethics & Risk",
    description:
      "Analyzes governance frameworks, ethical considerations, and risk management.",
  },
  {
    title: "Financial & Resources",
    description:
      "Assesses the availability and allocation of financial and resource supports.",
  },
];

export const Categories: React.FC = () => {
  return (
    <div className="section-space-y bg-radial-gradient">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="section__title text-foreground">
            What You'll Evaluate
          </h2>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <Carousel className="w-full max-w-sm mx-auto">
            <CarouselContent>
              {categoriesData.map((category, index) => (
                <CarouselItem key={index}>
                  <CategoryCard category={category} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categoriesData.map((category, index) => (
            <CategoryCard key={index} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
