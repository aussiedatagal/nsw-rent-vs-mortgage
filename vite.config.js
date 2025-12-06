import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})

