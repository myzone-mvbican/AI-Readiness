import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Production SSR functions - Complete page structure
function generateCompletePageSSR(user: any): string {
  return `
    <div class="min-h-screen flex flex-col">
      ${generateHeaderSSR()}
      <main class="bg-white dark:bg-gray-900 flex flex-col flex-grow w-full mx-auto">
        ${generateHomepageContentSSR(user)}
      </main>
      ${generateFooterSSR()}
    </div>
  `;
}

function generateHeaderSSR(): string {
  return `
    <header class="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
      <div class="container flex items-center justify-between py-4">
        <a href="/">
          <div class="flex items-center cursor-pointer">
            <img
              src="/src/assets/logo-myzone-ai-black.svg"
              alt="MyZone AI Logo"
              class="h-10 w-auto dark:invert"
            />
          </div>
        </a>
        <div class="flex items-center">
          <button class="theme-toggle" aria-label="Toggle theme">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          <nav class="hidden md:flex space-x-8 mx-6">
            <a href="/about" class="text-blue-800 hover:text-blue-600 dark:text-white font-medium cursor-pointer transition-colors">
              About
            </a>
            <a href="/dashboard" class="text-blue-800 hover:text-blue-600 dark:text-white font-medium cursor-pointer transition-colors">
              Dashboard
            </a>
          </nav>
        </div>
      </div>
    </header>
  `;
}

function generateHomepageContentSSR(user: any): string {
  return `
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 py-16 md:py-24">
      <div class="container">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-700 mb-6">
            MyZone AI Readiness Survey
          </h1>
          <p class="text-lg md:text-xl text-muted-foreground mb-8">
            Welcome! This AI Readiness Assessment should be completed
            quarterly as one of your foundational AI KPIs (Key Performance
            Indicators). It takes approximately 10 minutes to complete.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors">
              ${user ? 'Continue Assessment' : 'Start Assessment'}
              <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            ${!user ? `
            <a href="/auth" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white px-6 py-3 hover:bg-gray-50 transition-colors">
              Sign In
            </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Benefits Section -->
    <div class="py-16 bg-white dark:bg-gray-900">
      <div class="container">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold text-foreground">
            Benefits of the Assessment
          </h2>
          <p class="mt-4 text-lg text-muted-foreground">
            Understand your organization's AI readiness and get
            actionable insights
          </p>
        </div>
        <div class="mt-12 grid gap-8 md:grid-cols-3">
          <!-- Feature 1 -->
          <div class="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="text-foreground text-2xl font-semibold mb-3">
              Benchmark
            </div>
            <p class="text-muted-foreground">
              Compare your AI readiness with industry standards and
              competitors
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="text-foreground text-2xl font-semibold mb-3">
              Track Progress
            </div>
            <p class="text-muted-foreground">
              Monitor your improvement over time with quarterly
              assessments
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-blue-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="text-foreground text-2xl font-semibold mb-3">
              Get Insights
            </div>
            <p class="text-muted-foreground">
              Receive tailored recommendations to improve your AI
              capabilities
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateFooterSSR(): string {
  return `
    <footer class="bg-gray-100 dark:bg-gray-900 text-gray-600 py-6 border-t border-gray-200 dark:border-gray-800">
      <div class="container">
        <div class="text-center text-sm">
          <p>
            &copy; 2025 
            <a
              href="https://myzone.ai"
              class="text-primary-500 hover:text-primary-700 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              MyZone AI
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  `;
}

function generateMetaTags(user: any, url: string): string {
  const baseUrl = process.env.BASE_URL || process.env.REPLIT_DEV_DOMAIN || 'https://myzone-ai.replit.app';
  return `
    <meta name="description" content="MyZone AI Readiness Assessment - Evaluate your organization's AI readiness with our comprehensive quarterly assessment tool. Get personalized recommendations and benchmark insights." />
    <meta name="keywords" content="AI readiness, assessment, artificial intelligence, organizational AI, AI strategy, business intelligence" />
    <meta name="author" content="MyZone AI" />
    
    <!-- Enhanced Open Graph Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="MyZone AI" />
    <meta property="og:title" content="MyZone AI Readiness Assessment | Evaluate Your Organization's AI Readiness" />
    <meta property="og:description" content="Comprehensive AI readiness assessment tool. Complete quarterly evaluations, get personalized recommendations, and benchmark against industry standards." />
    <meta property="og:url" content="${baseUrl}${url}" />
    <meta property="og:image" content="${baseUrl}/favicon.svg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Enhanced Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="MyZone AI Readiness Assessment" />
    <meta name="twitter:description" content="Evaluate your organization's AI readiness in 10 minutes. Get personalized insights and recommendations." />
    <meta name="twitter:image" content="${baseUrl}/favicon.svg" />
  `;
}

function generateStructuredData(): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MyZone AI Readiness Assessment",
    "description": "Comprehensive AI readiness assessment tool for organizations",
    "url": process.env.BASE_URL || process.env.REPLIT_DEV_DOMAIN || "https://myzone-ai.replit.app",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "provider": {
      "@type": "Organization",
      "name": "MyZone AI"
    },
    "featureList": [
      "AI Readiness Assessment",
      "Benchmark Comparisons", 
      "Personalized Recommendations",
      "Progress Trading",
      "Team Management"
    ]
  };

  return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
}

export function serveStaticWithSSR(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets
  app.use("/", express.static(distPath));

  // SSR route for homepage
  app.get("/", async (req: Request, res: Response) => {
    try {
      console.log('Production SSR: Processing homepage request');
      
      const indexPath = path.resolve(distPath, "index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");
      
      const user = (req as any).user || null;
      
      // Generate complete page SSR content
      const ssrHtml = generateCompletePageSSR(user);
      const metaTags = generateMetaTags(user, req.originalUrl);
      const structuredData = generateStructuredData();
      
      // Replace placeholders with SSR content
      template = template.replace(
        '<!-- SSR_META_TAGS_PLACEHOLDER -->',
        metaTags
      );
      
      template = template.replace(
        '<!-- SSR_STRUCTURED_DATA_PLACEHOLDER -->',
        structuredData
      );
      
      template = template.replace(
        '<!-- SSR_HYDRATION_DATA_PLACEHOLDER -->',
        `<script>window.__SSR_DATA__ = ${JSON.stringify({ user, url: req.originalUrl })};</script>`
      );
      
      template = template.replace(
        '<div id="root"></div>',
        `<div id="root">${ssrHtml}</div>`
      );
      
      console.log('Production SSR: Successfully applied server-side rendering');
      
      res.setHeader('Content-Type', 'text/html');
      res.send(template);
    } catch (error) {
      console.error('Production SSR Error:', error);
      // Fall back to regular static file serving
      const indexPath = path.resolve(distPath, "index.html");
      res.sendFile(indexPath);
    }
  });

  // Fall through to index.html for all other routes (SPA behavior)
  app.use("*", (_req: Request, res: Response) => {
    const indexPath = path.resolve(distPath, "index.html");
    res.sendFile(indexPath);
  });
}