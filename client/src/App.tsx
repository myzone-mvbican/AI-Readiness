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
import SurveysList from "@/pages/dashboard-surveys";
import DashboardHome from "@/pages/dashboard-home";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Make sure the dashboard settings page is properly imported
import SettingsPage from "./pages/dashboard-settings";

function Router() {
  const [location] = useLocation();
  const isDashboardRoute = location.startsWith("/dashboard");

  // If we're on a dashboard route, don't show the normal layout
  if (isDashboardRoute) {
    return (
      <Switch>
        <Route path="/dashboard" component={DashboardHome} />
        <Route path="/dashboard/assessments/new" component={SurveyNew} />
        <Route path="/dashboard/assessments" component={SurveysList} />
        <Route path="/dashboard/settings" component={SettingsPage} />
        <Route path="/dashboard/:rest*" component={DashboardHome} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For all other routes, use the normal layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow w-full mx-auto">
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
          <GoogleOAuthProvider clientId="GOOGLE_CLIENT_ID_PLACEHOLDER">
            <Toaster />
            <Router />
          </GoogleOAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
