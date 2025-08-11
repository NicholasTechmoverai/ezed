import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { i18n } from '../main'
import { notificationsSocket, usersSocket } from '../web_socket'
import { refreshToken } from '../api'

export const useUserStore = defineStore('userUseStore', () => {
  const theme = ref('light')
  const lang = ref('en')
  const user = ref(null)
  const token = ref(null)

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

  function setToken(t) {
    token.value = t
  }

  function clearUser() {
    user.value = null
    setToken(null)
  }

  async function init() {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setTheme(savedTheme)

    const savedLang = localStorage.getItem('lang')
    if (savedLang) setLang(savedLang)


    try {
      const response = await refreshToken({ id: '20fddc16-2867-4441-bb54-c5ce7c8f12eb' })
      if (response && response.access_token) {
        setUser(response.user)
        setToken({
          token: response.access_token,
          expires_in: response.expires_in
        })
        usersSocket.emit('join_respective', { token: token.value.token })
        notificationsSocket.emit('join_respective', { token: token.value.token })
      }
    } catch (error) {
      console.error('Failed to refresh token during init:', error)
      clearUser()
    }
  }

  // Persist theme and language to localStorage on changes
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
  })

  watch(lang, (newLang) => {
    localStorage.setItem('lang', newLang)
  })

  // Initialize store state
  init()

  return {
    theme,
    lang,
    user,
    token,
    setTheme,
    setLang,
    setUser,
    setToken,
    clearUser,
    init
  }
}, {
  persist: {
    key: 'user_',
    storage: localStorage
  }
})
