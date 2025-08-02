<template>
  <n-card
    hoverable
    :bordered="false"
    class="max-w-[340px] transition-all duration-300 hover:shadow-lg"
    :content-style="{ padding: 0 }"
  >
    <div class="flex flex-col items-center p-4">
      <!-- Thumbnail with interactive progress -->
      <div class="relative w-full aspect-square mb-4 group" @click="toggleLoader">
        <n-image
          :src="thumbnail"
          :fallback-src="fallbackImage"
          class="w-full h-full object-contain rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
          preview-disabled
        >
          <template #error>
            <div class="w-full h-full bg-[#f5f5f5] dark:bg-[#1a1a1a] flex items-center justify-center rounded-lg">
              <n-icon size="48" :component="ImageOutline" />
            </div>
          </template>
        </n-image>

        <transition name="fade">
          <div
            v-if="isLoaderActive"
            class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg backdrop-blur-[1px]"
          >
            <n-progress
              type="multiple-circle"
              :stroke-width="6"
              :circle-gap="2"
              :percentage="progressValues"
              :color="progressColors"
              :rail-style="railStyles"
              :show-indicator="false"
              class="scale-90"
            />
          </div>
        </transition>

        <transition name="slide-up">
          <n-badge
            v-if="isLoaderActive"
            :value="`${activePercentage}%`"
            :type="downloadStatus === 'error' ? 'error' : 'info'"
            class="absolute -bottom-3 left-1/2 transform -translate-x-1/2 transition-all"
          />
        </transition>
      </div>

      <!-- File info -->
      <div class="w-full text-center px-2">
        <n-ellipsis class="text-lg font-medium text-gray-900 dark:text-gray-100">
          {{ name || 'Untitled file' }}
        </n-ellipsis>
        <n-text depth="3" class="text-sm">
          {{ formattedFileSize }} • {{ fileExtension }}
        </n-text>
      </div>

      <!-- Download controls -->
      <div class="w-full mt-6 space-y-3">
        <transition-expand>
          <div v-if="showDownloadProgress" class="space-y-2">
            <n-progress
              type="line"
              :percentage="downloadPercentage"
              :color="progressColor"
              :rail-color="changeColor(progressColor, { alpha: 0.2 })"
              :height="10"
              :border-radius="5"
              :indicator-placement="downloadPercentage > 10 ? 'inside' : 'none'"
              :status="downloadStatus"
            >
              <template v-if="downloadPercentage > 10" #default>
                <span class="text-xs text-white font-medium">
                  {{ statusMessages[downloadStatus] }} {{ downloadPercentage }}%
                </span>
              </template>
            </n-progress>

            <n-space justify="space-between" class="text-xs" :size="0">
              <n-text depth="3">{{ downloadSpeed }}</n-text>
              <n-text depth="3">{{ timeRemaining }}</n-text>
            </n-space>
          </div>
        </transition-expand>

        <n-space justify="center" class="mt-2" :size="12">
          <template v-if="!showDownloadProgress">
            <n-button
              type="primary"
              size="small"
              @click="startDownload"
              class="min-w-[100px]"
            >
              Download
            </n-button>
            <n-button
              size="small"
              secondary
              @click="toggleLoader"
            >
              {{ isLoaderActive ? 'Hide' : 'Show' }} Progress
            </n-button>
          </template>

          <template v-else>
            <n-button
              v-if="downloadStatus === 'paused'"
              type="primary"
              size="small"
              @click="resumeDownload"
              class="min-w-[100px]"
            >
              <template #icon>
                <n-icon><PlayCircleOutline /></n-icon>
              </template>
              Resume
            </n-button>
            <n-button
              v-else-if="downloadStatus === 'active'"
              type="warning"
              size="small"
              secondary
              @click="pauseDownload"
              class="min-w-[100px]"
            >
              <template #icon>
                <n-icon><PauseCircleOutline /></n-icon>
              </template>
              Pause
            </n-button>
            <n-button
              type="error"
              size="small"
              secondary
              @click="cancelDownload"
              class="min-w-[100px]"
            >
              <template #icon>
                <n-icon><CloseCircleOutline /></n-icon>
              </template>
              Cancel
            </n-button>
          </template>
        </n-space>
      </div>
    </div>
  </n-card>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useThemeVars } from 'naive-ui'
import { 
  ImageOutline,
  PlayCircleOutline,
  PauseCircleOutline,
  CloseCircleOutline
} from '@vicons/ionicons5'

const props = defineProps({
  name: {
    type: String,
    default: 'Untitled file'
  },
  id: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    default: 'file'
  },
  initialStatus: {
    type: String,
    default: 'idle',
    validator: (value) => ['idle', 'active', 'paused', 'completed', 'error'].includes(value)
  }
})

const emit = defineEmits([
  'download-start',
  'download-pause',
  'download-resume',
  'download-cancel',
  'download-complete',
  'status-change'
])

const themeVars = useThemeVars()
const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNODAgNzBMNjAgOTBNMTQwIDkwTDEyMCA3ME04MCAxMzBMNjAgMTEwTTE0MCAxMTBMMTIwIDEzME0xMDAgNTJWMTUwTTUwIDEwMEgxNTBNMTAwIDUwTDEzMCA4ME03MCA4MEwxMDAgNTBNMTAwIDE1MEw3MCAxMjBNMTMwIDEyMEwxMDAgMTUwIiBzdHJva2U9IiNEMEQwRDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+'

// State
const percentage = ref(0)
const downloadPercentage = ref(0)
const showDownloadProgress = ref(false)
const isLoaderActive = ref(true)
const downloadSpeed = ref('0 KB/s')
const timeRemaining = ref('--')
const downloadStatus = ref(props.initialStatus)
const downloadIntervals = ref([])

const statusMessages = {
  idle: 'Ready',
  active: 'Downloading',
  paused: 'Paused',
  completed: 'Completed',
  error: 'Failed'
}

// Computed
const progressValues = computed(() => [
  percentage.value,
  (percentage.value + 15) % 100,
  (percentage.value + 30) % 100,
  (percentage.value + 45) % 100
])

const progressColors = computed(() => [
  themeVars.value.infoColor,
  themeVars.value.successColor,
  themeVars.value.warningColor,
  themeVars.value.errorColor
])

const railStyles = computed(() => [
  { stroke: themeVars.value.infoColor, opacity: 0.2 },
  { stroke: themeVars.value.successColor, opacity: 0.2 },
  { stroke: themeVars.value.warningColor, opacity: 0.2 },
  { stroke: themeVars.value.errorColor, opacity: 0.2 }
])

const activePercentage = computed(() => Math.floor(percentage.value))

const formattedFileSize = computed(() => {
  if (props.size < 1024) return `${props.size} B`
  if (props.size < 1024 * 1024) return `${(props.size / 1024).toFixed(1)} KB`
  return `${(props.size / (1024 * 1024)).toFixed(1)} MB`
})

const fileExtension = computed(() => {
  return props.type.split('/')[1]?.toUpperCase() || 'FILE'
})

const progressColor = computed(() => {
  switch(downloadStatus.value) {
    case 'error': return themeVars.value.errorColor
    case 'completed': return themeVars.value.successColor
    case 'paused': return themeVars.value.warningColor
    default: return themeVars.value.primaryColor
  }
})

// Methods
const clearIntervals = () => {
  downloadIntervals.value.forEach(interval => clearInterval(interval))
  downloadIntervals.value = []
}

const toggleLoader = () => {
  isLoaderActive.value = !isLoaderActive.value
}

const updateStatus = (status) => {
  downloadStatus.value = status
  emit('status-change', status)
}

const startDownload = () => {
  if (downloadStatus.value === 'active') return
  
  updateStatus('active')
  emit('download-start', props.id)
  showDownloadProgress.value = true
  downloadPercentage.value = downloadStatus.value === 'paused' ? downloadPercentage.value : 0
  
  const speedInterval = setInterval(() => {
    downloadSpeed.value = `${(200 + Math.random() * 800).toFixed(0)} KB/s`
  }, 800)
  downloadIntervals.value.push(speedInterval)
  
  const downloadInterval = setInterval(() => {
    if (downloadStatus.value !== 'active') return
    
    if (downloadPercentage.value >= 100) {
      updateStatus('completed')
      emit('download-complete', props.id)
      clearIntervals()
      downloadSpeed.value = 'Completed'
      timeRemaining.value = 'Done'
      setTimeout(() => {
        showDownloadProgress.value = false
      }, 2000)
      return
    }
    
    const increment = 0.5 + Math.random() * 4
    downloadPercentage.value = Math.min(downloadPercentage.value + increment, 100)
    
    const remaining = (100 - downloadPercentage.value) / increment * 0.3
    timeRemaining.value = remaining > 60 
      ? `${Math.floor(remaining / 60)}m ${Math.floor(remaining % 60)}s` 
      : `${Math.floor(remaining)}s`
  }, 300)
  downloadIntervals.value.push(downloadInterval)
}

const pauseDownload = () => {
  updateStatus('paused')
  emit('download-pause', props.id)
  clearIntervals()
  downloadSpeed.value = 'Paused'
}

const resumeDownload = () => {
  updateStatus('active')
  emit('download-resume', props.id)
  startDownload()
}

const cancelDownload = () => {
  updateStatus('idle')
  emit('download-cancel', props.id)
  clearIntervals()
  showDownloadProgress.value = false
  downloadPercentage.value = 0
  downloadSpeed.value = '0 KB/s'
  timeRemaining.value = '--'
}

const changeColor = (color, options = { alpha: 1 }) => {
  return color.replace(/rgb\((.*)\)/, `rgba($1, ${options.alpha})`)
}

// Animation
const animationInterval = setInterval(() => {
  percentage.value = (percentage.value + 0.5) % 100
}, 50)

// Cleanup
onUnmounted(() => {
  clearInterval(animationInterval)
  clearIntervals()
})
</script>

<style scoped>
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
  transform: translateY(10px) translateX(-50%);
}

.expand-enter-active,
.expand-leave-active {
  transition: height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.group:hover .n-image {
  transform: scale(1.02);
  transition: transform 0.3s ease;
}

.n-button {
  transition: all 0.2s ease;
}

.n-button:hover {
  transform: translateY(-1px);
}
</style>