import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 py-6 mt-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm">
          <p>
            &copy; 2025 <a href="https://myzone.ai" className="text-primary-500 hover:text-primary-700 transition-colors" target="_blank" rel="noopener noreferrer">MyZone AI</a>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
