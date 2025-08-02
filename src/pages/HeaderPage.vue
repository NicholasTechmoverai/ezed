<template>
  <header class="app-header">
    <n-space justify="space-between" align="center">
      <div>
        <logo /><span class="text-xl text-gray-500 opacity-80">/</span>
        <n-button class="opacity-80" size="tiny" secondary @click="openTab(activePage.key)">
          <n-icon>
            <component :is="activePage.icon" />
          </n-icon>
          {{ activePage.label }}
        </n-button>
        <div>

        </div>
      </div>
      <n-space align="center" size="small">
        <n-switch v-model:value="isDark" size="small">
          <template #checked-icon>
            <n-icon :component="MoonOutline" />
          </template>
          <template #unchecked-icon>
            <n-icon :component="SunnyOutline" />
          </template>
        </n-switch>



        <n-dropdown :options="userMenuOptions" size="small" placement="bottom-end" trigger="click">
          <n-button quaternary circle>
            <template #icon>
              <n-avatar size="small" :src="userStore.avatar" fallback-src="/default-avatar.png" />
            </template>
          </n-button>
        </n-dropdown>
      </n-space>
    </n-space>
  </header>
</template>

<script setup>
import { ref, watch, h, computed } from 'vue'
import { useThemeStore } from '@/store/themeStore'
import { useUserStore } from '@/store/userStore'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'
import Logo from './Logo.vue'
import {
  Pencil as EditIcon,
  LogOutOutline as LogoutIcon,
  PersonCircleOutline as UserIcon,
  BriefcaseOutline
} from "@vicons/ionicons5";
import {
  NGradientText,
  NSpace,
  NSwitch,
  NTooltip,
  NIcon,
  NButton,
  NAvatar,
  NDropdown
} from 'naive-ui'

import { useRoute } from 'vue-router'
import { allSites, openTab } from '../composables'

const route = useRoute()

const activePage = computed(() => {
  const segments = route.path.split('/')
  const match = allSites.find(s => s.key === segments[2])
  return match || {
    label: 'Main',
    icon: BriefcaseOutline,
  }
})

watch(() => route.path, (newPath) => {
  // console.log('New value after /h/ is:', activePage.value)
})
const themeStore = useThemeStore()
const userStore = useUserStore()

const isDark = ref(themeStore.theme === 'dark')

watch(
  () => themeStore.theme,
  (newTheme) => {
    isDark.value = newTheme === 'dark'
  },
  { immediate: true }
)

watch(isDark, (val) => {
  themeStore.setTheme(val ? 'dark' : 'light')
})

const railStyle = ({ focused, checked }) => ({
  backgroundColor: focused
    ? '#3b82f6' // blue-500
    : checked
      ? '#1e293b' // slate-800
      : '#facc15', // yellow-400
  transition: 'background-color 0.3s ease'
})

const userMenuOptions = [
  {
    label: "Profile",
    key: "profile",
    icon: renderIcon(UserIcon)
  },
  {
    label: "Edit Profile",
    key: "editProfile",
    icon: renderIcon(EditIcon)
  },
  {
    label: "Logout",
    key: "logout",
    icon: renderIcon(LogoutIcon)
  }
]

function renderIcon(icon) {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    });
  };
}
</script>

<style scoped>
.brand-link {
  text-decoration: none;
  transition: opacity 0.2s;
}

.brand-link:hover {
  opacity: 0.8;
}
</style>
