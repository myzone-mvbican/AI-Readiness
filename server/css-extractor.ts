import fs from 'fs';
import path from 'path';

// Critical CSS for homepage SSR - extracted from compiled Tailwind
export function getCriticalCSS(): string {
  return `
    :root {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      --primary: 240 5.9% 10%;
      --primary-foreground: 0 0% 98%;
      --muted-foreground: 240 3.8% 46.1%;
      --border: 240 5.9% 90%;
      --ring: 240 10% 3.9%;
      --radius: 0.5rem;
    }

    .dark {
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      --primary: 0 0% 98%;
      --primary-foreground: 240 5.9% 10%;
    }

    * {
      border-color: hsl(var(--border));
    }

    *,
    ::before,
    ::after {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
      border-color: #e5e7eb;
    }

    html {
      line-height: 1.5;
      -webkit-text-size-adjust: 100%;
      -moz-tab-size: 4;
      tab-size: 4;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      font-feature-settings: normal;
      font-variation-settings: normal;
    }

    body {
      margin: 0;
      line-height: inherit;
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
    }

    h1, h2, p {
      margin: 0;
    }

    img, svg {
      display: block;
      vertical-align: middle;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    button {
      font-family: inherit;
      font-feature-settings: inherit;
      font-variation-settings: inherit;
      font-size: 100%;
      font-weight: inherit;
      line-height: inherit;
      color: inherit;
      margin: 0;
      padding: 0;
      background-color: transparent;
      background-image: none;
      border: 0;
      cursor: pointer;
    }

    a {
      color: inherit;
      text-decoration: inherit;
    }

    /* Utility Classes */
    .container {
      width: 100%;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1rem;
      padding-right: 1rem;
      max-width: 1200px;
    }

    .min-h-screen {
      min-height: 100vh;
    }

    .flex {
      display: flex;
    }

    .flex-col {
      flex-direction: column;
    }

    .flex-grow {
      flex-grow: 1;
    }

    .items-center {
      align-items: center;
    }

    .justify-center {
      justify-content: center;
    }

    .justify-between {
      justify-content: space-between;
    }

    .max-w-3xl {
      max-width: 48rem;
    }

    .mx-auto {
      margin-left: auto;
      margin-right: auto;
    }

    .w-full {
      width: 100%;
    }

    .h-10 {
      height: 2.5rem;
    }

    .h-4 {
      height: 1rem;
    }

    .h-5 {
      height: 1.25rem;
    }

    .w-auto {
      width: auto;
    }

    .w-4 {
      width: 1rem;
    }

    .w-5 {
      width: 1.25rem;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .text-center {
      text-align: center;
    }

    .text-4xl {
      font-size: 2.25rem;
      line-height: 2.5rem;
    }

    .text-5xl {
      font-size: 3rem;
      line-height: 1;
    }

    .text-3xl {
      font-size: 1.875rem;
      line-height: 2.25rem;
    }

    .text-2xl {
      font-size: 1.5rem;
      line-height: 2rem;
    }

    .text-lg {
      font-size: 1.125rem;
      line-height: 1.75rem;
    }

    .text-xl {
      font-size: 1.25rem;
      line-height: 1.75rem;
    }

    .text-sm {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .font-extrabold {
      font-weight: 800;
    }

    .font-semibold {
      font-weight: 600;
    }

    .font-medium {
      font-weight: 500;
    }

    .tracking-tight {
      letter-spacing: -0.025em;
    }

    .text-blue-700 {
      color: rgb(29 78 216);
    }

    .text-blue-800 {
      color: rgb(30 64 175);
    }

    .text-blue-600 {
      color: rgb(37 99 235);
    }

    .text-white {
      color: rgb(255 255 255);
    }

    .text-gray-600 {
      color: rgb(75 85 99);
    }

    .text-foreground {
      color: hsl(var(--foreground));
    }

    .text-muted-foreground {
      color: hsl(var(--muted-foreground));
    }

    .bg-white {
      background-color: rgb(255 255 255);
    }

    .bg-gray-100 {
      background-color: rgb(243 244 246);
    }

    .bg-gray-900 {
      background-color: rgb(17 24 39);
    }

    .bg-blue-50 {
      background-color: rgb(239 246 255);
    }

    .bg-gradient-to-br {
      background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
    }

    .from-blue-50 {
      --tw-gradient-from: rgb(239 246 255);
      --tw-gradient-to: rgb(239 246 255 / 0);
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
    }

    .via-white {
      --tw-gradient-to: rgb(255 255 255 / 0);
      --tw-gradient-stops: var(--tw-gradient-from), rgb(255 255 255), var(--tw-gradient-to);
    }

    .to-blue-50 {
      --tw-gradient-to: rgb(239 246 255);
    }

    .py-16 {
      padding-top: 4rem;
      padding-bottom: 4rem;
    }

    .py-6 {
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }

    .py-4 {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    .py-3 {
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
    }

    .px-6 {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    .p-6 {
      padding: 1.5rem;
    }

    .mb-6 {
      margin-bottom: 1.5rem;
    }

    .mb-8 {
      margin-bottom: 2rem;
    }

    .mb-3 {
      margin-bottom: 0.75rem;
    }

    .mt-4 {
      margin-top: 1rem;
    }

    .mt-12 {
      margin-top: 3rem;
    }

    .ml-2 {
      margin-left: 0.5rem;
    }

    .mx-6 {
      margin-left: 1.5rem;
      margin-right: 1.5rem;
    }

    .gap-4 {
      gap: 1rem;
    }

    .gap-8 {
      gap: 2rem;
    }

    .space-x-8 > :not([hidden]) ~ :not([hidden]) {
      margin-left: 2rem;
    }

    .grid {
      display: grid;
    }

    .grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .rounded-lg {
      border-radius: 0.5rem;
    }

    .rounded-md {
      border-radius: 0.375rem;
    }

    .border {
      border-width: 1px;
    }

    .border-b {
      border-bottom-width: 1px;
    }

    .border-t {
      border-top-width: 1px;
    }

    .border-gray-100 {
      border-color: rgb(243 244 246);
    }

    .border-gray-200 {
      border-color: rgb(229 231 235);
    }

    .border-gray-300 {
      border-color: rgb(209 213 219);
    }

    .border-gray-800 {
      border-color: rgb(31 41 55);
    }

    .shadow-sm {
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    .sticky {
      position: sticky;
    }

    .top-0 {
      top: 0px;
    }

    .z-50 {
      z-index: 50;
    }

    .inline-flex {
      display: inline-flex;
    }

    .hidden {
      display: none;
    }

    .transition-colors {
      transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }

    .transition-shadow {
      transition-property: box-shadow;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }

    .hover\\:bg-blue-700:hover {
      background-color: rgb(29 78 216);
    }

    .hover\\:bg-gray-50:hover {
      background-color: rgb(249 250 251);
    }

    .hover\\:text-blue-600:hover {
      color: rgb(37 99 235);
    }

    .hover\\:shadow-md:hover {
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    @media (min-width: 768px) {
      .md\\:py-24 {
        padding-top: 6rem;
        padding-bottom: 6rem;
      }

      .md\\:text-5xl {
        font-size: 3rem;
        line-height: 1;
      }

      .md\\:text-xl {
        font-size: 1.25rem;
        line-height: 1.75rem;
      }

      .md\\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .md\\:flex {
        display: flex;
      }
    }

    @media (min-width: 640px) {
      .sm\\:flex-row {
        flex-direction: row;
      }
    }

    .dark .dark\\:bg-gray-900 {
      background-color: rgb(17 24 39);
    }

    .dark .dark\\:text-white {
      color: rgb(255 255 255);
    }

    .dark .dark\\:border-gray-800 {
      border-color: rgb(31 41 55);
    }

    .dark .dark\\:from-gray-900 {
      --tw-gradient-from: rgb(17 24 39);
      --tw-gradient-to: rgb(17 24 39 / 0);
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
    }

    .dark .dark\\:invert {
      filter: invert(1);
    }
  `;
}

// Extract CSS from built assets in production
export async function getCompiledCSS(): Promise<string> {
  try {
    const distPath = path.resolve(process.cwd(), 'dist', 'public');
    const assetsPath = path.join(distPath, 'assets');
    
    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath);
      const cssFile = files.find(file => file.endsWith('.css'));
      
      if (cssFile) {
        const cssPath = path.join(assetsPath, cssFile);
        return fs.readFileSync(cssPath, 'utf-8');
      }
    }
  } catch (error) {
    console.error('Failed to load compiled CSS:', error);
  }
  
  // Fallback to critical CSS
  return getCriticalCSS();
}