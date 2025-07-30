import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import Unocss from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(),tailwindcss(),Unocss()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '.'),       // Project root
      '@': path.resolve(__dirname, 'src'),      // Source folder
    },
  },
})
