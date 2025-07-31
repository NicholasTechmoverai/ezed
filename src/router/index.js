import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import LayoutPage from '../pages/LayoutPage.vue'

import YoutubePage from '../composables/YoutubePage.vue'
import FacebookPage from '../composables/FacebookPage.vue'
import InstagramPage from '../composables/InstagramPage.vue'
import TiktokPage from '../composables/TiktokPage.vue'
import XPage from '../composables/XPage.vue'
import MainContentPage from '../pages/MainContentPage.vue'
import ViewsInstagramPage from '../views/InstagramPage.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
  },
  {
    path: '/h',
    name: 'Layout',
    component: LayoutPage,
    children: [
      {
        path: '',
        name: 'MainContent',
        component: MainContentPage,
      },
      {
        path: 'inst',
        name: 'Instagram',
        component: InstagramPage,
        children: [
          {
            path: ':id',
            name: 'ViewsInstagramPage',
            component: ViewsInstagramPage,
          },
        ],
      },
      {
        path: 'yt',
        name: 'Youtube',
        component: YoutubePage,
        children: [
          {
            path: ':id',
            name: 'YoutubeDetail',
            component: YoutubePage,
          },
        ],
      },
      {
        path: 'tk',
        name: 'Tiktok',
        component: TiktokPage,
        children: [
          {
            path: ':id',
            name: 'TiktokDetail',
            component: TiktokPage,
          },
        ],
      },
      {
        path: 'fb',
        name: 'Facebook',
        component: FacebookPage,
        children: [
          {
            path: ':id',
            name: 'FacebookDetail',
            component: FacebookPage,
          },
        ],
      },
      {
        path: 'x',
        name: 'X',
        component: XPage,
        children: [
          {
            path: ':id',
            name: 'XDetail',
            component: XPage,
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
