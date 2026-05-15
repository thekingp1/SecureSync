import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/files": { target: "https://localhost:4000", secure: false, changeOrigin: true },
      "/users": { target: "https://localhost:4000", secure: false, changeOrigin: true },
      "/admin": { target: "https://localhost:4000", secure: false, changeOrigin: true },
      "/devices": { target: "https://localhost:4000", secure: false, changeOrigin: true },
    }
  }
})