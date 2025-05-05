import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Configuration() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
      duration: 2000,
    });
  };

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Add your custom colors here
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}`;

  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Add any global SCSS options here if needed
        additionalData: \`@import "./src/assets/scss/_variables.scss";\`
      }
    }
  },
  resolve: {
    alias: {
      // Add path aliases for easier imports
      '@': '/src',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@schemas': '/src/schemas',
    }
  }
})`;

  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your global styles here */`;

  const scssVariables = `// Colors
$primary-color: #3b82f6;
$secondary-color: #10b981;
$accent-color: #8b5cf6;
$error-color: #ef4444;
$success-color: #10b981;

// Typography
$font-family-base: 'Inter', sans-serif;
$font-size-base: 1rem;
$line-height-base: 1.5;

// Spacing
$spacing-unit: 0.25rem;
$spacing-sm: $spacing-unit * 2;  // 0.5rem
$spacing-md: $spacing-unit * 4;  // 1rem
$spacing-lg: $spacing-unit * 6;  // 1.5rem
$spacing-xl: $spacing-unit * 10; // 2.5rem

// Breakpoints (matching Tailwind defaults)
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;

// Z-index
$z-index-dropdown: 1000;
$z-index-modal: 2000;
$z-index-toast: 3000;`;

  const mainScss = `@import 'variables';

// Custom button styles that extend Tailwind
.btn-custom {
  @apply py-2 px-4 rounded transition-colors duration-200;
  
  &.btn-primary {
    @apply bg-primary-500 text-white hover:bg-primary-600;
  }
  
  &.btn-secondary {
    @apply bg-secondary-color text-white hover:opacity-90;
  }
  
  &.btn-outline {
    @apply border border-primary-500 text-primary-500 hover:bg-primary-50;
  }
}

// Custom form styles
.form-group {
  @apply mb-4;
  
  label {
    @apply block text-gray-700 text-sm font-medium mb-1;
  }
  
  .form-control {
    @apply w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50;
    
    &.is-invalid {
      @apply border-error-color focus:border-error-color focus:ring-error-color;
    }
  }
  
  .error-message {
    @apply mt-1 text-sm text-error-color;
  }
}

// Animation utilities
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-5">Configuration Files</h2>
      
      <div className="space-y-8">
        {/* Tailwind Config */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <span className="mr-2">tailwind.config.js</span>
            <span className="text-xs py-1 px-2 bg-blue-100 text-blue-800 rounded-full">Required</span>
          </h3>
          <p className="mb-3 text-gray-600">Configure Tailwind CSS to look for classes in your files:</p>
          <div className="relative">
            <div className="bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
              <pre>{tailwindConfig}</pre>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard(tailwindConfig)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PostCSS Config */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <span className="mr-2">postcss.config.js</span>
            <span className="text-xs py-1 px-2 bg-blue-100 text-blue-800 rounded-full">Required</span>
          </h3>
          <p className="mb-3 text-gray-600">Configure PostCSS to process Tailwind directives:</p>
          <div className="relative">
            <div className="bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
              <pre>{postcssConfig}</pre>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard(postcssConfig)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Vite Config */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <span className="mr-2">vite.config.js</span>
            <span className="text-xs py-1 px-2 bg-blue-100 text-blue-800 rounded-full">Required</span>
          </h3>
          <p className="mb-3 text-gray-600">Configure Vite with additional options:</p>
          <div className="relative">
            <div className="bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
              <pre>{viteConfig}</pre>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard(viteConfig)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* index.css */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <span className="mr-2">src/index.css</span>
            <span className="text-xs py-1 px-2 bg-blue-100 text-blue-800 rounded-full">Required</span>
          </h3>
          <p className="mb-3 text-gray-600">Add Tailwind directives to your CSS file:</p>
          <div className="relative">
            <div className="bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
              <pre>{indexCss}</pre>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard(indexCss)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* SCSS Variables */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <span className="mr-2">src/assets/scss/_variables.scss</span>
            <span className="text-xs py-1 px-2 bg-gray-200 text-gray-700 rounded-full">Optional</span>
          </h3>
          <p className="mb-3 text-gray-600">Define SCSS variables for use alongside Tailwind:</p>
          <div className="relative">
            <div className="bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
              <pre>{scssVariables}</pre>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard(scssVariables)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main SCSS */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <span className="mr-2">src/assets/scss/main.scss</span>
            <span className="text-xs py-1 px-2 bg-gray-200 text-gray-700 rounded-full">Optional</span>
          </h3>
          <p className="mb-3 text-gray-600">Main SCSS file to import your variables and define custom styles:</p>
          <div className="relative">
            <div className="bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
              <pre>{mainScss}</pre>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard(mainScss)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
