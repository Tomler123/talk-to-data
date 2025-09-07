import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth/': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/auth/, '/auth'),
      },
      '/voice/': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

