import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Inline SSR functions for immediate availability
function generateHomepageSSR(user: any): string {
  const heroStyle = `
    background: linear-gradient(to bottom right, #eff6ff, #ffffff, #eff6ff);
    padding: 4rem 0;
    min-height: 80vh;
    display: flex;
    align-items: center;
  `;

  return `
    <div style="${heroStyle}">
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
        <div style="max-width: 48rem; margin: 0 auto; text-align: center;">
          <h1 style="font-size: 3rem; font-weight: 800; color: #1d4ed8; margin-bottom: 1.5rem; line-height: 1.1;">
            MyZone AI Readiness Survey
          </h1>
          <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">
            Welcome! This AI Readiness Assessment should be completed quarterly as one of your foundational AI KPIs (Key Performance Indicators). It takes approximately 10 minutes to complete.
          </p>
          <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
            <a href="${user ? '/dashboard' : '#start-assessment'}" 
               style="display: inline-flex; align-items: center; justify-content: center; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; background-color: #2563eb; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border: none;">
              ${user ? 'Continue Assessment' : 'Start Assessment'}
              <svg style="margin-left: 0.5rem; width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            ${!user ? `<a href="/auth" style="display: inline-flex; align-items: center; justify-content: center; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background-color: white; color: #374151; padding: 0.75rem 1.5rem; text-decoration: none;">Sign In</a>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateMetaTags(user: any, url: string): string {
  const baseUrl = process.env.BASE_URL || 'https://myzone-ai.replit.app';
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
    },
    "featureList": [
      "AI Readiness Assessment",
      "Benchmark Comparisons", 
      "Personalized Recommendations",
      "Progress Tracking",
      "Team Management"
    ]
  };

  return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
}

export async function handleSSRHomepage(req: Request, res: Response): Promise<void> {
  try {
    console.log('SSR Handler: Processing homepage request');
    
    // Read the base HTML template
    const templatePath = path.resolve(process.cwd(), "client", "index.html");
    let template = await fs.promises.readFile(templatePath, "utf-8");
    
    const user = (req as any).user || null;
    
    // Generate SSR content
    const ssrHtml = generateHomepageSSR(user);
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
    
    console.log('SSR Handler: Successfully applied server-side rendering');
    
    res.setHeader('Content-Type', 'text/html');
    res.send(template);
  } catch (error) {
    console.error('SSR Handler Error:', error);
    res.status(500).send('Internal Server Error');
  }
}