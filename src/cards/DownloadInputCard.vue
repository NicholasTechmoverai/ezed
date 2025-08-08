<template>
  <div v-if="!currentId">
    <n-space vertical align="center" class="p-6">
      <n-card :title="`📥${d_type}  Downloader`"
        class="w-full max-w-xl shadow-md hover:shadow-lg transition-shadow duration-300">
        <n-spin :show="isLoading" :description="loadingDescription">
          <n-space vertical :size="16">
            <n-input v-model:value="url" :placeholder="`Paste ${d_type} URL here...`" clearable :disabled="isLoading"
              @keydown.enter="handleDownload" />
            <n-button type="primary" :loading="isLoading" :disabled="!isValidUrl || isLoading" @click="handleDownload"
              block class="transition-colors">
              {{ isLoading ? 'Downloading...' : 'Download' }}
            </n-button>
          </n-space>
        </n-spin>
      </n-card>

      <Transition enter-active-class="transition-transform transition-opacity duration-600 ease-out"
        enter-from-class="translate-y-5 opacity-0" enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-transform transition-opacity duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-4 opacity-0">
        <n-result v-if="downloadComplete" status="success" title="Download Started!"
          description="Your media is being downloaded." class="mt-6 ">
          <template #footer>
            <n-text depth="3" class="text-sm">
              The download should begin automatically. If not, check your browser's download settings.
            </n-text>
          </template>
        </n-result>
      </Transition>
    </n-space>
  </div>
  <div v-else>
    <Transition enter-active-class="transition-transform transition-opacity duration-600 ease-out"
      enter-from-class="translate-x-10 opacity-0" enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition-transform transition-opacity duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100" leave-to-class="translate-x-4 opacity-0">
      <router-view />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { generateUUID } from '../reusables'
import { useStateStore } from '../store/stateStore'
import api from '../api'
import { useDownloadStore } from '../store/downloadStore'
import { saveFile } from '../db/download'
import { useMessage } from 'naive-ui'

const props = defineProps({
  d_type: {
    type: String,
    required: true,
  },
  abb_r: {
    type: String,
    default: '',
  },
})

const stateStore = useStateStore()
const router = useRouter()
const route = useRoute()
const downloadStore = useDownloadStore()
const message = useMessage()

const url = ref('')
const error = ref(null)
const downloadComplete = ref(false)
const isLoading = ref(false)
const loadingDescription = ref('Processing your request...')

const currentId = computed(() => route.params.id || null)
const isValidUrl = computed(() => {
  const value = (url.value || '').trim()
  return value !== '' && value.includes(`${props.d_type}.com`)
})


async function handleDownload() {
  if (!isValidUrl.value || isLoading.value) return

  isLoading.value = true
  downloadComplete.value = false
  const username = "Nick"
 
  try {
    error.value = null
    const id = generateUUID()
   // Initialize the download entry immediately
    downloadStore.onGoingDownloads[id] = {
      status: "starting",
      progress: 0
    }


    const unwatch = watch(
      () => downloadStore.onGoingDownloads[id]?.status,
      (newStatus) => {
        if (newStatus === "downloading") {
          isLoading.value = false
          downloadComplete.value = true

          stateStore.addTask({ name: `${props.abb_r}:${id}`, id: id, url: `/h/${props.abb_r}/${id}` })
          unwatch() // Stop watching after navigation
          setTimeout(() => {
            router.push(`/h/${props.abb_r}/${id}`)
            downloadComplete.value = false
            // url.value = null
          }, 1200);
        }
      }
    )

    // Start the download
    await downloadStore.download_file(`${props.abb_r}/${username}/download`, id, url.value)
    await saveFile(id, {url:url.value,startTime:Date.now()})

  } catch (err) {
    error.value = 'Failed to start download.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.n-card {
  border-radius: 12px;
}

.n-input {
  transition: border-color 0.3s ease;
}
</style>