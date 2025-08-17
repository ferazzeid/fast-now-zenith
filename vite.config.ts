import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from "vite";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const isProduction = mode === 'production' || process.env.NODE_ENV === 'production';
  
  const plugins: PluginOption[] = [react()];
  
  if (mode === 'development') {
    try {
      const { componentTagger } = await import('lovable-tagger');
      plugins.push(componentTagger());
    } catch (e: any) {
      console.warn('lovable-tagger not available:', e?.message || 'Unknown error');
    }
  }
  
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
      sourcemap: !isProduction, // Only generate sourcemaps in development
    },
    define: {
      // Ensure environment detection works
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode),
    },
  };
});
