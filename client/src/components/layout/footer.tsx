import { Link } from "wouter";
import logoPath from "@/assets/logo-keeran.svg";

export default function Footer() {
  return (
    <footer className="bg-[#082B3D] py-6">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <img
              src={logoPath}
              alt="MyZone AI Logo"
              className="h-8 w-auto"
            />
          </Link>
          <div className="text-center text-sm">
            <p className="text-white">
              &copy; 2025{" "}
              <a
                href="https://www.keeran.ca/"
                className="text-inherit transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Keeran Networks
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
