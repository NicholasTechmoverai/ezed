import { Facebook, Youtube, Instagram, Tiktok, Twitter } from '@vicons/fa'
import router from '../router'
import { useRoute } from 'vue-router'

export const allSites = [
    {
        key: 'inst',
        label: 'Instagram',
        icon: Instagram,
    },
    {
        key: 'yt',
        label: 'YouTube',
        icon: Youtube,
    },
    {
        key: 'fb',
        label: 'Facebook',
        icon: Facebook,
    },
    {
        key: 'tk',
        label: 'Tiktok',
        icon: Tiktok,
    },
    {
        key: 'x',
        label: 'X',
        icon: Twitter,
    }
]

export const getSiteByKey = (key) => {
    return allSites.find(site => site.key === key) || null
}

export const getSiteKeyFromURL = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase(); // e.g. "youtu.be"
    return allSites.find(site =>
      site.label.toLowerCase().startsWith(hostname) || hostname.startsWith(site.label.toLowerCase())
    )?.key || null;
  } catch {
    return null;
  }
}


export const openTab = (tab) => {
//   const route = useRoute()
//   const router = useRouter()

//   const currentTab = route.path.split('/')[2] || route.params?.child

  if (tab === "home") {
    router.push(`/h`)
  } else {
    router.push(`/h/${tab}`)
  }
}
