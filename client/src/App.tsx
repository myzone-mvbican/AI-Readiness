import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import SurveyPage from "@/pages/survey";
import SurveyNew from "@/pages/dashboard-survey-new";
import DashboardHome from "@/pages/dashboard-home";
import SurveysPage from "@/pages/dashboard-surveys";
import AdminSurveysPage from "@/pages/dashboard-admin-surveys";
import UsersPage from "@/pages/dashboard-users";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Import the team-aware protected route
import { AdminProtectedRoute } from "./lib/admin-protected-route";

// Make sure the dashboard settings page is properly imported
import SettingsPage from "./pages/dashboard-settings";

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
        <ProtectedRoute path="/dashboard/settings" component={SettingsPage} />
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
          <Route path="/login" component={AuthPage} />
          <Route path="/signup" component={AuthPage} />
          <Route path="/about" component={SurveyPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GoogleOAuthProvider clientId="894401584949-ieet20ddcm1bstdfv5lumiktnigg7agu.apps.googleusercontent.com">
            <AuthProvider>
              <Toaster />
              <Router />
            </AuthProvider>
          </GoogleOAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
