import { Link } from "wouter";
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
          <nav className="hidden md:flex space-x-8 mr-6">
            <Link href="/about">
              <span className="text-blue-800 hover:text-blue-600 dark:text-white font-medium cursor-pointer transition-colors">
                About
              </span>
            </Link>
            <Link href="/dashboard">
              <span className="text-blue-800 hover:text-blue-600 dark:text-white font-medium cursor-pointer transition-colors">
                Dashboard
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
