import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoPath from "@/assets/logo-myzone-ai-black.svg";

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
      <div className="container py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center">
          <Link href="/">
            <img
              src={logoPath}
              alt="MyZone AI Logo"
              className="h-10 w-auto dark:invert"
            />
          </Link>
          <div className="hidden md:block text-center">
            <p className="text-xs lg:text-base">
              Try It Free — <strong>Limited Time Beta Access!</strong>
            </p>
          </div>
          <nav className="flex items-center justify-end space-x-8">
            <Link href="/#start" asChild>
              <Button className="hidden sm:block">Start Assessment</Button>
            </Link>
            <Link href="/dashboard" asChild>
              <Button
                variant="link"
                className="text-dark hover:text-blue-600 dark:text-white font-bold"
              >
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
