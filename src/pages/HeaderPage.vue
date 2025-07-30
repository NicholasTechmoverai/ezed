<template>
  <header class="app-header">
    <n-space  justify="space-between" align="center">
      <!-- Brand -->
      <router-link to="/" class="brand-link">
        <n-gradient-text :size="24" type="primary" class="font-bold">
          SOS
        </n-gradient-text>
      </router-link>

      <!-- Right Section -->
      <n-space align="center" size="small">
        <!-- Dark Mode Toggle -->
        <n-tooltip :content="isDark ? 'Switch to light mode' : 'Switch to dark mode'" placement="bottom">
          <template #trigger>
            <n-switch
              v-model:value="isDark"
              :rail-style="railStyle"
              aria-label="Toggle Theme"
              size="small"
            >
              <template #checked-icon>
                <n-icon :component="MoonOutline" size="18" />
              </template>
              <template #unchecked-icon>
                <n-icon :component="SunnyOutline" size="18" />
              </template>
            </n-switch>
          </template>
        </n-tooltip>

        <!-- User Dropdown -->
        <!-- v-if="userStore.isAuthenticated" -->

        <n-dropdown
          :options="userMenuOptions"
          placement="bottom-end"
          trigger="click"
        >
          <n-button quaternary circle>
            <template #icon>
              <n-avatar
                size="small"
                :src="userStore.avatar"
                fallback-src="/default-avatar.png"
              />
            </template>
          </n-button>
        </n-dropdown>
      </n-space>
    </n-space>
  </header>
</template>

<script setup>
import { ref, watch, h } from 'vue'
import { useThemeStore } from '@/store/themeStore'
import { useUserStore } from '@/store/userStore'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'

import {
  Pencil as EditIcon,
  LogOutOutline as LogoutIcon,
  PersonCircleOutline as UserIcon,
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

const themeStore = useThemeStore()
const userStore = useUserStore()

// Dark mode toggle reactive state
const isDark = ref(themeStore.theme === 'dark')

// Keep ref in sync with store
watch(
  () => themeStore.theme,
  (newTheme) => {
    isDark.value = newTheme === 'dark'
  },
  { immediate: true }
)

// Update theme in store when ref changes
watch(isDark, (val) => {
  themeStore.setTheme(val ? 'dark' : 'light')
})

// Rail style for switch
const railStyle = ({ focused, checked }) => ({
  backgroundColor: focused
    ? '#3b82f6' // blue-500
    : checked
    ? '#1e293b' // slate-800
    : '#facc15', // yellow-400
  transition: 'background-color 0.3s ease'
})

// User dropdown menu
const userMenuOptions =[
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
