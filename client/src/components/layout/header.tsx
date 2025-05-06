import { Link } from "wouter";
import logoPath from "@/assets/logo.svg";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-primary-500 to-blue-600 py-4 px-4 sm:px-6 lg:px-8 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img src={logoPath} alt="MyZone AI Logo" className="h-10 w-auto" />
          </div>
        </Link>
        <nav className="hidden md:flex space-x-8">
          <Link href="/">
            <span className="text-white hover:text-blue-100 font-medium cursor-pointer">Home</span>
          </Link>
          <Link href="/survey">
            <span className="text-white hover:text-blue-100 font-medium cursor-pointer">Survey</span>
          </Link>
          <Link href="/login">
            <span className="text-white hover:text-blue-100 font-medium cursor-pointer">Login</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
