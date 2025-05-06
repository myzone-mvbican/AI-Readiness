import { Link } from "wouter";
import logoPath from "@/assets/logo-myzone-ai-black.svg";

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container flex items-center justify-between py-4">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img src={logoPath} alt="MyZone AI Logo" className="h-10 w-auto" />
          </div>
        </Link>
        <nav className="hidden md:flex space-x-8">
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
      </div>
    </header>
  );
}
