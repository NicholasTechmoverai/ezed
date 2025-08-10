<template>
    <n-layout-sider bordered collapse-mode="width" :collapsed-width="64" :width="240" v-model:collapsed="collapsed"
      show-trigger class="h-screen fixed">
      <div class="p-4 flex items-center gap-2 justify-center border-b border-gray-200 dark:border-gray-700">
        <img :src="SITEMETA.logo" :alt="SITEMETA.name || 'Site Logo'"
          class="w-10 h-8 rounded-xl shadow-lg dark:shadow-gray-800/50 transition-all duration-300"
        />
        <n-text v-if="!collapsed" strong class="text-2xl font-bold" :class="{color:SITEMETA.theme_color}">{{SITEMETA.name}}</n-text>
      </div>
      <n-menu :collapsed="collapsed" :collapsed-width="64" :collapsed-icon-size="22" :options="menuOptions"
        :render-label="renderMenuLabel" :render-icon="renderMenuIcon" :expand-icon="expandIcon"    @select="handleMenuSelect"  class="mt-2" />
    </n-layout-sider>

</template>

<script setup>
import { ref, h } from 'vue'
import {
  NIcon,
  NText,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NMenu
} from 'naive-ui'

import {
  MusicalNoteSharp,
  CloudDownloadOutline,
  DownloadOutline,
  FolderOpenOutline,
  ShareSocialOutline,
  PersonCircleOutline,
  SettingsOutline,
  ChevronDownOutline
} from '@vicons/ionicons5'
import { SITEMETA } from '../utils'
import { allSites } from '../composables'
import router from '../router'
import { useStateStore } from '../store/stateStore'
const stateStore = useStateStore()

const collapsed = ref(false)

const menuOptions = [
  {
    label: 'Ongoing Downloads',
    key: 'ongoingdownloads',
    icon: CloudDownloadOutline,
    children: [
      { label: 'down1', key: 'down1' },
      { label: 'down2', key: 'down2' }
      // Add more ongoing download items dynamically if needed
    ]
  },
  {
    label: 'Download video',
    key: 'download_video',
    icon: DownloadOutline,
    children: allSites
  },
  {
    label: 'Playlists',
    key: 'playlists',
    icon: FolderOpenOutline
  },
  {
    label: 'Shares',
    key: 'shares',
    icon: ShareSocialOutline
  },
  {
    label: 'Profile',
    key: 'profile',
    icon: PersonCircleOutline
  },
  {
    label: 'Settings',
    key: 'settings',
    icon: SettingsOutline
  }
]

const renderMenuLabel = (option) => {
  return h(
    'span',
    { class: 'text-gray-800 dark:text-gray-200 hover:text-indigo-500 select-none' },
    option.label
  )
}

const renderMenuIcon = (option) => {
  return option.icon
    ? h(NIcon, null, { default: () => h(option.icon) })
    : null
}

const expandIcon = () => {
  return h(NIcon, { size: 16 }, { default: () => h(ChevronDownOutline) })
}

function handleMenuSelect(key) {
          stateStore.setLoadingBar(0)

  router.push(`${key}`); 
}
</script>

<style scoped>
.n-layout-sider {
  height: 100vh;
  overflow-y: auto;
}

.n-layout-sider::-webkit-scrollbar {
  width: 4px;
}

.n-layout-sider::-webkit-scrollbar-thumb {
  background-color: rgba(79, 70, 229, 0.3);
  border-radius: 4px;
}

.n-layout-sider::-webkit-scrollbar-track {
  background-color: transparent;
}

.n-menu {
  --n-item-height: 44px;
}

.n-menu :deep(.n-menu-item-content) {
  transition: all 0.2s ease;
}

.n-menu :deep(.n-menu-item-content--selected) {
  background-color: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
}

.n-menu :deep(.n-menu-item-content--selected .n-icon) {
  color: #6366f1 !important;
}

.n-menu :deep(.n-menu-item-content:hover) {
  background-color: rgba(99, 102, 241, 0.05);
}
</style>
