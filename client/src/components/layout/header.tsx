import { Link } from "wouter";
import logoPath from "@/assets/logo.svg";

export default function Header() {
  return (
    <header className="bg-white py-4 px-4 sm:px-6 lg:px-8 shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img src={logoPath} alt="MyZone AI Logo" className="h-10 w-auto" />
          </div>
        </Link>
        <nav className="hidden md:flex space-x-8">
          <Link href="/">
            <span className="text-blue-800 hover:text-blue-600 font-medium cursor-pointer transition-colors">Home</span>
          </Link>
          <Link href="/survey">
            <span className="text-blue-800 hover:text-blue-600 font-medium cursor-pointer transition-colors">Survey</span>
          </Link>
          <Link href="/login">
            <span className="text-blue-800 hover:text-blue-600 font-medium cursor-pointer transition-colors">Login</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
