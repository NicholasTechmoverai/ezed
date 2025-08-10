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
        <GlobalPrerenceTabs />
        <!-- <n-switch v-model:value="isDark" size="small">
          <template #checked-icon>
            <n-icon :component="MoonOutline" />
          </template>
<template #unchecked-icon>
            <n-icon :component="SunnyOutline" />
          </template>
</n-switch> -->



        <n-dropdown :options="userMenuOptions" size="small" placement="bottom-end" trigger="click"
          @select="handleMenuSelect">
          <n-button quaternary circle class="user-avatar-btn">
            <template #icon>
              <n-avatar size="medium" round :src="userStore.avatar || NoUser" :fallback-src="NoUser"
                class="user-avatar-img" />
            </template>
          </n-button>
        </n-dropdown>

      </n-space>
    </n-space>
  </header>
</template>

<script setup>
import { ref, watch, h, computed } from 'vue'
import { useUserStore } from '@/store/userStore'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'
import NoUser from "../assets/NoUser.png"
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
import router from '../router'
import GlobalPrerenceTabs from './GlobalPrerenceTabs.vue'

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
const userStore = useUserStore()


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
    label: "Downloads",
    key: "downloads",
    icon: renderIcon(EditIcon),

  },
  {
    label: "Logout",
    key: "logout",
    icon: renderIcon(LogoutIcon)
  }
]
function handleMenuSelect(key) {
  if (key === "profile") {
    router.push("/h/profile")
  } else if (key === "downloads") {
    router.push("/h/downloads")
  } else if (key === "logout") {
    logoutUser()
  }
}

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

.user-avatar-btn {
  padding: 0;
  transition: background-color 0.2s ease;
}

.user-avatar-img:hover {
  background-color: rgba(11, 194, 78, 0.655);
  /* subtle hover */
}

.user-avatar-img {
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  object-fit: cover;
  min-width: 35px !important;

}
</style>
