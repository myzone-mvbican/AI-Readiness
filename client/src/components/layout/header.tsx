import { Link } from "wouter"; 
import { Button } from "@/components/ui/button";
import logoPath from "@/assets/logo-myzone-ai-black.svg";

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
      <div className="container flex items-center justify-between py-4">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img
              src={logoPath}
              alt="MyZone AI Logo"
              className="h-10 w-auto dark:invert"
            />
          </div>
        </Link>
        <div className="flex items-center"> 
          <nav className="flex items-center space-x-8">
            <Link href="/#start" asChild>
              <Button className="hidden md:block">
                Start Assessment
              </Button>
            </Link>
            <Link href="/dashboard" asChild>
              <Button variant="link" className="text-dark hover:text-blue-600 dark:text-white font-bold">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
