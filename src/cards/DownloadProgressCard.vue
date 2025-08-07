<template>
  <div class="min-h-screen p-4">
    <!-- Skeleton Loading -->
        <transition name="fade-slide" mode="out-in">
      <n-card v-if="loading" hoverable :bordered="false" class="max-w-xs mx-auto transition-all duration-300"
        :content-style="{ padding: 0 }">
        <n-space vertical>
          <n-skeleton height="200px" width="100%" />
          <n-space vertical :size="12" style="padding: 16px">
            <n-skeleton text width="60%" />
            <n-skeleton text width="40%" />
            <n-space justify="space-between">
              <n-skeleton text width="30%" />
              <n-skeleton text width="30%" />
            </n-space>
            <n-skeleton height="8px" width="100%" />
            <n-space justify="space-between">
              <n-skeleton text width="40%" />
              <n-skeleton text width="40%" />
            </n-space>
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
        class="max-w-xs mx-auto min-w-[300px] transition-all duration-300 hover:shadow-xl dark:hover:shadow-lg dark:hover:shadow-neutral-800"
        :content-style="{ padding: 0 }">
        <div class="flex flex-col p-4 space-y-4">
          <!-- Thumbnail with progress overlay -->
          <div class="relative w-full max-h-[350px] rounded-lg overflow-hidden group cursor-pointer"
            @click="toggleLoader">
            <n-image :src="fileThumbnail" :fallback-src="defaultThumbnail"
              class="w-full h-full min-w-[200px]  min-h-[200px] object-cover transition-transform duration-300 group-hover:scale-105"
              preview-disabled>
              <template #error>
                <div class="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <n-icon size="48" :component="ImageOutline" class="text-neutral-400" />
                </div>
              </template>
            </n-image>

            <!-- Progress overlay -->
            <transition name="fade">
              <div v-if="isLoaderActive || downloadStatus === 'merging'"
                class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <transition  name="slide-up" mode="out-in">
                  <div v-if="downloadStatus === 'merging'" key="merging">
                    <n-progress type="circle" :percentage="mergeProgress" :color="progressColor"
                      :rail-color="progressRailColor">
                      <span class="text-white text-sm font-medium">{{ mergeProgress }}% merging</span>
                    </n-progress>
                  </div>
                  <div v-else key="download-progress" class="flex items-center justify-center">
                    <n-progress type="circle" :percentage="averageDownloadPercentage" :color="progressColor"
                      :rail-color="progressRailColor" :stroke-width="6" :gap-degree="90" :show-indicator="false"
                      class="scale-90" />
                    <span class="absolute text-white font-medium text-sm">
                      {{ averageDownloadPercentage }}%
                    </span>
                  </div>
                </transition>
              </div>
            </transition>

            <!-- Status badge -->
            <transition name="slide-up">
              <n-tag :type="statusTagType" round
                class="absolute bottom-3 left-1/2 transform -translate-x-1/2 shadow-md bg-gray-500/30 backdrop-blur-3">
                <template #icon>
                  <n-icon :component="statusIcon" />
                </template>
                {{ statusMessage }}
              </n-tag>
            </transition>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button type="default" round size="small" @click.stop="showMeta"
                  class="absolute top-2 right-2 shadow-md bg-gray-500/30 backdrop-blur-3">
                  <template #icon>
                    <n-icon :component="InformationCircle" />
                  </template>
                </n-button>
              </template>
              View Details
            </n-tooltip>
          </div>

          <!-- File info -->
          <div class="space-y-1">
            <n-ellipsis class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {{ fileName || 'Untitled file' }}
            </n-ellipsis>
            <div class="flex justify-between items-center text-sm text-neutral-500 dark:text-neutral-400">
              <span>{{ formattedFileSize }} • {{ fileExtension }}</span>
              <span v-if="remainingSize > 0">{{ formatFileSize(remainingSize) }} left</span>
            </div>
          </div>

          <!-- Progress bar -->
          <transition-expand>
            <div v-if="showDownloadProgress" class="space-y-2">
              <n-progress type="line" :percentage="downloadPercentage" :color="progressColor"
                :rail-color="progressRailColor" :height="8" :border-radius="4" processing />
              <div class="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <div class="flex items-center space-x-1">
                  <n-icon :component="SpeedometerOutline" size="14" />
                  <span>{{ downloadSpeed }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <n-icon :component="TimeOutline" size="14" />
                  <span>{{ timeRemaining }}</span>
                </div>
              </div>
            </div>
          </transition-expand>

          <transition-expand>
            <div v-if="hasAudio && showDownloadProgress">
              <n-progress type="line" :percentage="audioDownloadPercentage" indicator-placement="inside" processing
                :color="progressColor" :rail-color="progressRailColor">
                <span class="text-xs">audio {{ audioDownloadPercentage }}%</span>
              </n-progress>
            </div>
          </transition-expand>

          <!-- Action buttons -->
          <div class="pt-2 flex flex-col space-y-2">
            <transition name="fade" mode="out-in">
              <template v-if="!showDownloadProgress">
                <n-button-group>
                  <n-button type="primary" secondary @click="startDownload" class="shadow-sm">
                    <template #icon>
                      <n-icon>
                        <RefreshOutline />
                      </n-icon>
                    </template>
                    Retry
                  </n-button>
                  <n-button type="default" secondary @click="shareDownload" class="shadow-sm">
                    <template #icon>
                      <n-icon>
                        <ShareSocialOutline />
                      </n-icon>
                    </template>
                    Share
                  </n-button>
                </n-button-group>
              </template>

              <template v-else>
                <n-space justify="center">
                  <!-- Pause/Resume Button -->
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button circle :type="downloadStatus === 'paused' ? 'primary' : 'default'"
                        @click="downloadStatus === 'paused' ? resumeDownload() : pauseDownload()">
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

                  <!-- Cancel Button -->
                  <n-popconfirm :positive-text="downloadStatus === 'completed' ? 'Delete' : 'Cancel'"
                    :negative-text="'Cancel'" @positive-click="cancelDownload">
                    <template #trigger>
                      <n-tooltip trigger="hover">
                        <template #trigger>
                          <n-button circle type="error">
                            <template #icon>
                              <n-icon>
                                <TrashOutline />
                              </n-icon>
                            </template>
                          </n-button>
                        </template>
                        {{ downloadStatus === 'completed' ? 'Delete' : 'Cancel' }}
                      </n-tooltip>
                    </template>
                    {{ downloadStatus === 'completed'
                      ? 'Are you sure you want to delete this download?'
                      : 'Are you sure you want to cancel this download?' }}
                  </n-popconfirm>

                  <!-- Show/Hide Progress -->
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button circle type="default" @click="toggleLoader">
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
                </n-space>
              </template>
            </transition>
          </div>
        </div>
      </n-card>

      <!-- Not Found State -->
      <n-card v-else class="max-w-xs mx-auto">
        <n-result status="404" title="Download Not Found" description="The requested download could not be found">
          <template #footer>
            <n-button type="primary" @click="router.back()">
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

// Constants
const STATUS_CONFIG = {
    processing: {
    message: 'Processing',
    icon: PlayOutline,
    type: 'info'
  },
  active: {
    message: 'Downloading',
    icon: PlayOutline,
    type: 'info'
  },
  downloading: {
    message: 'Downloading',
    icon: PlayOutline,
    type: 'info'
  },
  merging: {
    message: 'Merging',
    icon: PlayOutline,
    type: 'info'
  },
  paused: {
    message: 'Paused',
    icon: PauseOutline,
    type: 'warning'
  },
  error: {
    message: 'Error',
    icon: CloseCircleOutline,
    type: 'error'
  },
  completed: {
    message: 'Completed',
    icon: CheckmarkOutline,
    type: 'success'
  },
  default: {
    message: 'Ready',
    icon: DownloadOutline,
    type: 'default'
  }
}

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
  const name = localFileData.value?.filename || localFileData.value?.title || 'Untitled file'
  return name.split('.').slice(0, -1).join('.') || name
})
const fileExtension = computed(() => {
  const ext = localFileData.value?.filename?.split('.').pop() ||
    localFileData.value?.extension ||
    'file'
  return ext.toUpperCase()
})
const formattedFileSize = computed(() => formatFileSize(localFileData.value?.filesize))
const downloadStatus = computed(() => localFileData.value?.status || 'default')
const statusTagType = computed(() => STATUS_CONFIG[downloadStatus.value]?.type || 'default')
const statusIcon = computed(() => STATUS_CONFIG[downloadStatus.value]?.icon || null)
const statusMessage = computed(() => STATUS_CONFIG[downloadStatus.value]?.message || 'Unknown')
const showDownloadProgress = computed(() => ['active', 'paused', 'downloading', 'merging'].includes(downloadStatus.value))
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
  return speed ? `${speed} MB/s` : '0 KB/s'
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
const hasAudio = (() => localFileData.value?.hasAudio || false)

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

const startDownload = async () => {
  try {
    message.loading('Starting download...')
    await downloadStore.download_file('inst/Nick/download', props.id, localFileData.value?.url)
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