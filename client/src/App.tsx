import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAuthProvider } from "@/lib/google-auth-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import SurveyPage from "@/pages/survey";
import SurveyNew from "@/pages/dashboard-survey-new";
import DashboardHome from "@/pages/dashboard-home";
import SurveysPage from "@/pages/dashboard-surveys";
import AdminSurveysPage from "@/pages/dashboard-surveys"; // Using the new reorganized module
import UsersPage from "@/pages/dashboard-users";
import AccountSettingsPage from "./pages/dashboard-settings";

function Router() {
  const [location] = useLocation();
  const isDashboardRoute = location.startsWith("/dashboard");

  // If we're on a dashboard route, don't show the normal layout
  if (isDashboardRoute) {
    return (
      <Switch>
        <ProtectedRoute path="/dashboard" component={DashboardHome} />
        <ProtectedRoute
          path="/dashboard/assessments/new"
          component={SurveyNew}
        />
        <ProtectedRoute path="/dashboard/assessments" component={SurveysPage} />
        <ProtectedRoute
          path="/dashboard/account/settings"
          component={AccountSettingsPage}
        />
        <AdminProtectedRoute
          path="/dashboard/surveys"
          component={AdminSurveysPage}
        />
        <AdminProtectedRoute path="/dashboard/users" component={UsersPage} />
        <ProtectedRoute path="/dashboard/:rest*" component={DashboardHome} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For all other routes, use the normal layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="bg-white dark:bg-gray-900 flex-grow w-full mx-auto">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/about" component={SurveyPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GoogleAuthProvider>
            <AuthProvider>
              <Toaster />
              <Router />
            </AuthProvider>
          </GoogleAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
