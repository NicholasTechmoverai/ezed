import { createApp } from "vue";
import naive from "naive-ui";
import App from "./App.vue";
import router from './router' 
import { createPinia } from 'pinia'
import './style.css';
import 'virtual:uno.css'
const app = createApp(App);

app.use(naive);
app.use(router);
app.use(createPinia())
app.mount("#app");
