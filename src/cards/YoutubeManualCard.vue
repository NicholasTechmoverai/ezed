<template>
    <div>
        <n-space vertical align="center" class="p-6 min-h-screen">
            <n-alert type="info" :show-icon="true" class="w-full max-w-xl">
                <span class="font-bold">Manual Mode:</span>
                Load formats and select the ones that suit you.
                <n-button size="tiny" quaternary @click="active_learn_drawer = true">Learn</n-button>
            </n-alert>

            <n-drawer v-model:show="active_learn_drawer" :width="500" placement="bottom" mask-closable>
                <n-drawer-content title="Manual Mode Details">
                    <p>Here you can select the exact video/audio formats to download.</p>
                </n-drawer-content>
            </n-drawer>

            <n-card title="Get Video Formats" class="w-full max-w-xl mt-4" :bordered="false">
                <n-spin :show="isLoading" :description="loadingDescription">
                    <n-space vertical :size="20">
                        <n-input v-model:value="currentUrl" placeholder="Paste video URL..." clearable size="large"
                            @keydown.enter="getFormats" class="input-focus">
                            <template #prefix><n-icon :component="LinkOutline" /></template>
                        </n-input>

                        <n-button type="primary" :loading="isLoading" :disabled="!isValidUrl || isLoading"
                            @click="getFormats" size="large" block>
                            {{ isLoading ? 'Loading formats...' : 'Load formats' }}
                        </n-button>
                    </n-space>
                </n-spin>
            </n-card>

            <Transition name="scale-fade">
                <n-card v-if="videoInfo" title="Video Info" class="w-full max-w-xl mt-6 cursor-pointer"
                    @click="openDrawer()">
                    <n-space align="center">
                        <n-image :src="videoInfo.thumbnail" width="160" height="50" fit="contain" class="rounded" />
                        <n-space vertical :size="4">
                            <template v-if="videoInfo?.status === 'loading'">
                                <n-skeleton width="160" height="18" />
                                <n-skeleton width="120" height="14" />
                            </template>
                            <template v-else>
                                <n-text strong>{{ videoInfo.title }}</n-text>
                                <n-text depth="2">{{ videoInfo.artist || 'Unknown artist' }}</n-text>
                                <n-text depth="3">Views: {{ videoInfo.views || 'N/A' }}</n-text>
                            </template>
                        </n-space>
                    </n-space>
                </n-card>
            </Transition>

            <!-- MOBILE: bottom drawer -->
            <n-drawer v-if="isMobile" v-model:show="active_drawer" placement="bottom" :height="560" mask-closable
                @after-leave="handleDrawerClose">
                <n-drawer-content :title="videoInfo?.title || 'Available formats'" closable>
                    <template v-if="videoInfo?.status === 'loading'">
                        <n-space vertical :size="16">
                            <n-skeleton height="160px" />
                            <n-skeleton v-for="i in 5" :key="i" height="48px" />
                        </n-space>
                    </template>

                    <template v-else>
                        <n-spin :show="downloading">
                            <n-image v-if="videoInfo.thumbnail" :src="videoInfo.thumbnail" width="100%" height="120"
                                fit="cover" class="mb-4 rounded" />
                            <n-scrollbar style="max-height: 360px;">
                                <n-list bordered>
                                    <n-list-item v-for="fmt in formats" :key="fmt.itag" class="format-item"
                                        @click="selectFormat(fmt)">
                                        <div class="flex justify-between items-center w-full">
                                            <div>
                                                <n-text strong>itag {{ fmt.itag }}</n-text>
                                                <div class="text-sm text-muted">{{ convertResolution(fmt.resolution) ||
                                                    'N/A' }} • {{ fmt.ext }}</div>
                                            </div>
                                            <n-space vertical>
                                                <n-text class="text-sm">{{ fmt.size_mb ? fmt.size_mb.toFixed(2) + ' MB'
                                                    :
                                                    '—' }}</n-text>
                                                <n-tag :type="fmt.audio_codec === 'none' ? 'success' : 'info'"
                                                    size="small">
                                                    {{ fmt.audio_codec === 'none' ? 'Video' : 'Video+Audio' }}
                                                </n-tag>
                                            </n-space>
                                        </div>
                                    </n-list-item>
                                </n-list>
                            </n-scrollbar>
                        </n-spin>
                    </template>
                </n-drawer-content>
            </n-drawer>

            <!-- DESKTOP: overlay panel -->
            <Transition name="fade-blur">
                <div v-if="active_drawer && !isMobile"
                    class="absolute inset-0 z-[100] flex items-start justify-center p-6">
                    <div class="absolute inset-0 bg-gray-100/55 dark:bg-gray-900/55 backdrop-blur-sm"
                        @click="handleOverlayClick">
                    </div>

                    <n-card
                        class="relative z-10  shadow-xl max-w-6xl w-full overflow-hidden transform transition-all scale-100">
                        <n-spin :show="downloading">
                            <div class="flex items-start gap-4 p-4">

                                <div class="w-72 flex-shrink-0">
                                    <n-image :src="videoInfo?.thumbnail" width="100%" height="180" fit="cover"
                                        class="rounded" />
                                    <div class="mt-3">
                                        <template v-if="videoInfo?.status === 'loading'">
                                            <n-space vertical :size="12">
                                                <n-skeleton height="200px" width="80%" />
                                                <n-skeleton height="18" width="80%" />
                                                <n-skeleton height="14" width="60%" />
                                            </n-space>
                                        </template>
                                        <template v-else>
                                            <n-text strong class="block">{{ videoInfo.title }}</n-text>
                                            <n-text depth="2" class="block">{{ videoInfo.artist || 'Unknown artist'
                                            }}</n-text>
                                            <n-text depth="3" class="block">Views: {{ videoInfo.views || 'N/A'
                                            }}</n-text>
                                        </template>
                                    </div>
                                </div>

                                <div class="flex-1 p-2">
                                    <div class="flex items-center justify-between mb-3">
                                        <n-gradient-text type="success">Select format to download</n-gradient-text>
                                        <div class="flex gap-2">
                                            <n-button quaternary circle @click="router.back()"><n-icon>
                                                    <ArrowBackCircleOutline />
                                                </n-icon></n-button>
                                            <n-button quaternary circle @click="handleDrawerClose"><n-icon>
                                                    <CloseOutline />
                                                </n-icon></n-button>
                                        </div>
                                    </div>

                                    <template v-if="videoInfo?.status === 'loading'">
                                        <n-space vertical :size="12">
                                            <n-skeleton height="64px" />
                                            <n-skeleton v-for="i in 6" :key="i" height="48px" />
                                        </n-space>
                                    </template>

                                    <template v-else>
                                        <n-scrollbar style="max-height: 70vh;">
                                            <n-list bordered>
                                                <n-list-item v-for="fmt in formats" :key="fmt.itag"
                                                    class="format-item cursor-pointer p-3 rounded-md transition-all hover:shadow-sm"
                                                    @click="selectFormat(fmt)">
                                                    <div class="flex justify-between items-center w-full">
                                                        <div>
                                                            <n-text strong>itag {{ fmt.itag }}</n-text>
                                                            <div class="text-sm text-muted">{{
                                                                convertResolution(fmt.resolution) || 'N/A' }} • {{
                                                                    fmt.ext
                                                                }}</div>
                                                        </div>
                                                        <div class="flex items-center gap-4">
                                                            <n-text class="text-sm">{{ fmt.size_mb ?
                                                                fmt.size_mb.toFixed(2)
                                                                + ' MB' : '—' }}</n-text>
                                                            <n-tag
                                                                :type="fmt.audio_codec === 'none' ? 'success' : 'info'"
                                                                size="small">
                                                                {{ fmt.audio_codec === 'none' ? 'Video' : 'Video+Audio'
                                                                }}
                                                            </n-tag>
                                                        </div>
                                                    </div>
                                                </n-list-item>
                                            </n-list>
                                        </n-scrollbar>
                                    </template>
                                </div>
                            </div>
                        </n-spin>
                    </n-card>
                </div>
            </Transition>

            <Transition name="fade-slide">
                <n-result v-if="initialized" status="success" title="Download Initialized" class="mt-6 max-w-xl" />
            </Transition>
        </n-space>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LinkOutline, ArrowBackCircleOutline, CloseOutline } from '@vicons/ionicons5'
import { useMessage, useDialog } from 'naive-ui'
import { useDownloadStore } from '../store/downloadStore'
import { normalizeYouTubeUrl, convertResolution, getItagWithAudio } from '../utils/others'
import { generateUUID, useIsMobile } from '../reusables'
import { useStateStore } from '../store/stateStore'
import { saveFile } from '../db/download'
import { audioItags } from '../utils'

const route = useRoute()
const router = useRouter()
const downloadStore = useDownloadStore()
const message = useMessage()
const dialog = useDialog()
const isMobile = useIsMobile()

const active_learn_drawer = ref(false)
const active_drawer = ref(false)
const isLoading = ref(false)
const loadingDescription = ref('Processing your request...')
const initialized = ref(false)
const downloading = ref(false)

const url = ref('')
const isValidUrl = ref(false)
const currentUrl = computed({
    get: () => url.value,
    set: (v) => (url.value = (v || '').trim())
})

const videoInfo = ref(null)
const formats = ref([])

const activeId = computed(() => route.query.id || null)

watch(
    () => activeId.value,
    (id) => {
        if (id) {
            openForId(id)
        } else {
            active_drawer.value = false
            videoInfo.value = null
            formats.value = []
        }
    },
    { immediate: true }
)

watch(
    () => (activeId.value ? downloadStore.loadedformats[activeId.value] : null),
    (entry) => {
        if (!entry) return
        videoInfo.value = entry
        const fmts = entry.formats ?? []
        formats.value = Array.isArray(fmts) ? fmts : Object.values(fmts)
        if (entry.status === 'ready') active_drawer.value = true
        else if (entry.status === 'loading') active_drawer.value = true
    },
    { deep: true, immediate: true }
)

watch(
    () => url.value,
    (v) => {
        const trimmed = (v || '').trim()
        if (!trimmed) {
            isValidUrl.value = false
            return
        }
        if (trimmed.includes('yout')) {
            url.value = normalizeYouTubeUrl(trimmed)
            isValidUrl.value = true
        } else {
            isValidUrl.value = false
        }
    },
    { immediate: true }
)

onMounted(() => {
    if (activeId.value) openForId(activeId.value)
})

function openForId(id) {
    const entry = downloadStore.loadedformats[id]
    if (entry) {
        videoInfo.value = entry
        const fmts = entry.formats ?? []
        formats.value = Array.isArray(fmts) ? fmts : Object.values(fmts)
        active_drawer.value = true
        return
    }
    dialog.error({
        title: 'Format not found',
        content: 'The requested format ID does not exist or may have expired.',
        positiveText: 'OK',
        onPositiveClick() {
            removeIdFromUrl()
        }
    })
}

function removeIdFromUrl() {
    const q = { ...route.query }
    if (q.id) delete q.id
    // router.replace({ name: route.name || route.path, query: q }).catch(() => { })
    router.push('/h/yt/custom-config')
}

function handleDrawerClose() {
    active_drawer.value = false
    removeIdFromUrl()
}

function handleOverlayClick() {
    handleDrawerClose()
}

async function getFormats() {
    if (!isValidUrl.value || isLoading.value) {
        message.error('Please enter a valid URL before loading formats.')
        return
    }

    isLoading.value = true
    initialized.value = false

    try {
        const id = generateUUID()
        downloadStore.loadedformats[id] = {
            formats: {},
            status: 'loading',
            url: url.value,
            title: '',
            artist: '',
            views: '',
            thumbnail: ''
        }

        await router.push({ name: 'CustomConfig', query: { id } })

        await downloadStore.getFileSogs(id, url.value)

        initialized.value = true
    } catch (err) {
        console.error(err)
        message.error('Failed to load formats.')
    } finally {
        isLoading.value = false
    }
}
const userStore = useStateStore()




async function selectFormat(format) {
    message.success(`Selected format ${format.itag}`)
    downloading.value = true
    const id = generateUUID()
    downloadStore.get_download_meta(id, url.value, format.itag)

    const combinedItag =  await getItagWithAudio(format.itag, formats.value);

    setTimeout(() => {
        message.info('Download started')
        downloading.value = false
        active_drawer.value = false
        // url.value = null
        router.push(`h/yt/${id}`)
        removeIdFromUrl()
    }, 2000)
    await saveFile(id, {
        url: videoInfo.value.url,
        itag: combinedItag,
        startTime: Date.now(),
    });

    await downloadStore.download_file(`yt/${userStore.user?.username}/download`, id, videoInfo.value.url, combinedItag)

}
</script>

<style scoped>
/* Transitions */
.fade-blur-enter-active,
.fade-blur-leave-active {
    transition: all 240ms ease;
}

.fade-blur-enter-from {
    opacity: 0;
    transform: scale(0.99);
}

.fade-blur-enter-to {
    opacity: 1;
    transform: scale(1);
}

.fade-blur-leave-from {
    opacity: 1;
    transform: scale(1);
}

.fade-blur-leave-to {
    opacity: 0;
    transform: scale(0.99);
}

.scale-fade-enter-active,
.scale-fade-leave-active {
    transition: all 220ms ease;
}

.scale-fade-enter-from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
}

.scale-fade-enter-to {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.format-item {
    transition: all 180ms ease;
}

.format-item:hover {
    background-color: rgba(0, 0, 0, 0.03);
    transform: translateY(-2px);
}

/* input focus */
.input-focus:focus-within {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
}

/* small helpers */
.text-muted {
    color: rgba(100, 116, 139, 1);
    /* tailwind gray-500 */
}
</style>
