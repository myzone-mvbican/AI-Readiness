import { useEffect } from "react";
import { useLocation } from "wouter";

const getTitleForRoute = (path: string): string => {
  const baseTitle = "Keeran Networks - AI Readiness Platform";

  // Handle dynamic routes with parameters
  if (path.startsWith("/dashboard/assessments/")) {
    return `Assessment Details - ${baseTitle}`;
  }

  if (path.startsWith("/dashboard/surveys/")) {
    return `Survey Details - ${baseTitle}`;
  }

  // Static route mappings
  const routeTitles: Record<string, string> = {
    "/": "Ready for the future",
    "/auth": "Sign In",
    "/assessment": "Take Assessment",
    "/assessment/guest": "Guest Assessment",
    "/assessment/completed": "Assessment Complete",
    "/dashboard": "Dashboard",
    "/dashboard/assessments": "My Assessments",
    "/dashboard/compare": "Benchmark Comparison",
    "/dashboard/surveys": "Survey Management",
    "/dashboard/users": "User Management",
    "/dashboard/teams": "Team Management",
    "/dashboard/settings": "Settings",
    "/survey-completed": "Survey Complete",
    "/not-found": "Page Not Found",
  };

  const routeTitle = routeTitles[path];
  if (routeTitle) {
    return `${routeTitle} - ${baseTitle}`;
  }

  // Default fallback
  return baseTitle;
};

export const usePageTitle = (customTitle?: string) => {
  const [location] = useLocation();

  useEffect(() => {
    const title = customTitle || getTitleForRoute(location);
    document.title = title;

    // Update meta description based on route
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descriptions: Record<string, string> = {
        "/": "Evaluate your organization's AI readiness with comprehensive assessments, benchmarking, and personalized recommendations.",
        "/assessment":
          "Complete your AI readiness assessment to understand your organization's current capabilities and improvement opportunities.",
        "/dashboard":
          "View your AI readiness dashboard with assessments, benchmarks, and performance insights.",
        "/dashboard/compare":
          "Compare your AI readiness scores against industry and global benchmarks.",
        "/dashboard/assessments":
          "Manage and review your completed AI readiness assessments and detailed reports.",
        "/dashboard/surveys":
          "Create and manage custom AI readiness surveys for your organization.",
        "/auth":
          "Sign in to access your AI readiness assessment dashboard and manage your organization's progress.",
      };

      const description = descriptions[location] || descriptions["/"];
      metaDescription.setAttribute("content", description);
    }

    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }

    // Update Twitter title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute("content", title);
    }
  }, [location, customTitle]);

  return {
    setTitle: (title: string) => {
      document.title = `${title} - Keeran AI`;
    },
  };
};
