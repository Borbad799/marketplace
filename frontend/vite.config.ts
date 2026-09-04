import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:4001',
      '/uploads': 'http://localhost:4001',
      '/socket.io': { target: 'http://localhost:4001', ws: true },
    },
  },
})
