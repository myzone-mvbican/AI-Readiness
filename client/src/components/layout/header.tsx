import { Link } from "wouter";
import logoPath from "@/assets/logo-myzone-ai-black.svg";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container flex items-center justify-between py-4">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img src={logoPath} alt="MyZone AI Logo" className="h-10 w-auto" />
          </div>
        </Link>
        <div className="flex items-center">
          <nav className="hidden md:flex space-x-8 mr-6">
            <Link href="/about">
              <span className="text-blue-800 hover:text-blue-600 font-medium cursor-pointer transition-colors">
                About
              </span>
            </Link>
            <Link href="/dashboard">
              <span className="text-blue-800 hover:text-blue-600 font-medium cursor-pointer transition-colors">
                Dashboard
              </span>
            </Link>
          </nav>
          <Link href="/auth">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
