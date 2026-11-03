/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiTarget = process.env.API_UPSTREAM || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // inline (empty) PostCSS config stops Vite searching parent folders for one
  css: { postcss: {} },
  server: {
    // mirror the nginx routing so `npm run dev` behaves like the container
    // changeOrigin lets API_UPSTREAM point at a remote HTTPS API (host-routed ingress)
    proxy: {
      '/api/health': { target: apiTarget, changeOrigin: true, rewrite: () => '/health' },
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    pool: 'threads',
    setupFiles: ['./src/test/setup.ts'],
  },
})
