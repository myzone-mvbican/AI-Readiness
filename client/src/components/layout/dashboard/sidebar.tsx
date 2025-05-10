"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { NavMain } from "./nav-menu";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Home,
  ClipboardCheck,
  // BarChart3,
  PlusCircle,
  ScrollText,
  FileSpreadsheet,
  Users,
} from "lucide-react";

import profileImage from "@/assets/mvbican.jpg";

// This is sample data.
const defaultUser = {
  name: "mvbican",
  email: "bican.valeriu@myzone.ai",
  avatar: profileImage,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Get the currently selected team from localStorage
  const [selectedTeam, setSelectedTeam] = React.useState<{
    id: number;
    name: string;
    role: string;
  } | null>(null);

  // Load selected team from local storage on mount
  React.useEffect(() => {
    const savedTeam = localStorage.getItem("selectedTeam");
    if (savedTeam) {
      try {
        setSelectedTeam(JSON.parse(savedTeam));
      } catch (e) {
        console.error("Error parsing saved team:", e);
      }
    }
  }, []);

  // Check if current team is an admin team
  const isTeamAdmin = selectedTeam?.role === "admin";

  // Navigation items
  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Assessments",
      url: "/dashboard/assessments",
      icon: ClipboardCheck,
    },
    // {
    //   title: "Reports",
    //   url: "/dashboard/reports",
    //   icon: BarChart3,
    // },
  ];

  // Admin-only menu items that are only shown when the current team has admin role
  const adminNavItems = isTeamAdmin
    ? [
        {
          title: "Surveys",
          url: "/dashboard/surveys",
          icon: FileSpreadsheet,
        },
        {
          title: "Users",
          url: "/dashboard/users",
          icon: Users,
        },
      ]
    : [];

  // Monitor changes to selected team from localStorage
  React.useEffect(() => {
    // Listen for storage events to detect team changes in other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "selectedTeam") {
        try {
          const newTeam = event.newValue ? JSON.parse(event.newValue) : null;
          setSelectedTeam(newTeam);
        } catch (e) {
          console.error("Error parsing team from storage event:", e);
        }
      }
    };

    // Add storage event listener
    window.addEventListener("storage", handleStorageChange);

    // Check for team changes periodically (300ms interval)
    const checkTeamInterval = setInterval(() => {
      const savedTeam = localStorage.getItem("selectedTeam");
      if (savedTeam) {
        try {
          const parsedTeam = JSON.parse(savedTeam);
          // Only update if the team has actually changed
          if (JSON.stringify(parsedTeam) !== JSON.stringify(selectedTeam)) {
            setSelectedTeam(parsedTeam);
          }
        } catch (e) {
          console.error("Error checking team:", e);
        }
      } else if (selectedTeam !== null) {
        // Team data was removed
        setSelectedTeam(null);
      }
    }, 300);

    // Clean up
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkTeamInterval);
    };
  }, [selectedTeam]);

  // Check if a route is active
  const isRouteActive = (route: string) => {
    if (route === "/dashboard" && location === "/dashboard") {
      return true;
    }
    if (route !== "/dashboard" && location.startsWith(route)) {
      return true;
    }
    return false;
  };

  // User profile data - use authenticated user if available, otherwise default
  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: profileImage, // Using default profile image
      }
    : defaultUser;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-2">
        <TeamSwitcher className="w-full" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2 mt-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
              tooltip="Create New Assessment"
              asChild
            >
              <Link href="/dashboard/assessments/new">
                <PlusCircle />
                <span>Create New Assessment</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain
          items={navItems}
          adminItems={adminNavItems}
          isRouteActive={isRouteActive}
        />
        <SidebarMenu className="py-2 px-2 mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton
              className={cn(
                "bg-muted hover:bg-accent",
                isRouteActive("/dashboard/help") && "bg-accent",
              )}
              asChild
            >
              <Link href="/dashboard/help" aria-disabled="true">
                <ScrollText />
                <span>Help Center</span>
                <Badge variant="outline" className="ml-auto">
                  Soon
                </Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
