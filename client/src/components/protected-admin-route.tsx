import { Redirect, Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth"; 
import { useEffect } from "react";

type AdminProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>;
};

export function AdminProtectedRoute({
  path,
  component: Component,
}: AdminProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  // If not authenticated, redirect to the auth page
  if (!user) {
    return null; // Will redirect in useEffect
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
