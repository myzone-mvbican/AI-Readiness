import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-primary to-accent py-6 px-4 sm:px-6 lg:px-8 shadow-md">
      <div className="max-w-7xl mx-auto">
        <Link href="/">
          <a className="block">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">React Project Setup Guide</h1>
            <p className="mt-2 text-blue-100">Create a modern React app with Vite, Tailwind CSS, SCSS, React Hook Form, and Zod</p>
          </a>
        </Link>
      </div>
    </header>
  );
}
