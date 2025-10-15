import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { simpleLandingPlugin } from './vite-landing-simple.js';

export default defineConfig({
  plugins: [react(), simpleLandingPlugin()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  base: '/app/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['..', './public-landing']
    },
    middlewareMode: false
  }
});