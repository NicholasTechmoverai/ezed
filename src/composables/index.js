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




export const openTab = (tab) => {
//   const route = useRoute()
//   const router = useRouter()

//   const currentTab = route.path.split('/')[2] || route.params?.child

//   if (currentTab === tab) {
//     router.go(0)
//   } else {
//     router.push(`/h/${tab}`)
//   }
    router.push(`/h/${tab}`)

}
