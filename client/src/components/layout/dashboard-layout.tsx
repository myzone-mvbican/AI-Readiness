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
  X,
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
  SheetClose,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = React.useState(false);
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

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <img src={logoPath} alt="Logo" className="w-[120px] h-auto" />
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium">
              <Link 
                href="/dashboard/surveys/new"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <PlusCircle className="h-4 w-4" />
                Start New Survey
              </Link>
              <Separator className="my-2" />
              <Link 
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isRouteActive("/dashboard") && !isRouteActive("/dashboard/") 
                    ? "bg-muted font-semibold text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link 
                href="/dashboard/assessments"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isRouteActive("/dashboard/assessments")
                    ? "bg-muted font-semibold text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <ClipboardCheck className="h-4 w-4" />
                Assessments
              </Link>
              <Link 
                href="/dashboard/reports"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isRouteActive("/dashboard/reports")
                    ? "bg-muted font-semibold text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Reports
              </Link>
            </nav>
          </div>
          <div className="mt-auto">
            <nav className="grid items-start px-2 text-sm font-medium">
              <Link 
                href="/dashboard/settings"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isRouteActive("/dashboard/settings")
                    ? "bg-muted font-semibold text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link 
                href="/dashboard/help"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isRouteActive("/dashboard/help")
                    ? "bg-muted font-semibold text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Link>
            </nav>
            <Separator className="my-2" />
            <div className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">Account</span>
                      <span className="text-xs text-muted-foreground">
                        Manage your account
                      </span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[280px] pr-0">
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="flex items-center justify-between">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <img src={logoPath} alt="Logo" className="w-[100px] h-auto" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </SheetClose>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full py-4 overflow-auto">
                <div className="px-2 mb-4">
                  <Link href="/dashboard/surveys/new" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      <span>Start New Survey</span>
                    </Button>
                  </Link>
                </div>
                <Separator className="mb-4" />
                <nav className="grid gap-1 px-2 group text-sm">
                  <Link 
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      isRouteActive("/dashboard") && !isRouteActive("/dashboard/") 
                        ? "bg-muted font-semibold text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link 
                    href="/dashboard/assessments"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      isRouteActive("/dashboard/assessments")
                        ? "bg-muted font-semibold text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Assessments
                  </Link>
                  <Link 
                    href="/dashboard/reports"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      isRouteActive("/dashboard/reports")
                        ? "bg-muted font-semibold text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Reports
                  </Link>
                </nav>
                <div className="mt-auto">
                  <nav className="grid gap-1 px-2 text-sm">
                    <Link 
                      href="/dashboard/settings"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                        isRouteActive("/dashboard/settings")
                          ? "bg-muted font-semibold text-primary" 
                          : "text-muted-foreground"
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link 
                      href="/dashboard/help"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                        isRouteActive("/dashboard/help")
                          ? "bg-muted font-semibold text-primary" 
                          : "text-muted-foreground"
                      )}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help
                    </Link>
                  </nav>
                  <Separator className="my-2" />
                  <div className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start">
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-medium">Account</span>
                            <span className="text-xs text-muted-foreground">
                              Manage your account
                            </span>
                          </div>
                          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
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
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <div className="font-semibold text-lg h-9 md:hidden">
              <img src={logoPath} alt="Logo" className="w-[120px] h-auto" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}