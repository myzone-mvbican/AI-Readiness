import { renderToString } from 'react-dom/server';
import React from 'react';

export interface SSRContext {
  url: string;
  user?: any;
  initialData?: Record<string, any>;
}

// Simple homepage component for SSR
function SSRHomePage({ user }: { user?: any }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 py-16 md:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-700 mb-6">
            MyZone AI Readiness Survey
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Welcome! This AI Readiness Assessment should be completed
            quarterly as one of your foundational AI KPIs (Key Performance
            Indicators). It takes approximately 10 minutes to complete.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white px-6 py-3 hover:bg-blue-700">
              {user ? 'Continue Assessment' : 'Start Assessment'}
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {!user && (
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white px-6 py-3 hover:bg-gray-50">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderPage(context: SSRContext): string {
  const { url, user } = context;

  // Only render homepage with SSR for now
  if (url === '/' || url === '') {
    const html = renderToString(<SSRHomePage user={user} />);
    return html;
  }

  // For other routes, return empty string to use client-side rendering
  return '';
}

export function generateMetaTags(context: SSRContext): string {
  const { url, user } = context;
  
  // Base meta tags
  let metaTags = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="MyZone AI Readiness Assessment - Evaluate your organization's AI readiness with our comprehensive quarterly assessment tool. Get personalized recommendations and benchmark insights." />
    <meta name="keywords" content="AI readiness, assessment, artificial intelligence, organizational AI, AI strategy, business intelligence" />
    <meta name="author" content="MyZone AI" />
    
    <!-- Open Graph Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="MyZone AI" />
    <meta property="og:image" content="/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="/og-image.png" />
  `;

  // Page-specific meta tags
  if (url === '/' || url === '') {
    metaTags += `
      <title>MyZone AI Readiness Assessment | Evaluate Your Organization's AI Readiness</title>
      <meta property="og:title" content="MyZone AI Readiness Assessment" />
      <meta property="og:description" content="Evaluate your organization's AI readiness with our comprehensive quarterly assessment tool. Get personalized recommendations and benchmark insights." />
      <meta property="og:url" content="${process.env.BASE_URL || 'https://myzone-ai.replit.app'}" />
      <meta name="twitter:title" content="MyZone AI Readiness Assessment" />
      <meta name="twitter:description" content="Evaluate your organization's AI readiness with our comprehensive quarterly assessment tool." />
    `;
    
    if (user) {
      metaTags += `
        <meta name="description" content="Welcome back to MyZone AI Readiness Assessment. Continue your AI journey with personalized insights and recommendations." />
      `;
    }
  }

  return metaTags;
}

export function generateStructuredData(context: SSRContext): string {
  const { url } = context;
  
  if (url === '/' || url === '') {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "MyZone AI Readiness Assessment",
      "description": "Comprehensive AI readiness assessment tool for organizations",
      "url": process.env.BASE_URL || "https://myzone-ai.replit.app",
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
      }
    };

    return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
  }

  return '';
}