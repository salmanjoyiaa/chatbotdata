// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev proxy to your current n8n URL (ngrok or localhost)
      '/api': {
        target: 'http://localhost:5678', // <-- put YOUR current ngrok URL
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, ''), // /api/webhook/... -> /webhook/...
      },
    },
  },
  preview: { port: 4173 },
})
