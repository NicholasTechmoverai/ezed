import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('userUseStore', () => {
  const theme = ref('light')
  const user = ref(null)

  function setTheme(value) {
    theme.value = value
    document.documentElement.classList.toggle('dark', value === 'dark')
  }

  function setUser(userData) {
    user.value = userData
  }

  function clearUser() {
    user.value = null
  }

  return {
    theme,
    user,
    setTheme,
    setUser,
    clearUser
  }
}, {
  persist: {
    key: 'user_',
    storage: localStorage,
    afterRestore: () => {
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
      const savedAt = localStorage.getItem('user-store-timestamp')
      if (savedAt && Date.now() - parseInt(savedAt, 10) > maxAge) {
        localStorage.removeItem('user_')
        localStorage.removeItem('user-store-timestamp')
      }
    },
    beforeRestore: () => {
      if (!localStorage.getItem('user-store-timestamp')) {
        localStorage.setItem('user-store-timestamp', Date.now().toString())
      }
    }
  }
})
