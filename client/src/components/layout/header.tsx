import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAssessment } from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { navigate } from "wouter/use-browser-location";
import logoPath from "@/assets/logo-keeran.svg";

export default function Header() {
  const { user } = useAuth();
  const assessmentCreateModal = useAssessment();

  const handleAssessmentStart = () => {
    if (user) {
      // If user is logged in, use the existing assessment modal
      assessmentCreateModal.onOpen();
    } else {
      // If no user is logged in, show the guest dialog
      navigate("/#start");
    }
  };

  return (
    <header className="bg-[#082B3D] shadow-sm sticky top-0 z-50">
      <div className="container py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center">
          <Link href="/">
            <img
              src={logoPath}
              alt="MyZone AI Logo"
              className="h-10 w-auto dark:invert"
            />
          </Link>
          <div className="hidden md:block text-center"></div>
          <nav className="flex items-center justify-end space-x-8">
            <Button
              size="lg"
              className="hidden sm:block rounded-full font-bold text-base"
              onClick={handleAssessmentStart}
            >
              Start Assessment
            </Button>
            <Link href="/dashboard" asChild>
              <Button variant="link" className="text-white text-base">
                {user ? "Dashboard" : "Log In"}
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
