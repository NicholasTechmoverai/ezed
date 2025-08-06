<template>
  <div class="max-w-4xl mx-auto p-4 space-y-6">
    <!-- Header Section -->
    <!-- <div class="flex items-center gap-4">
      <n-button circle @click="$router.back()">
        <template #icon>
          <n-icon><ArrowBackOutline /></n-icon>
        </template>
</n-button>
<n-h1 class="!mb-0">Download Details</n-h1>
</div> -->

    <!-- Main Card with Skeleton Loading -->
    <n-card :bordered="false" class="shadow-sm">
      <template v-if="loading">
        <n-skeleton height="40px" width="30%" class="mb-6" />
        <n-skeleton height="24px" width="60%" class="mb-8" />

        <div class="space-y-4 mb-8">
          <n-skeleton height="16px" width="20%" />
          <n-skeleton height="12px" :sharp="false" />
          <n-skeleton height="12px" width="70%" />
        </div>

        <div class="flex flex-col lg:flex-row gap-6 mb-8">
          <n-skeleton height="200px" width="100%" class="lg:w-1/3" />
          <div class="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <n-skeleton v-for="i in 4" :key="i" height="160px" />
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <n-skeleton v-for="i in 3" :key="i" height="36px" width="100px" />
        </div>
      </template>

      <template v-else-if="!downloadData">
        <n-empty description="Download not found" class="py-12">
          <template #extra>
            <n-button @click="$router.push('/h/downloads')">
              Go to Downloads
            </n-button>
          </template>
        </n-empty>
      </template>

      <template v-else>
        <!-- Status and Time Section -->
        <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div class="flex items-center gap-3">
            <n-tag :type="statusTagType" round size="large">
              <template #icon>
                <n-icon :component="statusIcon" />
              </template>
              {{ statusMessage }}
            </n-tag>
            <n-text depth="3" class="text-sm">
              {{ formatDistanceToNow(downloadData?.updatedAt || downloadData?.timestamp) }}
            </n-text>
          </div>
          <div class="flex gap-2">
            <n-text depth="3" class="text-sm">
              <n-icon :component="CalendarOutline" class="mr-1" />
              Started: {{ startTime }}
            </n-text>
            <n-text v-if="endTime" depth="3" class="text-sm">
              <n-icon :component="TimeOutline" class="mr-1" />
              Completed: {{ endTime }}
            </n-text>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="mb-6 space-y-2">
          <div class="flex justify-between items-center">
            <n-text strong>Download Progress</n-text>
            <!-- <n-text>{{ downloadPercentage }}%</n-text> -->
          </div>
          <n-progress type="line" :percentage="downloadPercentage"
            :status="downloadStatus === 'error' ? 'error' : undefined" :height="12" :border-radius="6" processing />

          <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{{ formatFileSize(downloadedSize) }} of {{ formattedFileSize }}</span>
            <span>{{ remainingSizeFormatted }} remaining</span>
          </div>
        </div>

        <!-- File Preview and Metadata -->
        <div class="flex flex-col lg:flex-row gap-6 mb-6">
          <!-- Thumbnail Preview -->
          <div class="w-full lg:w-1/3">
            <n-image :src="fileThumbnail" :fallback-src="defaultThumbnail"
              class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 !max-h-[450px]"
              object-fit="cover" preview-disabled />
            <div class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              <n-ellipsis class="max-w-[180px]">{{ fileName }}</n-ellipsis> • {{ fileExtension }}
            </div>
          </div>

          <!-- Detailed Metadata -->
          <div class="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Download Stats -->
            <n-card embedded class="metadata-card">
              <h3 class="metadata-title">
                <n-icon :component="StatsChartOutline" class="mr-2" />
                Download Statistics
              </h3>
              <div class="metadata-item">
                <span>Speed:</span>
                <span>{{ downloadSpeed }}</span>
              </div>
              <div class="metadata-item">
                <span>Time Remaining:</span>
                <span>{{ timeRemaining }}</span>
              </div>
              <div class="metadata-item">
                <span>Estimated Finish:</span>
                <span>{{ estimatedFinishTime }}</span>
              </div>
              <div class="metadata-item">
                <span>Duration:</span>
                <span>{{ downloadDuration }}</span>
              </div>
            </n-card>

            <!-- File Details -->
            <n-card embedded class="metadata-card">
              <h3 class="metadata-title">
                <n-icon :component="DocumentTextOutline" class="mr-2" />
                File Details
              </h3>
              <div class="metadata-item">
                <span>Name:</span>
                <n-ellipsis class="max-w-[180px]">{{ fileName }}</n-ellipsis>
              </div>
              <div class="metadata-item">
                <span>Type:</span>
                <span>{{ fileType }} ({{ fileExtension }})</span>
              </div>
              <div class="metadata-item">
                <span>Size:</span>
                <span>{{ formattedFileSize }}</span>
              </div>
              <div class="metadata-item">
                <span>Location:</span>
                <span>{{ filePath || downloadStatus === 'completed' ? 'downloads' : 'Not saved yet' }}</span>
              </div>
            </n-card>

            <!-- Technical Info -->
            <n-card embedded class="metadata-card">
              <h3 class="metadata-title">
                <n-icon :component="InformationCircleOutline" class="mr-2" />
                Technical Information
              </h3>
              <div class="metadata-item">
                <span>Resolution:</span>
                <span>{{ resolution || 'Unknown' }}</span>
              </div>
              <div class="metadata-item">
                <span>Bitrate:</span>
                <span>{{ bitrate || 'Unknown' }}</span>
              </div>
              <div class="metadata-item">
                <span>Codec:</span>
                <span>{{ codec || 'Unknown' }}</span>
              </div>
              <div class="metadata-item">
                <span>FPS:</span>
                <span>{{ fps || 'Unknown' }}</span>
              </div>
            </n-card>

            <!-- System Info -->
            <n-card embedded class="metadata-card">
              <h3 class="metadata-title">
                <n-icon :component="HardwareChipOutline" class="mr-2" />
                System Information
              </h3>
              <div class="metadata-item">
                <span>Download ID:</span>
                <n-ellipsis class="max-w-[150px]">{{ currentId }}</n-ellipsis>
              </div>
              <div class="metadata-item">
                <span>Network:</span>
                <span>{{ networkType || 'Unknown' }}</span>
              </div>
              <div class="metadata-item">
                <span>Storage:</span>
                <span>{{ storageLocation }}</span>
              </div>
              <div class="metadata-item">
                <span>Last Updated:</span>
                <span>{{ lastUpdatedTime }}</span>
              </div>
            </n-card>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 justify-end border-t pt-4">
          <!-- For active downloads -->
          <template v-if="isActiveDownload">
            <n-button type="warning" secondary @click="pauseDownload" v-if="downloadStatus === 'downloading'">
              <template #icon>
                <n-icon>
                  <PauseCircleOutline />
                </n-icon>
              </template>
              Pause
            </n-button>

            <n-button type="primary" @click="resumeDownload" v-if="downloadStatus === 'paused'">
              <template #icon>
                <n-icon>
                  <PlayCircleOutline />
                </n-icon>
              </template>
              Resume
            </n-button>

            <n-button type="error" secondary @click="cancelDownload">
              <template #icon>
                <n-icon>
                  <CloseCircleOutline />
                </n-icon>
              </template>
              Cancel
            </n-button>
          </template>

          <!-- For completed downloads -->
          <template v-if="downloadStatus === 'completed'">
            <!-- <n-button type="primary" @click="openFile">
              <template #icon>
                <n-icon>
                  <OpenOutline />
                </n-icon>
              </template>
    Open File
    </n-button>

    <n-button secondary @click="showInFolder">
      <template #icon>
                <n-icon>
                  <FolderOpenOutline />
                </n-icon>
              </template>
      Show in Folder
    </n-button> -->

            <n-button type="error" secondary @click="delete_File">
              <template #icon>
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </template>
              Delete
            </n-button>
            <n-button secondary @click="retryDownload">
              <template #icon>
                <n-icon>
                  <RefreshOutline />
                </n-icon>
              </template>
              Retry Download
            </n-button>
          </template>

          <!-- For failed downloads -->
          <template v-if="downloadStatus === 'error'">
            <n-button type="primary" @click="retryDownload">
              <template #icon>
                <n-icon>
                  <RefreshOutline />
                </n-icon>
              </template>
              Retry Download
            </n-button>

            <n-button type="error" secondary @click="deleteDownload">
              <template #icon>
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </template>
              Delete Record
            </n-button>
          </template>

          <!-- Always available -->
          <n-button secondary @click="copyDetails">
            <template #icon>
              <n-icon>
                <CopyOutline />
              </n-icon>
            </template>
            Copy Info
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDownloadStore } from '@/store/downloadStore'
import { formatDistanceToNow } from 'date-fns'

import {
  ArrowBackOutline,
  PlayCircleOutline,
  PauseCircleOutline,
  CloseCircleOutline,
  RefreshOutline,
  OpenOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
  TimeOutline,
  CalendarOutline,
  StatsChartOutline,
  DocumentTextOutline,
  InformationCircleOutline,
  HardwareChipOutline,
  FolderOpenOutline,
  TrashOutline,
  CopyOutline
} from '@vicons/ionicons5'
import defaultThumbnail from "@/assets/defaultThumbnail.png"
import { deleteFile, getFile } from '../db/download'
import { useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const downloadStore = useDownloadStore()
const message = useMessage()

const currentId = computed(() => route.params.id)
const downloadData = ref(null)
const loading = ref(true)

// Status configuration
const statusConfig = {
  downloading: {
    message: 'Downloading',
    icon: TimeOutline,
    type: 'info'
  },
  paused: {
    message: 'Paused',
    icon: PauseCircleOutline,
    type: 'warning'
  },
  error: {
    message: 'Failed',
    icon: AlertCircleOutline,
    type: 'error'
  },
  completed: {
    message: 'Completed',
    icon: CheckmarkCircleOutline,
    type: 'success'
  }
}

// Load data from store
const loadData = async () => {
  if (!currentId.value) return
  try {
    // Check ongoing downloads first
    if (downloadStore.onGoingDownloads[currentId.value]) {
      downloadData.value = downloadStore.onGoingDownloads[currentId.value]
      return
    }

    // Fallback to completed downloads
    const completedDownload = await getFile(currentId.value)
    if (completedDownload) {
      downloadData.value = {
        ...completedDownload,
        status: 'completed'
      }
    }
  } catch (error) {
    console.error('Error loading download data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// Watch for changes in ongoing downloads
watch(
  () => downloadStore.onGoingDownloads[currentId.value],
  (newValue) => {
    if (newValue) {
      downloadData.value = newValue
    }
  },
  { deep: true }
)

// Computed properties
const statusTagType = computed(() => statusConfig[downloadStatus.value]?.type || 'default')
const statusIcon = computed(() => statusConfig[downloadStatus.value]?.icon || null)
const statusMessage = computed(() => statusConfig[downloadStatus.value]?.message || 'Pending')

const fileThumbnail = computed(() => downloadData.value?.thumbnail || defaultThumbnail)
const fileName = computed(() => downloadData.value?.filename || 'Untitled file')
const fileExtension = computed(() => {
  const name = fileName.value
  return name.includes('.') ? name.split('.').pop().toLowerCase() : 'file'
})
const fileType = computed(() => {
  const ext = fileExtension.value
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'Video'
  if (['mp3', 'wav', 'aac'].includes(ext)) return 'Audio'
  if (['jpg', 'png', 'gif', 'webp'].includes(ext)) return 'Image'
  if (['pdf', 'doc', 'docx'].includes(ext)) return 'Document'
  return 'File'
})

const fileSize = computed(() => downloadData.value?.filesize || 0)
const formattedFileSize = computed(() => formatFileSize(fileSize.value))
const downloadedSize = computed(() => downloadData.value?.downloadedSize || 0)
const remainingSize = computed(() => Math.max(0, fileSize.value - downloadedSize.value))
const remainingSizeFormatted = computed(() => formatFileSize(remainingSize.value))

const downloadPercentage = computed(() => {
  if (fileSize.value <= 0) return 0
  return Math.min(100, Math.round((downloadedSize.value / fileSize.value) * 100))
})

const downloadStatus = computed(() => downloadData.value?.status || 'pending')
const isActiveDownload = computed(() => ['downloading', 'paused'].includes(downloadStatus.value))

const downloadSpeed = computed(() => {
  const speed = downloadData.value?.downloadSpeed || 0
  return speed > 0 ? `${(speed / 1024 / 1024).toFixed(2)} MB/s` : '0 KB/s'
})

const timeRemaining = computed(() => {
  if (!isActiveDownload.value) return '--:--'
  if (!downloadData.value?.eta) return 'Calculating...'
  return downloadData.value.eta
})

const estimatedFinishTime = computed(() => {
  if (!isActiveDownload.value) return 'N/A'
  const now = new Date()
  const minutes = parseInt(timeRemaining.value) || 0
  now.setMinutes(now.getMinutes() + minutes)
  return now.toLocaleTimeString()
})

const startTime = computed(() => {
  const timestamp = downloadData.value?.timestamp
  return timestamp ? new Date(timestamp).toLocaleString() : 'N/A'
})

const endTime = computed(() => {
  const timestamp = downloadData.value?.completedAt
  return timestamp ? new Date(timestamp).toLocaleString() : null
})

const lastUpdatedTime = computed(() => {
  const timestamp = downloadData.value?.updatedAt || downloadData.value?.timestamp
  return timestamp ? new Date(timestamp).toLocaleTimeString() : 'N/A'
})



const downloadDuration = computed(() => {
  const start = downloadData.value?.timestamp
  if (!start) return 'N/A'

  const end = downloadData.value?.completedAt || Date.now()
  const seconds = Math.floor((end - start) / 1000)

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours ? `${hours}h ` : ''}${minutes ? `${minutes}m ` : ''}${secs}s`
})

const resolution = computed(() => downloadData.value?.resolution || 'Unknown')
const bitrate = computed(() => downloadData.value?.bitrate || 'Unknown')
const codec = computed(() => downloadData.value?.codec || 'Unknown')
const fps = computed(() => downloadData.value?.fps || 'Unknown')
const filePath = computed(() => downloadData.value?.path)
const networkType = computed(() => downloadData.value?.networkType || 'Unknown')
const storageLocation = computed(() => {
  if (downloadStatus.value === 'completed') return 'Local storage'
  if (isActiveDownload.value) return 'Temporary storage'
  return 'Not stored'
})

// Helper functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`
}

// Actions
const retryDownload = async () => {
  message.loading(`Retrying download ${downloadData.value.filename}`)
  const r = await downloadStore.download_file('inst/Nick/download', downloadData.value.id, downloadData.value.url)
  if (r) message.info(r)
}
const pauseDownload = () => downloadStore.pauseDownload(currentId.value)
const resumeDownload = () => downloadStore.resumeDownload(currentId.value)
const cancelDownload = () => downloadStore.cancelDownload(currentId.value)

const openFile = () => {
  if (filePath.value) {
    // Implementation to open the file using system default app
    console.log('Opening file:', filePath.value)
  }
}

const showInFolder = () => {
  if (filePath.value) {
    // Implementation to reveal file in system file explorer
    console.log('Showing in folder:', filePath.value)
  }
}

const delete_File = async () => {
  try {

    await deleteFile(currentId.value)
    message.success(`${downloadData.value.filename} has been deleted!`)
    router.push('/h/downloads')
  } catch (error) {
    console.error('Error deleting file:', error)
    message.error('Error deleting file:', error)

  }
}

const deleteDownload = async () => {
  try {
    await deleteFile(currentId.value)
    message.success(`${downloadData.value.filename} has been deleted!`)
    router.push('/h/downloads')
  } catch (error) {
    console.error('Error deleting download:', error)
    message.error('Error deleting download:', error)

  }
}

const copyDetails = () => {
  const details = `
    File: ${fileName.value}
    Status: ${statusMessage.value}
    Size: ${formattedFileSize.value}
    Progress: ${downloadPercentage.value}%
    Downloaded: ${formatFileSize(downloadedSize.value)}
    Remaining: ${remainingSizeFormatted.value}
    Speed: ${downloadSpeed.value}
    Time Remaining: ${timeRemaining.value}
  `
  navigator.clipboard.writeText(details.trim())
}
</script>

<!-- <style scoped>
.metadata-card {
  @apply p-4 rounded-lg border border-gray-200 dark:border-gray-700;
}

.metadata-title {
  @apply flex items-center text-base font-medium mb-3 text-gray-800 dark:text-gray-200;
}

.metadata-item {
  @apply flex justify-between py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0;
}

.metadata-item span:first-child {
  @apply text-gray-500 dark:text-gray-400;
}

.metadata-item span:last-child {
  @apply text-gray-800 dark:text-gray-200 font-medium;
}
</style> -->