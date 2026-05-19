import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/logo.png'],
      workbox: {
        importScripts: ['/push-handler.js'],
      },
      manifest: {
        name: 'FoodSaver',
        short_name: 'FoodSaver',
        description: 'Gestiona tu despensa y evita el desperdicio',
        theme_color: '#4A6767',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/images/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
