import { Link } from "wouter";
import logoPath from "@/assets/logo-myzone-ai-black.svg";

export default function Footer() {
  return (
    <footer className="bg-white py-6 border-t border-t-accent">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <img
              src={logoPath}
              alt="MyZone AI Logo"
              className="h-8 w-auto dark:invert"
            />
          </Link>
          <div className="text-center text-sm">
            <p>
              &copy; 2025{" "}
              <a
                href="https://myzone.ai"
                className="text-primary-500 hover:text-primary-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                MyZone AI
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
