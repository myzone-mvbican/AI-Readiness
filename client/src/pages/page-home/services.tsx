import { useEffect } from "react";

export function Services() {
  useEffect(() => {
    const targetElement = document.querySelector(".mockup-macbook"); // Assuming you want to observe this element

    const observerOptions = {
      root: null,
      rootMargin: "-200px",
      threshold: 0.5,
    };

    const observerCallback = (entries) => {
      entries.forEach(({ isIntersecting }: any) => {
        if (isIntersecting) {
          targetElement?.classList.add("opened");
          targetElement?.classList.remove("half");
        } else {
          targetElement?.classList.add("half");
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    if (targetElement) {
      observer.observe(targetElement);
    }

    // Cleanup on unmount
    return () => {
      if (targetElement) {
        observer.unobserve(targetElement);
      }
    };
  }, []);

  return (
    <div className="py-20 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="lg:pe-10">
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
          <div className="relative flex justify-center">
            <div className="mockup mockup-macbook loaded">
              <div className="part top">
                <img
                  src="https://d1xm195wioio0k.cloudfront.net/images/mockup/macbook-top.svg"
                  alt=""
                  className="top"
                />
                <img
                  src="https://d1xm195wioio0k.cloudfront.net/images/mockup/macbook-cover.svg"
                  alt=""
                  className="cover"
                />

                <video autoPlay={true} muted={true} loop={true}>
                  <source
                    src="https://d1xm195wioio0k.cloudfront.net/images/video/support.mp4"
                    type="video/mp4"
                  />
                </video>
              </div>
              <div className="part bottom">
                <img
                  src="https://d1xm195wioio0k.cloudfront.net/images/mockup/macbook-cover.svg"
                  alt=""
                  className="cover"
                />
                <img
                  src="https://d1xm195wioio0k.cloudfront.net/images/mockup/macbook-bottom.svg"
                  alt=""
                  className="bottom"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
