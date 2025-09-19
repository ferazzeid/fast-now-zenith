import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from "vite";
import { swVersionPlugin } from "./scripts/sw-version-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react(), swVersionPlugin()];

  // Note: lovable-tagger is skipped due to ESM compatibility issues in this build setup
  // The component tagging functionality is not essential for core app functionality
  // Once the build system is updated to handle ESM-only packages, this can be enabled:
  // if (mode === 'development') {
  //   try {
  //     const { componentTagger } = await import('lovable-tagger');
  //     plugins.push(componentTagger());
  //   } catch (e) {
  //     console.warn('lovable-tagger not available:', e?.message);
  //   }
  // }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: './', // Use relative paths for Capacitor WebView compatibility
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast']
          },
        },
      },
      sourcemap: false, // Explicitly disable sourcemaps for smaller build size
      minify: 'esbuild', // Use esbuild for fast minification
    },
    define: {
      // Ensure environment detection works
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode),
    },
  };
});
