import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import Unocss from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Unocss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'e-zed',
        short_name: 'e-z',
        description:"Download from TikTok, Instagram, YouTube, Facebook, X and more — share a link and get your music or video instantly.",
        start_url: '/h',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#42b883',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        share_target: {
          action: '/share',
          method: 'GET',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'files',
                accept: [
                  'text/*',
                  'image/*',
                  'video/*',
                  'application/*'
                ]
              }
            ]
          }
        }
      }
    })

  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '.'),       // Project root
      '@': path.resolve(__dirname, 'src'),     // Source folder
    },
  },
})
