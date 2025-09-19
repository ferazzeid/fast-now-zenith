import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from "vite";
import { componentTagger } from "lovable-tagger";
import { swVersionPlugin } from "./scripts/sw-version-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    swVersionPlugin(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
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
}));
