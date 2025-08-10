// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Small/local components you frequently use can remain static if you prefer.
// For larger pages/components we use lazy imports to improve initial load.
import LandingPage from '../landingpage/index.vue'
import LayoutPage from '../pages/LayoutPage.vue'
import DownloadsPage from '../pages/DownloadsPage.vue'

// Lazy-loaded route components (better for performance)
const MainContentPage = () => import('../pages/MainContentPage.vue')
const DownloadCardMount = () => import('../views/DownloadCardMount.vue')
const YoutubeListPage = () => import('../views/YoutubeListPage.vue')
const FileMetaCard = () => import('../cards/FileMetaCard.vue')
const HandleSharePage = () => import('../pages/HandleShare.vue')

// If these are really composables turned into single-file components, they can be lazy too:
const YoutubePage = () => import('../composables/YoutubePage.vue')
const FacebookPage = () => import('../composables/FacebookPage.vue')
const InstagramPage = () => import('../composables/InstagramPage.vue')
const TiktokPage = () => import('../composables/TiktokPage.vue')
const XPage = () => import('../composables/XPage.vue')
const E_404Page = () => import('../cards/E_404Page.vue')

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
  },
    {
    path: '/share',
    name: 'HandleShare',
    component: HandleSharePage,
    props:true
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

      // Instagram
      {
        path: 'inst',
        name: 'Instagram',
        component: InstagramPage,
        children: [
          {
            path: ':id',
            name: 'InstagramDetail',
            component: DownloadCardMount,
          },
        ],
      },

      // YouTube
      {
        path: 'yt',
        name: 'Youtube',
        component: YoutubePage,
        children: [
          {
            path: ':id',
            name: 'YoutubeDetail',
            component: DownloadCardMount,
          },
          {
            path: 'list/:list_id',
            name: 'YoutubeList',
            component: YoutubeListPage,
          },
        ],
      },

      // TikTok
      {
        path: 'tk',
        name: 'Tiktok',
        component: TiktokPage,
        children: [
          {
            path: ':id',
            name: 'TiktokDetail',
            component: DownloadCardMount,
          },
        ],
      },

      // Facebook
      {
        path: 'fb',
        name: 'Facebook',
        component: FacebookPage,
        children: [
          {
            path: ':id',
            name: 'FacebookDetail',
            component: DownloadCardMount,
          },
        ],
      },

      // X (Twitter)
      {
        path: 'x',
        name: 'X',
        component: XPage,
        children: [
          {
            path: ':id',
            name: 'XDetail',
            component: DownloadCardMount,
          },
        ],
      },

      {
        path: 'meta/:id',
        name: 'MetaCard',
        component: FileMetaCard,
      },
      
      {
        path: 'downloads',
        name: 'DownloadPage',
        component: DownloadsPage,
      },
    ],
  },

  // Fallback (optional)
  {
    path: '/:pathMatch(.*)*',
    name: '404Page',
    component: E_404Page,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
