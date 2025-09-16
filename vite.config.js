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
      manifest: false   // 👈 disable auto manifest
    })
  ],

  server: {
    allowedHosts: ["ezed.tera-in.top", "e-zed.tera-in.top"],
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `static/[name]-[hash].js`,
        chunkFileNames: `static/[name]-[hash].js`,
        assetFileNames: `static/[name]-[hash][extname]`,
      },
    },
  },

  resolve: {
    alias: {
      '~': path.resolve(__dirname, '.'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
