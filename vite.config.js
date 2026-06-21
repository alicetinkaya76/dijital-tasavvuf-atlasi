import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages project sites the app is served from /<repo>/.
// Override at build time:  BASE_PATH=/my-repo/ npm run build
// Defaults to '/' so `npm run dev` and root deployments work unchanged.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          leaflet: ['leaflet'],
          d3: ['d3'],
          search: ['minisearch'],
        },
      },
    },
  },
});
