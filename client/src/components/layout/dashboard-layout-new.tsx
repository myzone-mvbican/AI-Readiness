import * as React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import logoPath from "@/assets/logo-myzone-ai-black.svg";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [location] = useLocation();
  
  // Check for mobile viewport
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Menu items for reuse
  const menuItems = (
    <nav className="grid gap-1 px-2">
      <Link 
        href="/dashboard" 
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isRouteActive("/dashboard") && !isRouteActive("/dashboard/") && "bg-muted font-semibold"
        )}
      >
        <Home className="h-4 w-4" />
        {!isCollapsed && <span>Dashboard</span>}
      </Link>
      <Link 
        href="/dashboard/assessments" 
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isRouteActive("/dashboard/assessments") && "bg-muted font-semibold"
        )}
      >
        <ClipboardCheck className="h-4 w-4" />
        {!isCollapsed && <span>Assessments</span>}
      </Link>
      <Link 
        href="/dashboard/reports" 
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isRouteActive("/dashboard/reports") && "bg-muted font-semibold"
        )}
      >
        <BarChart3 className="h-4 w-4" />
        {!isCollapsed && <span>Reports</span>}
      </Link>
    </nav>
  );

  // Bottom nav items for reuse
  const bottomNavItems = (
    <nav className="grid gap-1">
      <Link 
        href="/dashboard/settings" 
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isRouteActive("/dashboard/settings") && "bg-muted font-semibold"
        )}
      >
        <Settings className="h-4 w-4" />
        {!isCollapsed && <span>Settings</span>}
      </Link>
      <Link 
        href="/dashboard/help" 
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isRouteActive("/dashboard/help") && "bg-muted font-semibold"
        )}
      >
        <HelpCircle className="h-4 w-4" />
        {!isCollapsed && <span>Get Help</span>}
      </Link>
    </nav>
  );

  // Account dropdown for reuse
  const accountDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium">Account</span>
                  <span className="text-xs text-muted-foreground">
                    Manage your account
                  </span>
                </div>
                <ChevronDown className="ml-auto h-4 w-4" />
              </>
            )}
            {isCollapsed && (
              <Settings className="h-5 w-5" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-56">
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Render mobile layout
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col">
        {/* Mobile Header */}
        <header className="border-b h-14 flex items-center px-4 justify-between">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="flex justify-between items-center">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <img src={logoPath} alt="Logo" className="w-[100px] h-auto" />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col justify-between h-full py-4">
                  <div className="flex-1">
                    <div className="mb-4">
                      <Link href="/dashboard/surveys/new">
                        <Button variant="default" className="w-full">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <span>Start New Survey</span>
                        </Button>
                      </Link>
                    </div>
                    <ScrollArea className="flex-1 py-2">
                      {menuItems}
                    </ScrollArea>
                  </div>
                  <div>
                    <div className="py-2">
                      {bottomNavItems}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center px-2 py-2">
                      <ThemeToggle />
                      {accountDropdown}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="ml-2">
              <img src={logoPath} alt="Logo" className="w-[120px] h-auto" />
            </Link>
          </div>
          <ThemeToggle />
        </header>
        {/* Content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-muted/40 border-r h-full w-64 transition-all duration-300",
          isCollapsed && "w-16",
        )}
      >
        {/* Logo and Quick Create */}
        <div className="py-4 px-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                <img src={logoPath} alt="Logo" className="w-[150px] h-auto" />
              </Link>
            )}
            {isCollapsed && (
              <Link href="/dashboard" className="flex items-center justify-center">
                <img src={logoPath} alt="Logo" className="h-6 w-6" />
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
          {menuItems}
        </ScrollArea>

        {/* Bottom section */}
        <div className="mt-auto border-t">
          <div className="py-2 px-2">
            {bottomNavItems}
          </div>
          <Separator />
          <div className="flex items-center justify-between px-4 py-4">
            <ThemeToggle />
            {accountDropdown}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b h-14 flex items-center px-4 justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Link href="/dashboard/surveys/new">
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Assessment
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}