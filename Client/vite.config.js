import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/files": "http://localhost:4000",
      "/users": "http://localhost:4000",
      "/admin": "http://localhost:4000",
    }
  }
})