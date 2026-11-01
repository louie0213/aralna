import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy keeps the browser on one origin in development, so the httpOnly cookie just works.
// allowedHosts lets tunnel URLs reach the dev server; remove entries you don't use.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      '.devtunnels.ms',      // VS Code port forwarding
      '.trycloudflare.com',  // Cloudflare quick tunnel
      '.loca.lt',            // localtunnel
    ],
    proxy: { '/api': 'http://localhost:5000' },
  },
});