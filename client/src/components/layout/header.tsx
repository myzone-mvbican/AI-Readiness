import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAssessment } from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import logoPath from "@/assets/logo-myzone-ai-black.svg";

export default function Header() {
  const { user } = useAuth();
  const assessmentCreateModal = useAssessment();
  const [location, setLocation] = useLocation();

  const handleAssessmentStart = () => {
    if (user) {
      // If user is logged in, use the existing assessment modal
      assessmentCreateModal.onOpen();
    } else {
      // If no user is logged in, navigate to home with hash to trigger guest dialog
      if (location !== "/") {
        setLocation("/");
      }
      // Set hash to trigger the guest dialog on homepage
      window.location.hash = "start";
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
      <div className="container py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center">
          <Link href="/">
            <img
              src={logoPath}
              alt="MyZone AI Logo"
              className="h-10 w-auto dark:invert"
            />
          </Link>
          <div className="hidden md:block text-center">
            <p className="text-xs lg:text-base">
              Try It Free — <strong>Limited Time Beta Access!</strong>
            </p>
          </div>
          <nav className="flex items-center justify-end space-x-8">
            <Button
              className="hidden sm:block font-bold text-base"
              onClick={handleAssessmentStart}
            >
              Start Assessment
            </Button>
            <Link href="/dashboard" asChild>
              <Button
                variant="link"
                className="text-dark hover:text-blue-600 dark:text-white font-bold text-base"
              >
                {user ? "Dashboard" : "Log In"}
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
