// stores/themeStore.js
import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export const useThemeStore = defineStore('themeStore', () => {
  const theme = ref('light')

  function setTheme(value) {
    theme.value = value
  }

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  })

  return {
    theme,
    setTheme
  }
})
