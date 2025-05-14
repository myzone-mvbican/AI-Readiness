import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
// Provides
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAuthProvider } from "@/components/google-auth-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { AssessmentCreateModalProvider } from "@/components/assessment/assessment-create-modal-provider";
// Protected routes
import { ProtectedRoute } from "@/components/protected-route";
import { AdminProtectedRoute } from "@/components/protected-admin-route";
// Layout components
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
// Normal pages
import NotFound from "@/pages/page-404";
import PageHome from "@/pages/page-home";
import PageAuth from "@/pages/page-auth";
import PageAbout from "@/pages/page-about";
// Dashboard pages
import DashboardHome from "@/pages/dashboard-home";
import AssessmentsPage from "@/pages/dashboard-assessments";
import AssessmentDetailPage from "@/pages/dashboard-assessments/[id]";
// Admin pages
import AdminSurveysPage from "@/pages/dashboard-surveys";
import AdminUsersPage from "@/pages/dashboard-users";
// Account settings page
import AccountSettingsPage from "./pages/account-settings";

function Router() {
  const [location] = useLocation();
  const isDashboardRoute = location.startsWith("/dashboard");

  // If we're on a dashboard route, don't show the normal layout
  if (isDashboardRoute) {
    return (
      <Switch>
        <ProtectedRoute path="/dashboard" component={DashboardHome} />
        <ProtectedRoute
          path="/dashboard/assessments/:id"
          component={AssessmentDetailPage}
        />
        <ProtectedRoute
          path="/dashboard/assessments"
          component={AssessmentsPage}
        />
        <ProtectedRoute
          path="/dashboard/account/settings"
          component={AccountSettingsPage}
        />
        <AdminProtectedRoute
          path="/dashboard/admin/surveys"
          component={AdminSurveysPage}
        />
        <AdminProtectedRoute
          path="/dashboard/admin/users"
          component={AdminUsersPage}
        />
        <ProtectedRoute path="/dashboard/:rest*" component={DashboardHome} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For all other routes, use the normal layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="bg-white dark:bg-gray-900 flex flex-col flex-grow w-full mx-auto">
        <Switch>
          <Route path="/" component={PageHome} />
          <Route path="/auth" component={PageAuth} />
          <Route path="/about" component={PageAbout} />
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
              <AssessmentCreateModalProvider>
                <Router />
              </AssessmentCreateModalProvider>
            </AuthProvider>
          </GoogleAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
