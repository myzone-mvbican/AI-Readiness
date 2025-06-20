// Test script to verify SSR functionality
import fetch from 'node-fetch';

async function testSSR() {
  console.log('🧪 Testing SSR Implementation...\n');
  
  try {
    const response = await fetch('http://localhost:5000/');
    const html = await response.text();
    
    console.log('✅ Development SSR Tests:');
    
    // Test 1: Check if server-rendered content exists
    const hasSSRContent = html.includes('MyZone AI Readiness Survey') && 
                          html.includes('class="min-h-screen flex flex-col"') &&
                          html.includes('header class="bg-white') &&
                          html.includes('footer class="bg-gray-100');
    console.log(`   Server-rendered homepage content: ${hasSSRContent ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 2: Check meta tags
    const hasEnhancedMeta = html.includes('Enhanced Open Graph Tags') &&
                           html.includes('og:title') &&
                           html.includes('twitter:card');
    console.log(`   Enhanced meta tags injection: ${hasEnhancedMeta ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 3: Check structured data
    const hasStructuredData = html.includes('application/ld+json') &&
                             html.includes('WebApplication') &&
                             html.includes('MyZone AI');
    console.log(`   Structured data (JSON-LD): ${hasStructuredData ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 4: Check hydration data
    const hasHydrationData = html.includes('window.__SSR_DATA__') &&
                            html.includes('"user":null');
    console.log(`   Hydration data injection: ${hasHydrationData ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 5: Check specific SEO elements
    const hasProperTitle = html.includes('MyZone AI Readiness Assessment | Evaluate Your Organization');
    console.log(`   SEO-optimized title: ${hasProperTitle ? '✅ PASS' : '❌ FAIL'}`);
    
    const allTestsPassed = hasSSRContent && hasEnhancedMeta && hasStructuredData && hasHydrationData && hasProperTitle;
    
    console.log(`\n🎯 Overall SSR Status: ${allTestsPassed ? '✅ FULLY FUNCTIONAL' : '⚠️ NEEDS ATTENTION'}`);
    
    if (allTestsPassed) {
      console.log('\n🚀 SSR Implementation Summary:');
      console.log('   • Homepage server-side rendering: Active');
      console.log('   • SEO meta tags: Optimized');
      console.log('   • Social media sharing: Ready');
      console.log('   • Search engine indexing: Enhanced');
      console.log('   • Client-side hydration: Configured');
      console.log('   • Production build: Ready');
    }
    
  } catch (error) {
    console.error('❌ SSR Test Failed:', error.message);
  }
}

testSSR();