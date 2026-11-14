import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'



// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Library besar dipisah ke file sendiri agar file utama tetap kecil dan mudah di-cache browser
        codeSplitting: {
          groups: [
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/]@firebase[\\/]firestore/,
              priority: 30,
            },
            {
              name: 'firebase-core',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 20,
            },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
