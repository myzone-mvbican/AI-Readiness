import * as React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  Home,
  Menu,
  PlusCircle,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-muted/40 border-r h-full w-64 transition-all duration-300",
          isCollapsed && "w-16"
        )}
      >
        {/* Logo and Quick Create */}
        <div className="py-4 px-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <Link href="/dashboard">
                <a className="flex items-center gap-2 font-semibold text-lg">
                  <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
                  <span>MyZone AI</span>
                </a>
              </Link>
            )}
            {isCollapsed && (
              <Link href="/dashboard">
                <a className="flex items-center justify-center">
                  <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
                </a>
              </Link>
            )}
          </div>
          <div className="mt-4">
            <Link href="/dashboard/surveys/new">
              <Button
                variant="default"
                size={isCollapsed ? "icon" : "default"}
                className={cn("w-full", isCollapsed && "w-auto")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {!isCollapsed && <span>Start New Survey</span>}
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="grid gap-1 px-2">
            <Link href="/dashboard">
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                <Home className="h-4 w-4" />
                {!isCollapsed && <span>Dashboard</span>}
              </a>
            </Link>
            <Link href="/dashboard/assessments">
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                <ClipboardCheck className="h-4 w-4" />
                {!isCollapsed && <span>Assessments</span>}
              </a>
            </Link>
            <Link href="/dashboard/reports">
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                <BarChart3 className="h-4 w-4" />
                {!isCollapsed && <span>Reports</span>}
              </a>
            </Link>
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="mt-auto border-t">
          <div className="py-2 px-2">
            <nav className="grid gap-1">
              <Link href="/dashboard/settings">
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  <Settings className="h-4 w-4" />
                  {!isCollapsed && <span>Settings</span>}
                </a>
              </Link>
              <Link href="/dashboard/help">
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  <HelpCircle className="h-4 w-4" />
                  {!isCollapsed && <span>Get Help</span>}
                </a>
              </Link>
            </nav>
          </div>
          <Separator />
          <div className="py-4 px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">User Name</span>
                          <span className="text-xs text-muted-foreground">user@example.com</span>
                        </div>
                        <div className="ml-auto">
                          <User className="h-4 w-4" />
                        </div>
                      </>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem>
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b h-14 flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}