import { AppSidebar } from "./dashboard/sidebar";
import { ThemeToggle } from "@/components/theme/toggle";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [location] = useLocation();

  // Generate page title based on the current route
  const pageName = useMemo(() => {
    // If a title is explicitly provided, use it
    if (title) return title;

    // Otherwise generate from the current route
    const path = location.split("/").filter(Boolean);
    const currentRoute = path[path.length - 1] || "dashboard";

    // Format the route name (convert kebab-case to Title Case)
    return currentRoute
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [location, title]);

  const cookies = document.cookie
    .split("; ")
    .find((row) => row.startsWith("sidebar_state="));
  const storedState = cookies ? cookies.split("=")[1] : "true";

  return (
    <SidebarProvider defaultOpen={storedState === "true"}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 bg-white dark:bg-gray-900 border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 z-10">
          <div className="flex items-center w-full gap-2 px-5">
            <SidebarTrigger className="-ml-1 dark:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList className="overflow-elipsis text-nowrap">
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard" asChild>
                    <Link href="/dashboard">AI Readiness Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs lg:text-base">
                    {pageName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="bg-white dark:bg-gray-900 flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
