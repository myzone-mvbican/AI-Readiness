import laptopImage from "@/assets/Macbook-Pro-Crop.png";
import CategoriesRadarChart from "@/components/survey/radar";
import { Assessment } from "@shared/types";

export function Services() {
  // Comprehensive dummy assessment data for demonstration
  const assessment: Assessment = {
    id: 194,
    userId: 1,
    surveyId: 1,
    teamId: 1,
    title: "Q4 2024 AI Readiness Assessment",
    status: "completed",
    email: "demo@myzone.ai",
    guest: null,
    responses: {
      "strategy": 7.5,
      "culture": 6.8,
      "talent": 8.2,
      "data": 7.1,
      "technology": 6.5,
      "operations": 7.8,
      "governance": 6.9,
      "financial": 7.3
    },
    score: 73.9,
    answers: [
      { q: 1, type: "scale", a: 2, r: "We have strong executive buy-in for AI initiatives" },
      { q: 2, type: "scale", a: 1, r: "Clear AI strategy defined but implementation ongoing" },
      { q: 3, type: "scale", a: 2, r: "High-quality data infrastructure in place" },
      { q: 4, type: "scale", a: 1, r: "Modern tech stack with cloud capabilities" },
      { q: 5, type: "scale", a: 0, r: "Mixed skill levels across teams" },
      { q: 6, type: "scale", a: 2, r: "Strong governance framework established" },
      { q: 7, type: "scale", a: 1, r: "Culture is adapting to AI transformation" },
      { q: 8, type: "scale", a: 1, r: "Operations being optimized for AI workflows" }
    ],
    recommendations: "Based on your assessment, your organization shows strong potential for AI adoption with particular strengths in data infrastructure and governance. Focus areas for improvement include talent development and cultural change management. Consider implementing AI training programs and establishing cross-functional AI teams to accelerate adoption.",
    pdfPath: "/uploads/1/myzoneai-readiness-report-demo.pdf",
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    survey: {
      id: 1,
      title: "AI Readiness Assessment 2024",
      description: "Comprehensive evaluation of organizational AI readiness across 8 key dimensions",
      authorId: 1,
      isActive: true,
      questions: [
        { id: 1, question: "Does your organization have a clear AI strategy?", category: "strategy", details: "Strategy & Vision" },
        { id: 2, question: "Is your organizational culture prepared for AI adoption?", category: "culture", details: "Change-Readiness & Culture" },
        { id: 3, question: "Does your team have the necessary AI skills?", category: "talent", details: "Skills & Literacy" },
        { id: 4, question: "How would you assess your data quality and accessibility?", category: "data", details: "Data & Information" },
        { id: 5, question: "Is your technology infrastructure ready for AI?", category: "technology", details: "Technology & Integration" },
        { id: 6, question: "Are your operations optimized for AI integration?", category: "operations", details: "Process & Operations" },
        { id: 7, question: "Are there proper governance frameworks for AI?", category: "governance", details: "Governance, Ethics & Risk" },
        { id: 8, question: "Does your organization have adequate financial resources for AI?", category: "financial", details: "Financial & Resources" }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
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
            <p className="font-bold text-base lg:text-lg leading-relaxed mb-8">
              Gain a holistic view of your organization's preparedness across
              the key dimensions that drive successful AI adoption.
            </p>
            <div className="space-y-6 text-muted-foreground">
              <p className="leading-relaxed">
                Our AI Readiness Assessment dives deep into eight strategic
                focus areas that are critical to building a future-ready,
                AI-enabled organization. From leadership vision and ethical
                governance to data infrastructure and operational maturity, each
                category is designed to uncover strengths, highlight gaps, and
                guide your next steps with clarity.
              </p>
              <p className="leading-relaxed">
                Whether you're just starting your AI journey or scaling an
                existing initiative, this comprehensive evaluation framework
                helps you align your resources, people, and processes to the
                demands of AI transformation.
              </p>
            </div>
          </div>

          {/* Right Column - 3D Laptop Mockup */}
          <div className="lg:col-span-3 relative flex justify-center">
            <div
              className="relative w-full h-full bg-contain bg-center bg-no-repeat aspect-[16/9]"
              style={{
                backgroundImage: `url(${laptopImage})`,
              }}
            >
              <CategoriesRadarChart
                assessment={assessment}
                className="absolute h-[82.5%] w-[73.5%] top-[5%] left-[12.5%]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}