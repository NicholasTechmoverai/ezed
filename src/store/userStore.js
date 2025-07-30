// stores/themeStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('themeStore', () => {
  const theme = ref('light')

  function setTheme(value) {
    theme.value = value
    document.documentElement.classList.toggle('dark', value === 'dark')
  }

  return {
    theme,
    setTheme,
  }
})
