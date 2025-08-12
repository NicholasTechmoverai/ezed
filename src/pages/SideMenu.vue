<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    v-model:collapsed="collapsed"
    show-trigger
    class="h-screen fixed z-[150]  shadow-md flex flex-col"
  >
    <div
      class="p-4 flex items-center gap-2 justify-center border-b border-gray-200 dark:border-gray-700"
    >
      <Logo :showName="!collapsed" :rounded="2" :size="2" />
    </div>

    <n-menu
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
      :default-expanded-keys="defaultExpandedKeys"
      :render-label="renderMenuLabel"
      :render-icon="renderMenuIcon"
      :expand-icon="expandIcon"
      @select="handleMenuSelect"
      class="mt-2 flex-1 overflow-y-auto"
    />
  </n-layout-sider>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import {
  NIcon,
  NLayoutSider,
  NMenu,
  NProgress
} from 'naive-ui'
import {
  MusicalNoteSharp,
  CloudDownloadOutline,
  DownloadOutline,
  FolderOpenOutline,
  ShareSocialOutline,
  PersonCircleOutline,
  SettingsOutline,
  ChevronDownOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline
} from '@vicons/ionicons5'
import { useDownloadStore } from '../store/downloadStore'
import { useStateStore } from '../store/stateStore'
import router from '../router'
import Logo from './Logo.vue'
import { allSites } from '../composables'

const collapsed = ref(false)
const defaultExpandedKeys = ref(['download_video'])

const stateStore = useStateStore()
const downloadStore = useDownloadStore()

const ongoingDownloadsMenu = computed(() => {
  const downloads = downloadStore.onGoingDownloads || {}

  if (Object.keys(downloads).length === 0) {
    return [
      {
        label: 'No ongoing downloads',
        key: 'no-downloads',
        icon: MusicalNoteSharp,
        disabled: true
      }
    ]
  }

  return Object.entries(downloads).map(([key, value]) => {
    const label =
      value.filename ||
      value.name ||
      (value.url ? `Download from ${new URL(value.url).hostname}` : `Download ${key}`)

    const isCompleted = value.status === 'completed'
    const isError = value.status === 'error'

    return {
      label,
      key,
      icon: MusicalNoteSharp,
      class: {
        'text-green-500': isCompleted,
        'text-red-500': isError
      },
      onClick: () => {
        stateStore.setLoadingBar(0)
        router.push(`/h/yt/${key}`)
      },
      extra: isCompleted
        ? h(NIcon, { size: 16, color: 'green' }, () => h(CheckmarkCircleOutline))
        : isError
        ? h(NIcon, { size: 16, color: 'red' }, () => h(AlertCircleOutline))
        : h(NProgress, {
            type: 'line',
            percentage: value.progress || 0,
            height: 2,
            indicatorPlacement: 'inside'
          })
    }
  })
})

const menuOptions = computed(() => [
  {
    label: 'Ongoing Downloads',
    key: 'ongoingdownloads',
    icon: CloudDownloadOutline,
    children: ongoingDownloadsMenu.value
  },
  {
    label: 'Download video',
    key: 'download_video',
    icon: DownloadOutline,
    children: allSites
  },
  {
    label: 'Playlists',
    key: 'list',
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
])

const renderMenuLabel = (option) =>
  h(
    'span',
    {
      class:
        'text-gray-800 dark:text-gray-200 hover:text-indigo-500 select-none transition-colors duration-200'
    },
    option.label
  )

const renderMenuIcon = (option) =>
  option.icon ? h(NIcon, null, { default: () => h(option.icon) }) : null

const expandIcon = () => h(NIcon, { size: 16 }, { default: () => h(ChevronDownOutline) })

function handleMenuSelect(key) {
  stateStore.setLoadingBar(0)
  router.push(`/h/${key}`)
}
</script>

<style>
/* Custom scrollbar for sidebar */
.n-layout-sider {
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 59, 86, 0.933) transparent;
}

.n-layout-sider::-webkit-scrollbar {
  width: 6px;
}

.n-layout-sider::-webkit-scrollbar-thumb {
  background-color: rgba(79, 70, 229, 0.3);
  border-radius: 4px;
}

.n-layout-sider::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
