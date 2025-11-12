import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to backend service (Docker compose service name 'app') during dev
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://host.docker.internal:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
