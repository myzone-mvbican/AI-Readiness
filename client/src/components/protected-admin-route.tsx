import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

type AdminProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>;
};

export function AdminProtectedRoute({
  path,
  component: Component,
}: AdminProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  // const [selectedTeam, setSelectedTeam] = useState<{ role: string } | null>(
  //   null,
  // );
  // const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  // Load selected team from local storage
  // useEffect(() => {
  //   setIsLoadingTeam(true);
  //   const savedTeam = localStorage.getItem("selectedTeam");
  //   if (savedTeam) {
  //     try {
  //       setSelectedTeam(JSON.parse(savedTeam));
  //     } catch (e) {
  //       console.error("Error parsing saved team:", e);
  //     }
  //   }
  //   setIsLoadingTeam(false);
  // }, []);

  // If still loading user or team data, show loading spinner
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If not authenticated at all, redirect to login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If authenticated but no team selected or not an admin team, redirect to dashboard
  if (user.role !== "admin") {
    return (
      <Route path={path}>
        <Redirect to="/dashboard" />
      </Route>
    );
  }

  // If authenticated and has admin role for current team, render the component
  return <Route path={path} component={Component} />;
}
