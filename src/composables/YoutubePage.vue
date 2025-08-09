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
            <n-spin :show="isLoading" :description="loadingDescription">
              <n-space vertical :size="20">
                <n-input v-model:value="currentUrl"
                  :placeholder="isMix ? 'Paste playlist URL...' : 'Paste video URL...'" clearable size="large"
                  @keydown.enter="handleDownload" class="input-focus">
                  <template #prefix>
                    <n-icon :component="LinkOutline" />
                  </template>
                </n-input>

                <n-button type="primary" :loading="isLoading" :disabled="!isValidUrl || isLoading"
                  @click="handleDownload" size="large" block class="transition-transform hover:scale-[1.01]">
                  {{ isLoading ? (isMix ? 'Getting Songs...' : 'Downloading...') : (isMix ? 'Get Songs' : 'Download') }}
                </n-button>
              </n-space>
            </n-spin>
          </div>
        </Transition>
      </n-card>

      <n-dropdown trigger="hover" :options="formats" @select="handleSelect">
        <n-button>{{ showFormat.label }}</n-button>
      </n-dropdown>

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
import { ref, computed, watch } from 'vue'
import { LinkOutline } from '@vicons/ionicons5'
import router from '../router'
import { generateUUID } from '../reusables'
import { useRoute } from 'vue-router'
import { useStateStore } from '../store/stateStore'
import { useDownloadStore } from '../store/downloadStore'
import { saveFile } from '../db/download'
import { useMessage } from 'naive-ui'
import { normalizeYouTubeUrl } from '../utils/others'

const stateStore = useStateStore()
const route = useRoute()
const downloadStore = useDownloadStore()
const message = useMessage()

const url = ref('')
const playlistUrl = ref('')
const initialized = ref(false)
const isLoading = ref(false)
const isMix = ref(false)
const loadingDescription = ref('Processing your request...')
const currentId = computed(() => route.params.id || null)
const currentListId = computed(() => route.params.list_id || null)
const abb_r = ref('yt')
const error = ref(null)
const itag = ref('18')
const isValidUrl = ref(false)

const currentUrl = computed({
  get: () => isMix.value ? playlistUrl.value : url.value,
  set: (value) => isMix.value ? playlistUrl.value = value : url.value = value
})

const railStyle = ({ focused, checked }) => ({
  background: checked ? 'var(--primary-color)' : 'var(--error-color)',
  opacity: focused ? 0.8 : 1
})

const handleSelect = (key) => {
  itag.value = key
}

const formats = [
  // WebM (VP9) + Audio 140 (Best Quality)
  { label: '2160p (4K WebM)', key: '313+140' },
  { label: '1440p (WebM)', key: '272+251' },
  { label: '1080p (WebM)', key: '248+140' },
  { label: '720p (WebM)', key: '247+140' },
  { label: '480p (WebM)', key: '244+140' },
  { label: '360p (MP4 - Single File)', key: '18' },
  { label: 'mp3 (audio)', key: '140' },
];

watch(
  [url, () => isMix.value],
  ([newUrl, mixFlag]) => {
    const urlStr = String(newUrl || '').trim(); // always a string
    let valid = false;

    if (urlStr.includes('yout')) {
      valid = true;
      const normalized = normalizeYouTubeUrl(urlStr);
      console.log(normalized)
      if (normalized !== urlStr) {
        url.value = normalized;
      }
    }

    if (mixFlag) {
      valid = true;
    }

    isValidUrl.value = valid;
  },
  { immediate: true }
);


const showFormat = computed(() => {
  return formats.find(f => f.key === itag.value)
    || formats.find(f => f.key === '18')
})



async function handleDownload() {
  if (!isValidUrl.value || isLoading.value) return message.error("Invalid url for selected section!")
  if (!isMix) {
    ur.value = (url.value || '').trim().split('?list')[0];
  }

  isLoading.value = true
  initialized.value = false
  loadingDescription.value = isMix.value
    ? 'Processing playlist...'
    : 'Extracting video...'
  const username = "Nick"

  try {
    error.value = null
    const id = generateUUID()
    downloadStore.onGoingDownloads[id] = {
      status: "starting",
      progress: 0
    }


    setTimeout(() => {
      isLoading.value = false
      initialized.value = true
      // stateStore.addTask({ name: `${abb_r.value}:${id}`, id: id, url: isMix.value ? `/h/${abb_r.value}/list/${id}` : `/h/${abb_r.value}/${id}` })
      isMix.value ? router.push(`/h/${abb_r.value}/list/${id}`) : router.push(`/h/${abb_r.value}/${id}`);
      resetForm()

    }, 1500);


    if (isMix.value) {
      await saveFile(id, {
        url: url.value,
        startTime: Date.now(),
        islist: true,
      });
      await downloadStore.getListSongs(
        `${abb_r.value}/${username}/list`,
        playlistUrl.value,
        id
      );

    } else {
      downloadStore.get_download_meta(id,url.value, itag.value)

      await saveFile(id, {
        url: url.value,
        itag: itag.value,
        startTime: Date.now(),
        itag: itag.value,
      });
      await downloadStore.download_file(
        `${abb_r.value}/${username}/download`,
        id,
        url.value,
        itag.value
      );
    }

  } catch (err) {
    error.value = 'Failed to start download.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  initialized.value = false
  url.value = ''
  playlistUrl.value = ''
  isLoading.value = false
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