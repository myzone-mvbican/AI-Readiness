// Build script to ensure SSR files are properly compiled for production
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

async function buildSSR() {
  console.log('Building SSR modules for production...');
  
  try {
    // Build SSR modules
    await build({
      entryPoints: [
        'server/ssr-production.ts',
        'server/middleware/ssr.ts'
      ],
      outdir: 'dist',
      platform: 'node',
      format: 'esm',
      packages: 'external',
      bundle: false,
      target: 'node18'
    });
    
    console.log('SSR build completed successfully');
  } catch (error) {
    console.error('SSR build failed:', error);
    process.exit(1);
  }
}

buildSSR();