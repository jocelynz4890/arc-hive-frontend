import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      external: []
    }
  },
  // Dev server + proxy configuration to avoid CORS during local development.
  // For any request to /api/*, Vite will forward the request to the backend at localhost:8000
  // This keeps the browser origin the same and bypasses CORS restrictions in dev.
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})