import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/*.svg', 'assets/*.jpg', 'assets/*.png'],
      manifest: {
        name: 'Pico Travel',
        short_name: 'Pico',
        description: 'Everywhere you\'ve been. Everywhere you\'re going.',
        theme_color: '#FAF7F2',
        background_color: '#FAF7F2',
        display: 'standalone',
        icons: [{src:'assets/pico-icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]
      },
      // Cache the app shell and supplied local data only. Caching provider
      // responses here would hide their LIVE/CACHED provenance from adapters.
      workbox: {globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}']}
    })
  ]
});
