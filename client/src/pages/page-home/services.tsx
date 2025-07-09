import laptopImage from "@/assets/Macbook-Pro-Crop.png";
import CategoriesRadarChart from "@/components/survey/radar";
import { AssessmentResponse, Survey } from "@shared/types";
import { useQuery } from "@tanstack/react-query";

export function Services() {
  const { data, isLoading } = useQuery<AssessmentResponse & { survey: Survey }>(
    {
      queryKey: [`/api/assessments/194`],
      enabled: true,
    },
  );

  const assessment = data?.assessment || {};

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
              {!isLoading && (
                <CategoriesRadarChart
                  assessment={assessment}
                  className="absolute h-[82.5%] w-[73.5%] top-[5%] left-[12.5%]"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
