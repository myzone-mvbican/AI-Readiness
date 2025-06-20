import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./assets/scss/main.scss";

const rootElement = document.getElementById("root")!;

// Check if SEO data exists (indicates enhanced page)
const seoData = (window as any).__SEO_DATA__;

// Always use client-side rendering to avoid hydration mismatches
createRoot(rootElement).render(<App />);

// Clean up SEO data
if (seoData) {
  delete (window as any).__SEO_DATA__;
}
