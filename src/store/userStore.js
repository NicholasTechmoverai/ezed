import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { i18n } from '../main'

export const useUserStore = defineStore('userUseStore', () => {
  const theme = ref('light')
  const lang = ref('en')
  const user = ref(null)

  function setTheme(value) {
    theme.value = value
    document.documentElement.classList.toggle('dark', value === 'dark')
  }

  function setLang(value) {
    lang.value = value || 'en'
    i18n.global.locale.value = lang.value
  }

  function setUser(userData) {
    user.value = userData
  }

  function clearUser() {
    user.value = null
  }

  function init() {
    // Restore theme
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setTheme(savedTheme)

    // Restore language
    const savedLang = localStorage.getItem('lang')
    if (savedLang) setLang(savedLang)
  }

  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
  })

  watch(lang, (newLang) => {
    localStorage.setItem('lang', newLang)
  })

  init()

  return {
    theme,
    lang,
    user,
    setTheme,
    setLang,
    setUser,
    clearUser,
    init
  }
}, {
  persist: {
    key: 'user_',
    storage: localStorage
  }
})
