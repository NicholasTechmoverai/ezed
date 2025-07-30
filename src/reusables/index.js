import router from '@/router';

export const goHome = () => {
  router.push('/')
}

export const copyToClipboard = async (msg) => {
  try {
    await navigator.clipboard.writeText(msg)
    return true
  } catch (err) {
    console.error('Failed to copy OTP: ', err)
    return false
  }
}

export const applyTheme = (theme) => {
      console.log("Applying theme", theme)

  const root = document.documentElement;
  root.classList.remove('dark', 'my-app-dark'); // Clear all first

  if (theme === 'dark') {
    root.classList.add('dark', 'my-app-dark'); // Both for Tailwind + PrimeVue
  } else if (theme === 'light') {
    // Nothing to add
  } else if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark', 'my-app-dark');
    }
  }
};


// composables/useIsMobile.js
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isMobile = ref(window.innerWidth < 768)

export const useIsMobile = () => {
  const checkIsMobile = () => {
    isMobile.value = window.innerWidth < 768
  }

  onMounted(() => {
    window.addEventListener('resize', checkIsMobile)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIsMobile)
  })

  return isMobile
}


export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}


export const polishUrlName =  (name,id=null) => {
  // console.log(name)
  return id? `${name.replace(/\s+/g, '-').toLowerCase()}/${id}`:`${name.replace(/\s+/g, '-').toLowerCase()}`;
}

export const formattedFromUrl = ((name) => {
    return name ? name.replace(/-/g, ' ') : 'Untitled '
})
 

export const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
}