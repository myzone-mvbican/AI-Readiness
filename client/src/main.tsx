import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./assets/scss/main.scss";

const rootElement = document.getElementById("root")!;

// Check if SSR data exists (indicates server-rendered content)
const ssrData = (window as any).__SSR_DATA__;

if (ssrData && rootElement.hasChildNodes()) {
  // Hydrate server-rendered content
  hydrateRoot(rootElement, <App />);
} else {
  // Normal client-side rendering
  createRoot(rootElement).render(<App />);
}

// Clean up SSR data
if (ssrData) {
  delete (window as any).__SSR_DATA__;
}
