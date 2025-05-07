"use client";

import * as React from "react";
import {
  Home,
  Settings2,
  ClipboardCheck,
  BarChart3,
  PlusCircle,
  ScrollText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NavMain } from "./nav-menu";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  // useSidebar,
} from "@/components/ui/sidebar";

import profileImage from "@/assets/mvbican.jpg";

// This is sample data.
const defaultUser = {
  name: "mvbican",
  email: "bican.valeriu@myzone.ai",
  avatar: profileImage,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [location] = useLocation();

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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="bock m-2">
          <img src={logoPath} alt="Logo" className="w-[100px] h-auto" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2 mt-0]">
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
        <NavMain items={data.navMain} isRouteActive={isRouteActive} />
        <SidebarMenu className="py-2 px-2 mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton
              className={cn(
                "bg-muted hover:bg-accent",
                isRouteActive("/dashboard/help") && "bg-accent",
              )}
              asChild
            >
              <Link href="/dashboard/help">
                <Settings2 />
                <span>Get Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
