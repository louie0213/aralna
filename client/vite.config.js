import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy keeps the browser on one origin in development, so the httpOnly cookie just works.
// allowedHosts covers ngrok's demo-sharing addresses; remove it if you don't need ngrok.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.io', '.ngrok.dev'],
    proxy: { '/api': 'http://localhost:5000' },
  },
});
