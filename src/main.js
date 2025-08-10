import { createApp } from "vue";
import naive from "naive-ui";
import App from "./App.vue";
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import './style.css';
import 'virtual:uno.css'
import 'flag-icons/css/flag-icons.min.css';

import { createI18n } from 'vue-i18n'

import en from './locales/en'
import ar from './locales/ar'
import hi from './locales/hi'
import sw from './locales/sw'
import zh from './locales/zh'


const i18n = createI18n({
    legacy: false, // Composition API mode
    locale: 'en',  // default language
    fallbackLocale: 'en',
    messages: { en, ar, hi, sw, zh }
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(console.error);
}

const app = createApp(App);
app.use(naive);
app.use(router);
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(i18n)
app.mount("#app");
export { i18n }