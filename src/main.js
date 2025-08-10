import { createApp } from "vue";
import naive from "naive-ui";
import App from "./App.vue";
import router from './router' 
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import './style.css';
import 'virtual:uno.css'
import 'flag-icons/css/flag-icons.min.css';

const app = createApp(App);

app.use(naive);
app.use(router);
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

app.mount("#app");
