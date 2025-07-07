import { useEffect } from "react";
import recording from "@/assets/recording.mp4";

export function SampleComponent() {
  useEffect(() => {
    const targetElement = document.querySelector(".mockup-macbook"); // Assuming you want to observe this element

    const observerOptions = {
      root: null,
      rootMargin: "-200px",
      threshold: 0.5,
    };

    const observerCallback = (entries: any) => {
      entries.forEach(({ isIntersecting }: any) => {
        if (isIntersecting) {
          targetElement?.classList.add("opened");
        } else {
          targetElement?.classList.remove("opened");
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
          <source src={recording} type="video/mp4" />
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
  );
}
