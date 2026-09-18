import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'FF14 指导者随机任务记录',
        short_name: 'FF14 导随记录',
        description: '记录最终幻想 XIV 随机任务：指导者匹配到的副本。',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f5f5fa',
        theme_color: '#7066e8',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: '记录导随',
            short_name: '记录',
            url: '/',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
              },
            ],
          },
          {
            name: '旅程统计',
            short_name: '统计',
            url: '/stats',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
              },
            ],
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{html,js,css,png,svg,json}'],
        globIgnores: ['**/pwa-192x192.png', '**/pwa-512x512.png'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['tests/firestore.rules.test.ts', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
