import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gipfel',
        short_name: 'Gipfel',
        description: 'Learn German words step by step, WaniKani style.',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f3ec',
        theme_color: '#2f5d50',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,json}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
