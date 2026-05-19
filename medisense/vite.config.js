import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'offline.html'],
      manifest: {
        name: 'MediSense',
        short_name: 'MediSense',
        description: 'Smart IV drip monitoring for hospital nurses and doctors.',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['medical', 'health'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // Cache the app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache Supabase API calls — always go network
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: 'NetworkOnly'
          }
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_/]
      }
    })
  ],
})
