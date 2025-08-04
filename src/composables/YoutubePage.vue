<template>
  <div v-if="!currentId && !currentListId">
    <n-space vertical align="center" class="p-6 min-h-screen ">
      <n-card title="🎵 YouTube Downloader"
        class="w-full max-w-xl shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl" :bordered="false">
        <div class="flex justify-between items-center mb-4">
          <n-text class="text-gray-600">Download mode:</n-text>
          <n-switch v-model:value="isMix" size="medium" :rail-style="railStyle" class="ml-2">
            <template #icon>
              Z
            </template>
            <template #checked>
              <span class="font-medium">Single Track</span>
            </template>
            <template #unchecked>
              <span class="font-medium">Playlist/Mix</span>
            </template>
          </n-switch>
        </div>
        <Transition name="fade-slide" mode="out-in">
          <div :key="isMix ? 'playlist' : 'single'" class="mt-2">
            <n-spin :show="show" :description="loadingDescription">
              <n-space vertical :size="20">
                <n-input v-model:value="currentUrl"
                  :placeholder="isMix ? 'Paste playlist URL...' : 'Paste video URL...'" clearable size="large"
                  @keydown.enter="handleDownload" class="input-focus">
                  <template #prefix>
                    <n-icon :component="LinkOutline" />
                  </template>
                </n-input>

                <n-button type="primary" :loading="show" :disabled="!currentUrl.trim() || show" @click="handleDownload"
                  size="large" block class="transition-transform hover:scale-[1.01]">
                  {{ show ? 'Downloading...' : 'Download' }}
                </n-button>
              </n-space>
            </n-spin>
          </div>
        </Transition>
      </n-card>

      <Transition name="fade-slide">
        <n-result v-if="initialized" status="success" title="Download Initialized"
          description="Your media has been successfully initiliazed!" class="mt-6 max-w-xl">
          <!-- <template #footer>
          <n-button type="primary" @click="resetForm">
            Download Another
          </n-button>
        </template> -->
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
import { ref, computed } from 'vue'
import { LinkOutline } from '@vicons/ionicons5'
import router from '../router'
import { generateUUID } from '../reusables'
import { useRoute } from 'vue-router'
import { useStateStore } from '../store/stateStore'
const stateStore = useStateStore()
const route = useRoute()

const url = ref('')
const playlistUrl = ref('')
const initialized = ref(false)
const show = ref(false)
const isMix = ref(false)
const loadingDescription = ref('Processing your request...')
const currentId = computed(() => route.params.id || null)
const currentListId = computed(() => route.params.list_id || null)

const currentUrl = computed({
  get: () => isMix.value ? playlistUrl.value : url.value,
  set: (value) => isMix.value ? playlistUrl.value = value : url.value = value
})

const railStyle = ({ focused, checked }) => ({
  background: checked ? 'var(--primary-color)' : 'var(--error-color)',
  opacity: focused ? 0.8 : 1
})

const handleDownload = async () => {
  if (!currentUrl.value.trim()) return

  show.value = true
  initialized.value = false
  loadingDescription.value = isMix.value
    ? 'Processing playlist...'
    : 'Extracting video...'

  // Simulate download delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  initialized.value = true
  show.value = false
  setTimeout(() => {
    const id = generateUUID()
    stateStore.addTask({ name: "Song", id: id, url:isMix.value?`/h/yt/list/${id}`: `/h/yt/${id}` })

    isMix.value ? router.push(`/h/yt/list/${id}`) : router.push(`/h/yt/${id}`);

  }, 1000);
}

const resetForm = () => {
  initialized.value = false
  url.value = ''
  playlistUrl.value = ''
}
</script>

<style scoped>
.input-focus:focus-within {
  box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.2);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>