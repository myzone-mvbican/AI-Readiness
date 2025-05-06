import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import SurveyPage from "@/pages/survey";
import Dashboard from "@/pages/dashboard";
import DashboardHome from "@/pages/dashboard-home";
import DashboardAssessments from "@/pages/dashboard-assessments";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  const [location] = useLocation();
  const isDashboardRoute = location.startsWith("/dashboard");
  
  // If we're on a dashboard route, don't show the normal layout
  if (isDashboardRoute) {
    return (
      <Switch>
        <Route path="/dashboard" component={DashboardHome} />
        <Route path="/dashboard/surveys/new" component={Dashboard} />
        <Route path="/dashboard/assessments" component={DashboardAssessments} />
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
          <Route path="/login" component={LoginPage} />
          <Route path="/survey" component={SurveyPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleOAuthProvider clientId="GOOGLE_CLIENT_ID_PLACEHOLDER">
          <Toaster />
          <Router />
        </GoogleOAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
