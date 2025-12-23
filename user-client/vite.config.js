import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['js-big-decimal'], // Optional: sometimes needed
    include: ['face-api.js']
  },
  build: {
    commonjsOptions: {
      include: [/face-api.js/, /node_modules/]
    }
  }
})
