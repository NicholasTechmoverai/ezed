<template>
  <div v-if="!currentId">
    <n-space vertical align="center" class="p-6">
      <n-card title="📥 Instagram Downloader"
        class="w-full max-w-xl shadow-md hover:shadow-lg transition-shadow duration-300">
        <n-spin :show="isLoading" :description="loadingDescription">
          <n-space vertical :size="16">
            <n-input v-model:value="url" placeholder="Paste Instagram URL here..." clearable :disabled="isLoading"
              @keydown.enter="handleDownload" />
            <n-button type="primary" :loading="isLoading" :disabled="!isValidUrl || isLoading" @click="handleDownload"
              block class="transition-colors">
              {{ isLoading ? 'Downloading...' : 'Download' }}
            </n-button>
          </n-space>
        </n-spin>
      </n-card>

      <n-result v-if="downloadComplete" status="success" title="Download Started!"
        description="Your Instagram media is being downloaded." class="mt-6 animate-fade-in">
        <template #footer>
          <n-text depth="3" class="text-sm">
            The download should begin automatically. If not, check your browser's download settings.
          </n-text>
        </template>
      </n-result>
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { generateUUID } from '../reusables'
import { useStateStore } from '../store/stateStore'
const stateStore = useStateStore()
const router = useRouter()
const route = useRoute()

const url = ref('')
const downloadComplete = ref(false)
const isLoading = ref(false)
const loadingDescription = ref('Processing your request...')

const currentId = computed(() => route.path.split('/')[3] || null)
const isValidUrl = computed(() => {
  return url.value.trim() &&
    (url.value.includes('instagram.com') || url.value.includes('instagr.am'))
})

async function handleDownload() {
  if (!isValidUrl.value || isLoading.value) return

  isLoading.value = true
  downloadComplete.value = false

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    downloadComplete.value = true

    // Navigate after showing success message
    setTimeout(() => {
      const id = generateUUID()
      stateStore.addTask({ name: "Song", id: id, url:`/h/inst/${id}`})
      router.push(`/h/inst/${id}`)

    }, 1500)
  } catch (error) {
    console.error('Download failed:', error)
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