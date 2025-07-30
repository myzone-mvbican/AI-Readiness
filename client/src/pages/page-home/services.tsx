import CategoriesRadarChart from "@/components/survey/radar";
import { Assessment } from "@shared/types";

export function Services() {
  // Comprehensive dummy assessment data for demonstration
  const assessment: Assessment = {
    id: 999,
    userId: 1,
    surveyId: 1,
    teamId: 1,
    title: "Q4 2024 AI Readiness Assessment",
    status: "completed",
    email: "demo@myzone.ai",
    guest: null,
    responses: {
      "Strategy & Vision": 7.5,
      "Change-Readiness & Culture": 6.8,
      "Skills & Literacy": 8.2,
      "Data & Information": 7.1,
      "Technology & Integration": 6.5,
      "Process & Operations": 7.8,
      "Governance, Ethics & Risk": 6.9,
      "Financial & Resources": 7.3,
    },
    score: 73.9,
    answers: [
      {
        q: 1,
        type: "scale",
        a: 2,
        r: "We have strong executive buy-in for AI initiatives",
      },
      {
        q: 2,
        type: "scale",
        a: 1,
        r: "Clear AI strategy defined but implementation ongoing",
      },
      {
        q: 3,
        type: "scale",
        a: 2,
        r: "High-quality data infrastructure in place",
      },
      {
        q: 4,
        type: "scale",
        a: 1,
        r: "Modern tech stack with cloud capabilities",
      },
      { q: 5, type: "scale", a: 0, r: "Mixed skill levels across teams" },
      {
        q: 6,
        type: "scale",
        a: 2,
        r: "Strong governance framework established",
      },
      {
        q: 7,
        type: "scale",
        a: 1,
        r: "Culture is adapting to AI transformation",
      },
      {
        q: 8,
        type: "scale",
        a: 1,
        r: "Operations being optimized for AI workflows",
      },
    ],
    recommendations: "",
    pdfPath: "",
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    survey: {
      id: 1,
      title: "AI Readiness Assessment 2024",
      description: "",
      authorId: 1,
      isActive: true,
      questions: [
        { id: 1, question: "", category: "Strategy & Vision", details: "" },
        {
          id: 2,
          question: "",
          category: "Change-Readiness & Culture",
          details: "",
        },
        { id: 3, question: "", category: "Skills & Literacy", details: "" },
        { id: 4, question: "", category: "Data & Information", details: "" },
        {
          id: 5,
          question: "",
          category: "Technology & Integration",
          details: "",
        },
        { id: 6, question: "", category: "Process & Operations", details: "" },
        {
          id: 7,
          question: "",
          category: "Governance, Ethics & Risk",
          details: "",
        },
        { id: 8, question: "", category: "Financial & Resources", details: "" },
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };

  return (
    <div className="py-20 bg-white hover overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 lg:pe-10">
            <h2 className="section__title text-foreground mb-6">
              Explore the 8 Pillars
              <br />
              of AI Readiness
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p className="leading-relaxed">
                This assessment looks across the areas that matter most for
                using AI safely and effectively in your business. From
                leadership priorities and risk management to your data and
                day-to-day operations, it highlights where you’re strong and
                where there’s room to grow.
              </p>
              <p className="leading-relaxed">
                Whether you're just starting your AI journey or scaling an
                existing initiative, this assessment helps you align your
                resources, people, and processes to the demands of AI
                transformation.
              </p>
            </div>
          </div>

          {/* Right Column - 3D Laptop Mockup */}
          <div className="lg:col-span-3 relative flex justify-center aspect-[16/9]">
            <CategoriesRadarChart assessment={assessment} />
          </div>
        </div>
      </div>
    </div>
  );
}
