<template>
  <div class="min-h-screen p-4 flex flex-col items-center ">
    <transition name="fade-slide" mode="out-in">
      <n-card v-if="loading" hoverable :bordered="false" class="max-w-sm w-full mx-auto transition-all duration-300"
        :content-style="{ padding: 0 }">
        <n-space vertical>
          <n-skeleton height="220px" width="100%" class="min-w-[300px]"/>
          <n-space vertical :size="16" style="padding: 20px">
            <n-skeleton text width="70%" size="medium" />
            <n-space justify="space-between">
              <n-skeleton text width="40%" />
              <n-skeleton text width="30%" />
            </n-space>
            <n-skeleton height="10px" width="100%" :sharp="false" />
            <n-space justify="center">
              <n-skeleton circle size="medium" />
              <n-skeleton circle size="medium" />
              <n-skeleton circle size="medium" />
            </n-space>
          </n-space>
        </n-space>
      </n-card>

      <!-- Actual Content -->
      <n-card v-else-if="localFileData || !loading" hoverable :bordered="false"
        class="max-w-sm w-full mx-auto transition-all duration-300 hover:shadow-xl dark:hover:shadow-lg dark:hover:shadow-neutral-800/50 overflow-hidden"
        :content-style="{ padding: 0 }">
        <div class="flex flex-col">
          
          <div class="relative w-full h-56 bg-gradient-to-r from-cyan-500 to-blue-500 group cursor-pointer  overflow-hidden "
            @click="toggleLoader">
            <div class="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center transition-opacity z-50"
              :class="isLoaderActive ? 'opacity-100' : 'opacity-0'">
              <transition name="zoom" mode="out-in">
                <div v-if="downloadStatus === STATUS_CONFIG.merging.key" key="merging" class="text-center p-4">
                  <n-progress type="circle" :percentage="mergeProgress" status="info" size="large"
                    :stroke-width="8" :gap-position="'bottom'">
                    <span class="text-white text-sm font-medium">{{ mergeProgress }}%</span>
                  </n-progress>
                  <p class="mt-3 text-white font-medium">Merging files...</p>
                </div>
                <div v-else-if="downloadStatus === STATUS_CONFIG.starting.key || 
                                downloadStatus === STATUS_CONFIG.processing.key" 
                     key="processing" class="text-center">
                  <n-spin size="large" :stroke-width="12" />
                  <p class="mt-3 text-white font-medium">Preparing download...</p>
                </div>
                <div v-else key="download-progress" class="text-center">
                  <n-progress type="circle" :percentage="averageDownloadPercentage" status="info" size="large"
                    :stroke-width="8" :gap-position="'bottom'">
                    <span class="text-white font-medium">{{ averageDownloadPercentage }}%</span>
                  </n-progress>
                  <div class="mt-3 text-white flex items-center justify-center space-x-2">
                    <n-icon :component="SpeedometerOutline" size="18" />
                    <span>{{ downloadSpeed }}</span>
                    <n-divider vertical />
                    <n-icon :component="TimeOutline" size="18" />
                    <span>{{ timeRemaining }}</span>
                  </div>
                </div>
              </transition>
            </div>

        <n-image :src="fileThumbnail" :fallback-src="defaultThumbnail" width="100%"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 border z-30"
              preview-disabled>
              <template #error>
                <div class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4">
                  <n-icon size="60" :component="ImageOutline" class="text-white/80" />
                  <p class="mt-3 text-white text-center font-medium text-lg">{{ fileName || 'Media File' }}</p>
                  <p class="text-white/80 text-sm mt-1">{{ fileExtension }} • {{ formattedFileSize }}</p>
                </div>
              </template>
            </n-image>

            <!-- Status badge -->
            <n-tag :type="statusTagType" round
              class="flex items-center justify-center absolute top-3 left-3 shadow-lg bg-white/20 backdrop-blur-md border-0 z-60">
              <template #icon>
                <n-icon :component="statusIcon" />
              </template>
              {{ downloadStatus }}
            </n-tag>

            <n-tooltip trigger="hover" >
              <template #trigger>
                <n-button type="default" circle size="small" @click.stop="showMeta"
                  class="absolute top-3 right-3 shadow-lg bg-white/20 backdrop-blur-md border-0 z-60">
                  <template #icon>
                    <n-icon :component="InformationCircle" class="text-white" />
                  </template>
                </n-button>
              </template>
              View Details
            </n-tooltip>
          </div>

          <!-- File info -->
          <div class="p-5 space-y-3">
            <div class="space-y-2">
              <n-ellipsis class="text-xl font-bold text-gray-800 dark:text-white">
                {{ fileName || 'Untitled file' }}
              </n-ellipsis>
              <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center space-x-2">
                  <n-tag size="small" :bordered="false" type="info" round>
                    {{ fileExtension }}
                  </n-tag>
                  <span>{{ formattedFileSize }}</span>
                </div>
                <span v-if="remainingSize > 0" class="text-amber-600 dark:text-amber-400 font-medium">
                  {{ formatFileSize(remainingSize) }} left
                </span>
              </div>
            </div>

            <!-- Progress bars -->
            <transition-expand>
              <div v-if="showDownloadProgress" class="space-y-4 pt-2">
                <div>
                  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Video</span>
                    <span>{{ downloadPercentage }}%</span>
                  </div>
                  <n-progress type="line" :percentage="downloadPercentage" status="info"
                    :height="10" :border-radius="5" processing />
                </div>

                <div v-if="hasAudio">
                  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Audio</span>
                    <span>{{ audioDownloadPercentage }}%</span>
                  </div>
                  <n-progress type="line" :percentage="audioDownloadPercentage" status="success"
                    :height="10" :border-radius="5" processing />
                </div>
              </div>
            </transition-expand>

            <!-- Action buttons -->
            <div class="pt-3">
              <transition name="fade" mode="out-in">
                <template v-if="!showDownloadProgress">
                  <n-space vertical>
                    <n-button 
                      type="primary" 
                      size="large" 
                      @click="startDownload" 
                      class="shadow-md"
                      :disabled="downloadStatus === 'completed'"
                    >
                      <template #icon>
                        <n-icon>
                          <DownloadOutline v-if="downloadStatus !== 'completed'" />
                          <CheckmarkOutline v-else />
                        </n-icon>
                      </template>
                      {{ downloadStatus === 'completed' ? 'Download Complete' : 'Download File' }}
                    </n-button>
                    <n-button 
                      type="tertiary" 
                      size="large" 
                      @click="shareDownload"
                      :disabled="downloadStatus !== 'completed'"
                    >
                      <template #icon>
                        <n-icon>
                          <ShareSocialOutline />
                        </n-icon>
                      </template>
                      Share Download
                    </n-button>
                  </n-space>
                </template>

                <template v-else>
                  <n-space justify="space-between">
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-button 
                          circle 
                          size="large" 
                          :type="downloadStatus === 'paused' ? 'primary' : 'default'"
                          @click="downloadStatus === 'paused' ? resumeDownload() : pauseDownload()"
                        >
                          <template #icon>
                            <n-icon>
                              <PlayOutline v-if="downloadStatus === 'paused'" />
                              <PauseOutline v-else />
                            </n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ downloadStatus === 'paused' ? 'Resume' : 'Pause' }}
                    </n-tooltip>

                    <n-popconfirm 
                      :positive-text="downloadStatus === 'completed' ? 'Delete' : 'Cancel'"
                      @positive-click="cancelDownload"
                    >
                      <template #trigger>
                        <n-button circle size="large" type="error" secondary>
                          <template #icon>
                            <n-icon>
                              <TrashOutline />
                            </n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ downloadStatus === 'completed'
                        ? 'Are you sure you want to delete this download?'
                        : 'Are you sure you want to cancel this download?' }}
                    </n-popconfirm>

                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-button 
                          circle 
                          size="large" 
                          type="default" 
                          secondary 
                          @click="toggleLoader"
                        >
                          <template #icon>
                            <n-icon>
                              <EyeOffOutline v-if="isLoaderActive" />
                              <EyeOutline v-else />
                            </n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isLoaderActive ? 'Hide' : 'Show' }} Progress
                    </n-tooltip>
                    
                    <n-button circle size="large" type="info" secondary @click="showMeta">
                      <template #icon>
                        <n-icon>
                          <InformationCircle />
                        </n-icon>
                      </template>
                    </n-button>
                  </n-space>
                </template>
              </transition>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Not Found State -->
      <n-card v-else class="max-w-sm w-full rounded-2xl overflow-hidden">
        <n-result status="404" title="Download Not Found" description="The requested download could not be found">
          <template #footer>
            <n-button type="primary" size="large" @click="router.back()" class="mt-4">
              Go Back
            </n-button>
          </template>
        </n-result>
      </n-card>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useThemeVars } from 'naive-ui'
import {
  ImageOutline,
  PlayOutline,
  PauseOutline,
  CloseCircleOutline,
  DownloadOutline,
  EyeOutline,
  EyeOffOutline,
  SpeedometerOutline,
  TimeOutline,
  RefreshOutline,
  ShareSocialOutline,
  TrashOutline,
  InformationCircle,
  CheckmarkOutline
} from '@vicons/ionicons5'
import { useDownloadStore } from '../store/downloadStore'
import { getFile } from '../db/download'
import defaultThumbnail from "../assets/defaultThumbnail.png"
import { useMessage } from 'naive-ui'
import router from '../router'
import { STATUS_CONFIG } from '../utils'
import { useUserStore } from '../store/userStore'


// Props
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

// Composables
const themeVars = useThemeVars()
const message = useMessage()
const downloadStore = useDownloadStore()

// State
const isLoaderActive = ref(true)
const localFileData = ref(null)
const loading = ref(true)

// Computed
const fileThumbnail = computed(() => localFileData.value?.thumbnail || defaultThumbnail)
const fileName = computed(() => {
  const name = localFileData.value?.name || localFileData.value?.filename || localFileData.value?.title || 'Untitled file'
  return name.split('.').slice(0, -1).join('.') || name
})
const fileExtension = computed(() => {
  const ext = localFileData.value?.extension ||
    localFileData.value?.ext ||
    'file'
  return ext.toUpperCase()
})
const formattedFileSize = computed(() => formatFileSize(localFileData.value?.filesize))
const downloadStatus = computed(() => localFileData.value?.status || 'default')
const statusTagType = computed(() => STATUS_CONFIG[downloadStatus.value]?.type || 'default')
const statusIcon = computed(() => STATUS_CONFIG[downloadStatus.value]?.icon || null)
const statusMessage = computed(() => STATUS_CONFIG[downloadStatus.value]?.message || 'Unknown')
const showDownloadProgress = computed(() => ['active', 'paused', 'downloading','processing', 'merging'].includes(downloadStatus.value.toLowerCase()))
const progressColor = computed(() => {
  switch (downloadStatus.value) {
    case 'active': return themeVars.value.primaryColor
    case 'downloading': return themeVars.value.primaryColor
    case 'paused': return themeVars.value.warningColor
    case 'error': return themeVars.value.errorColor
    case 'completed': return themeVars.value.successColor
    default: return themeVars.value.infoColor
  }
})
const progressRailColor = computed(() => changeColor('gray', { alpha: 0.2 }))

// Download progress
const averageDownloadPercentage = computed(() => {
  if (!localFileData.value?.filesize) return 0

  if (!hasAudio.value) {
    return Math.min(100, Math.round((localFileData.value?.downloadedSize / localFileData.value?.filesize) * 100) || 0)
  }

  const videoProgress = localFileData.value.downloadedSize / localFileData.value.filesize
  const audioProgress = localFileData.value.a_downloadedSize / localFileData.value.a_filesize
  return Math.min(100, Math.round(((videoProgress + audioProgress) / 2) * 100))
})

const downloadPercentage = computed(() => {
  if (!localFileData.value?.filesize) return 0
  return Math.min(100, Math.round((localFileData.value?.downloadedSize / localFileData.value?.filesize) * 100) || 0)
})

const audioDownloadPercentage = computed(() => {
  if (!localFileData.value?.a_filesize) return 0
  return Math.min(100, Math.round((localFileData.value?.a_downloadedSize / localFileData.value?.a_filesize) * 100) || 0)
})

const downloadSpeed = computed(() => {
  const speed = localFileData.value?.downloadSpeedMbps
  return speed ? `${speed}` : '0 KB/s'
})

const timeRemaining = computed(() => {
  const eta = localFileData.value?.eta
  return eta || '--:--'
})

const remainingSize = computed(() => {
  if (!localFileData.value?.filesize) return 0
  return Math.max(0, localFileData.value.filesize - (localFileData.value.downloadedSize || 0))
})

const mergeProgress = computed(() => localFileData.value?.merge_progress || 0)
const hasAudio = computed(() => audioDownloadPercentage.value || localFileData.value?.hasAudio || false)

// Methods
const fetchFileData = async () => {
  loading.value = true
  try {
    // Check ongoing downloads first
    if (downloadStore.onGoingDownloads[props.id]) {
      localFileData.value = downloadStore.onGoingDownloads[props.id]
      return
    }

    // Fallback to database
    const dbFile = await getFile(props.id)
    if (dbFile) {
      localFileData.value = {
        ...dbFile,
        status: dbFile.status || 'completed'
      }
    }
  } catch (error) {
    console.error('Error fetching file:', error)
    message.error('Failed to load download details')
  } finally {
    loading.value = false
  }
}

const toggleLoader = () => {
  isLoaderActive.value = !isLoaderActive.value
}
const userStore = useUserStore()
const startDownload = async () => {
  try {
    message.loading('Starting download...')
    await downloadStore.download_file(`${localFileData.value.key || 'inst'}/${userStore.user?.username}/download`, props.id, localFileData.value?.url,localFileData.value.itag, localFileData.value.format)
    message.success('Download started successfully')
  } catch (error) {
    message.error('Failed to start download')
    console.error('Download error:', error)
  }
}

const pauseDownload = () => {
  downloadStore.pauseDownload(props.id)
  message.info('Download paused')
}

const resumeDownload = () => {
  downloadStore.resumeDownload(props.id)
  message.info('Download resumed')
}

const cancelDownload = async () => {
  try {
    if (downloadStatus.value === 'completed') {
      await downloadStore.deleteDownload(props.id)
      message.success('Download deleted')
      router.back()
    } else {
      await downloadStore.cancelDownload(props.id)
      message.info('Download cancelled')
    }
  } catch (error) {
    message.error('Failed to cancel download')
    console.error('Cancel error:', error)
  }
}

const shareDownload = () => {
  if (navigator.share) {
    navigator.share({
      title: fileName.value,
      text: `Check out this download: ${fileName.value}`,
      url: window.location.href
    }).catch(() => {
      message.warning('Sharing was cancelled')
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    message.success('Link copied to clipboard')
  }
}

const showMeta = () => {
  router.push(`/h/meta/${props.id}`)
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 2 : 0)} ${units[i]}`
}

const changeColor = (color, options = { alpha: 1 }) => {
  return color.replace(/rgb\(|\)/g, '').split(',')
    .map((c, i) => i === 3 ? options.alpha : c.trim())
    .join(',')
    .replace(/(\d+),(\d+),(\d+)(?:,[\d.]+)?/, `rgba($1,$2,$3,${options.alpha})`)
}

// Watchers
watch(() => props.id, fetchFileData, { immediate: true })

watch(
  () => downloadStore.onGoingDownloads[props.id],
  (newValue) => {
    if (newValue) {
      localFileData.value = newValue
    }
  },
  { deep: true }
)
</script>


<style scoped>
/* Custom transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Custom expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  height: 0;
  opacity: 0;
  margin: 0;
}

/* Gradient background for image fallback */
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-indigo-500 {
  --tw-gradient-from: #6366f1;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(99, 102, 241, 0));
}

.to-purple-600 {
  --tw-gradient-to: #7e22ce;
}
</style>

<style scoped>
/* Custom transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* Expand transition for progress bars */
.expand-enter-active,
.expand-leave-active {
  transition: height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  height: 0;
  opacity: 0;
  margin: 0;
}
</style>