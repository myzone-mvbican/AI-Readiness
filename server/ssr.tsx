import { renderToString } from 'react-dom/server';
import React from 'react';

export interface SSRContext {
  url: string;
  user?: any;
  initialData?: Record<string, any>;
}

// Simple homepage component for SSR with inline styles
function SSRHomePage({ user }: { user?: any }) {
  const heroStyle: React.CSSProperties = {
    background: 'linear-gradient(to bottom right, #eff6ff, #ffffff, #eff6ff)',
    padding: '4rem 0',
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center'
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '48rem',
    margin: '0 auto',
    textAlign: 'center'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#1d4ed8',
    marginBottom: '1.5rem',
    lineHeight: '1.1'
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    color: '#6b7280',
    marginBottom: '2rem',
    lineHeight: '1.6'
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center'
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s'
  };

  return (
    <div style={heroStyle}>
      <div style={containerStyle}>
        <div style={contentStyle}>
          <h1 style={titleStyle}>
            MyZone AI Readiness Survey
          </h1>
          <p style={descriptionStyle}>
            Welcome! This AI Readiness Assessment should be completed
            quarterly as one of your foundational AI KPIs (Key Performance
            Indicators). It takes approximately 10 minutes to complete.
          </p>
          <div style={buttonContainerStyle}>
            <a href={user ? "/dashboard" : "#start-assessment"} style={primaryButtonStyle}>
              {user ? 'Continue Assessment' : 'Start Assessment'}
              <svg style={{marginLeft: '0.5rem', width: '1rem', height: '1rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            {!user && (
              <a href="/auth" style={secondaryButtonStyle}>
                Sign In
              </a>
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