import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

function updateServiceWorker(version: string) {
  try {
    const swPath = resolve(process.cwd(), 'public/sw.js');
    let swContent = readFileSync(swPath, 'utf-8');
    
    // Replace the VERSION constant with the current version
    swContent = swContent.replace(
      /const VERSION = ['"][^'"]*['"];/,
      `const VERSION = 'v${version}';`
    );
    
    writeFileSync(swPath, swContent);
  } catch (error) {
    console.error('Failed to write service worker:', error);
  }
}

export function swVersionPlugin(): Plugin {
  return {
    name: 'sw-version-plugin',
    buildStart() {
      try {
        // Read the current version from env.ts
        const envPath = resolve(process.cwd(), 'src/env.ts');
        const envContent = readFileSync(envPath, 'utf-8');
        const versionMatch = envContent.match(/version:\s*["']([^"']+)["']/);
        
        if (!versionMatch) {
          console.warn('Could not extract version from env.ts, using timestamp');
          const version = Date.now().toString();
          updateServiceWorker(version);
          return;
        }

        const version = versionMatch[1];
        updateServiceWorker(version);
        console.log(`Updated service worker to version: ${version}`);
      } catch (error) {
        console.error('Failed to update service worker version:', error);
        // Fallback to timestamp
        const version = Date.now().toString();
        updateServiceWorker(version);
      }
    }
  };
}