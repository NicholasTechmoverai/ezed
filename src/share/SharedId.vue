<template>
    <n-config-provider :theme="darkThemeEnabled ? darkTheme : null">
        <n-global-style />

        <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <n-layout class="min-h-screen">
                <!-- Header -->
                <n-layout-header bordered class="px-4 py-3 bg-white dark:bg-gray-800 shadow-sm">
                    <div class="flex justify-between items-center max-w-6xl mx-auto">
                        <div class="flex items-center gap-3">
                            <n-button text @click="toggleDarkTheme" aria-label="Toggle theme">
                                <template #icon>
                                    <component :is="darkThemeEnabled ? FaSun : FaMoon" />
                                </template>
                            </n-button>
                            <h1 class="text-xl font-bold text-gray-800 dark:text-white">ShareDrop</h1>
                        </div>

                        <n-space>
                            <n-button v-if="share" secondary @click="copyShareLink">
                                <template #icon>
                                    <FaLink />
                                </template>
                                Copy Link
                            </n-button>

                            <n-button v-if="share?.files?.length" tertiary @click="downloadAllFiles"
                                :loading="downloadingAll">
                                <template #icon>
                                    <FaDownload />
                                </template>
                                Download All
                            </n-button>

                            <n-button v-if="hasSelection" error @click="deleteSelected" :loading="deletingSelected">
                                <template #icon>
                                    <FaTrash />
                                </template>
                                Delete Selected ({{ selectedCount }})
                            </n-button>

                            <n-button v-if="hasSelection" plain @click="clearSelection">Clear Selection</n-button>

                            <n-switch v-model:value="autoDownload" size="small" />
                        </n-space>
                    </div>
                </n-layout-header>

                <!-- Content -->
                <n-layout-content>
                    <div class="max-w-5xl mx-auto p-4 md:p-6">
                        <!-- Loading -->
                        <n-space v-if="loading" vertical class="items-center py-12">
                            <n-spin size="large" />
                            <p class="text-gray-600 dark:text-gray-300">Loading shared content…</p>
                        </n-space>

                        <!-- Error -->
                        <n-alert v-else-if="error" title="Error" type="error" class="mb-4">
                            {{ error }}
                            <template #footer>
                                <n-button @click="fetchShare" tertiary>Try Again</n-button>
                            </template>
                        </n-alert>

                        <!-- Share content -->
                        <div v-else-if="share" class="space-y-6">
                            <n-card :title="share.title || 'Untitled Share'" class="shadow-lg">
                                <template #header-extra>
                                    <n-text depth="3" class="text-sm">{{ formatDate(share.created_at) }}</n-text>
                                </template>

                                <div v-if="share.text" class="mb-4">
                                    <n-p class="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{{
                                        decodeText(share.text) }}</n-p>
                                </div>

                                <div v-if="share.url" class="mb-4">
                                    <n-text depth="3" class="block mb-1">Link</n-text>
                                    <embed :src="share.url" type="">
                                    <n-a :href="share.url" target="_blank" class="text-blue-600 dark:text-blue-400">{{
                                        share.url
                                    }}</n-a>
                                </div>

                                <!-- Thumbnails grid -->
                                <div v-if="share.files?.length" class="mt-6">
                                    <n-h3 prefix="bar" class="mb-3">Files ({{ share.files.length }})</n-h3>

                                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        <div v-for="(file, idx) in share.files"
                                            :key="file.safe_filename || file.filename"
                                            class="relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                                            <!-- selection checkbox (top-left) -->
                                            <label class="absolute top-2 left-2 z-20">
                                                <input type="checkbox" class="w-4 h-4" :checked="isSelected(file)"
                                                    @change="toggleSelect(file)"
                                                    :aria-label="`Select ${file.filename}`" />
                                            </label>

                                            <!-- Downloaded overlay -->
                                            <div v-if="isDownloaded(file)" class="absolute top-2 right-2 z-20">
                                                <div
                                                    class="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1 shadow">
                                                    <FaCheck />
                                                    <span>Downloaded</span>
                                                </div>
                                            </div>

                                            <!-- thumbnail area -->
                                            <div class="w-full h-28 flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden cursor-pointer"
                                                @click="previewFile(file)">
                                                <img v-if="isImage(file)" :src="getFileUrl(file)" alt="thumb"
                                                    class="w-full h-full object-cover" />
                                                <video v-else-if="isVideo(file)" :src="getFileUrl(file)"
                                                    class="w-full h-full object-cover" muted playsinline />
                                                <div v-else
                                                    class="flex flex-col items-center justify-center text-gray-500 dark:text-gray-300 px-2">
                                                    <component :is="getFileIconComponent(file)" class="text-3xl" />
                                                    <span class="text-xs mt-1 truncate text-center">{{
                                                        shortName(file.filename)
                                                    }}</span>
                                                </div>
                                            </div>

                                            <!-- file meta and actions -->
                                            <div class="p-2 flex items-center justify-between gap-2">
                                                <div class="min-w-0">
                                                    <div
                                                        class="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                        {{
                                                            file.filename }}</div>
                                                    <div class="text-xs text-gray-500 dark:text-gray-400">{{
                                                        formatFileSize(file.size)
                                                    }}</div>
                                                </div>

                                                <div class="flex items-center gap-1">
                                                    <n-button size="tiny" quaternary type="error"
                                                        @click.stop="deleteFile(file)" title="Delete">
                                                        <template #icon>
                                                            <FaTrash />
                                                        </template>
                                                    </n-button>

                                                    <n-button size="tiny" tertiary v-if="isPreviewable(file)"
                                                        @click.stop="previewFile(file)">
                                                        <template #icon>
                                                            <FaEye />
                                                        </template>
                                                    </n-button>

                                                    <n-button size="tiny" type="primary"
                                                        :loading="downloadingFile === (file.safe_filename || file.filename)"
                                                        @click.stop="downloadFile(file)">
                                                        <template #icon>
                                                            <FaDownload />
                                                        </template>
                                                    </n-button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                        Enable <b>Auto</b> to download all files automatically.
                                    </div>
                                </div>
                            </n-card>
                        </div>

                        <!-- Not found -->
                        <n-empty v-else size="large" description="No shared content found" class="py-20">
                            <template #extra><n-button @click="fetchShare">Refresh</n-button></template>
                        </n-empty>
                    </div>
                </n-layout-content>
            </n-layout>

            <!-- Preview modal -->
            <n-modal v-model:show="showPreviewModal" :title="previewFileData?.filename" preset="card" :bordered="false"
                style="max-width:90vw; width:900px;">
                <div class="preview-container">
                    <img v-if="previewFileData && isImage(previewFileData)" :src="previewUrl"
                        :alt="previewFileData.filename" class="max-h-[70vh] w-auto mx-auto rounded" />

                    <video v-else-if="previewFileData && isVideo(previewFileData)" :src="previewUrl" controls
                        class="max-h-[70vh] w-full" />

                    <audio v-else-if="previewFileData && isAudio(previewFileData)" :src="previewUrl" controls
                        class="w-full" />

                    <iframe v-else-if="previewFileData && isPDF(previewFileData)" :src="previewUrl"
                        class="w-full h-[70vh]" />

                    <n-code v-else-if="previewFileData && isText(previewFileData)" :code="previewTextContent"
                        language="text" class="h-[70vh] overflow-auto" word-wrap />

                    <div v-else class="text-center py-12">
                        <FaFile class="text-5xl text-gray-400 mb-4" />
                        <p class="text-gray-500 dark:text-gray-400">Preview not available for this file type.</p>
                    </div>
                </div>

                <template #footer>
                    <n-space justify="end">
                        <n-button @click="showPreviewModal = false">Close</n-button>
                        <n-button v-if="previewFileData" type="primary" @click="downloadFile(previewFileData)">
                            <template #icon>
                                <FaDownload />
                            </template>
                            Download
                        </n-button>
                    </n-space>
                </template>
            </n-modal>
        </div>
    </n-config-provider>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import {
    NConfigProvider,
    NGlobalStyle,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NCard,
    NButton,
    NSpace,
    NSpin,
    NAlert,
    NText,
    NEmpty,
    NModal,
    NCode,
    NSwitch,
    useMessage,
    darkTheme
} from 'naive-ui'

// icons from @vicons/fa
import {
    FileDownload as FaDownload,
    Trash as FaTrash,
    Eye as FaEye,
    CheckCircle as FaCheck,
    Link as FaLink,
    Moon as FaMoon,
    Sun as FaSun,
    FileImage as FaFileImage,
    FileVideo as FaFileVideo,
    FileAudio as FaFileAudio,
    FilePdf as FaFilePdf,
    FileArchive as FaFileArchive,
    FileCode as FaFileCode,
    File as FaFile
} from '@vicons/fa'

const route = useRoute()
const message = useMessage()
const shareId = route.params.id

const share = ref(null)
const loading = ref(true)
const error = ref(null)

const darkThemeEnabled = ref(false)
const autoDownload = ref(false)

const downloadingFile = ref(null)
const downloadingAll = ref(false)
const deletingSelected = ref(false)

const showPreviewModal = ref(false)
const previewFileData = ref(null)
const previewUrl = ref('')
const previewTextContent = ref('')

const downloadedSet = ref(new Set())
const selectedSet = ref(new Set())

// computed helpers
const selectedCount = computed(() => selectedSet.value.size)
const hasSelection = computed(() => selectedSet.value.size > 0)

// Helpers
const getFileUrl = (file) => {
    const name = file?.safe_filename || file?.filename
    return `/api/download/${shareId}/${encodeURIComponent(name)}`
}

const shortName = (name) => {
    if (!name) return ''
    return name.length > 22 ? name.slice(0, 19) + '...' : name
}

const isImage = (file) => (file?.content_type || '').includes('image')
const isVideo = (file) => (file?.content_type || '').includes('video')
const isAudio = (file) => (file?.content_type || '').includes('audio')
const isPDF = (file) => (file?.content_type || '').includes('pdf') || (file?.filename || '').toLowerCase().endsWith('.pdf')
const isText = (file) => {
    const ct = (file?.content_type || '').toLowerCase()
    const name = (file?.filename || '').toLowerCase()
    return ct.includes('text') || ['.txt', '.json', '.js', '.css', '.html', '.md', '.csv'].some(ext => name.endsWith(ext))
}
const isPreviewable = (file) => isImage(file) || isVideo(file) || isAudio(file) || isPDF(file) || isText(file)

function formatFileSize(bytes = 0) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
function formatDate(iso) { if (!iso) return ''; return new Date(iso).toLocaleString() }
function decodeText(text) { if (!text) return ''; return decodeURIComponent(text.replace(/%0A/g, '\n').replace(/%C2%A0/g, ' ')) }

function getFileIconComponent(file) {
    const ct = (file?.content_type || '').toLowerCase()
    const name = (file?.filename || '').toLowerCase()
    if (ct.includes('image')) return FaFileImage
    if (ct.includes('video')) return FaFileVideo
    if (ct.includes('audio')) return FaFileAudio
    if (ct.includes('pdf') || name.endsWith('.pdf')) return FaFilePdf
    if (ct.includes('zip') || ct.includes('compressed')) return FaFileArchive
    if (ct.includes('text') || ['.json', '.js', '.ts', '.css', '.html', '.md'].some(ext => name.endsWith(ext))) return FaFileCode
    return FaFile
}

function markDownloaded(file) { downloadedSet.value.add(file?.safe_filename || file?.filename) }
function isDownloaded(file) { return downloadedSet.value.has(file?.safe_filename || file?.filename) }

function toggleSelect(file) {
    const id = file?.safe_filename || file?.filename
    if (!id) return
    if (selectedSet.value.has(id)) selectedSet.value.delete(id)
    else selectedSet.value.add(id)
}
function isSelected(file) { return selectedSet.value.has(file?.safe_filename || file?.filename) }
function clearSelection() { selectedSet.value.clear() }

// fetch share
async function fetchShare() {
    loading.value = true
    error.value = null
    try {
        const res = await axios.get(`/api/share/${shareId}`)
        share.value = res.data.data
        if (autoDownload.value) downloadAllFiles()
    } catch (e) {
        error.value = e?.response?.data?.detail || e?.message || 'Failed to fetch share'
        message.error(error.value)
    } finally {
        loading.value = false
    }
}

// download single file (browser-handled)
async function downloadFile(file) {
    if (!file) return
    const name = file?.safe_filename || file?.filename
    if (!name) return
    downloadingFile.value = name
    try {
        const url = getFileUrl(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        markDownloaded(file)
        message.success(`Downloading ${file.filename}`)
    } catch (err) {
        console.error(err)
        message.error(`Failed to download ${file.filename}`)
    } finally {
        downloadingFile.value = null
    }
}

// Download all sequentially
async function downloadAllFiles() {
    if (!share.value?.files?.length) return
    downloadingAll.value = true
    try {
        for (const f of share.value.files) {
            await downloadFile(f)
            await new Promise(r => setTimeout(r, 200))
        }
    } finally {
        downloadingAll.value = false
    }
}

// preview
async function previewFile(file) {
    if (!file) return
    previewFileData.value = file
    previewUrl.value = getFileUrl(file)

    if (isText(file)) {
        try {
            const resp = await axios.get(getFileUrl(file), { responseType: 'text' })
            previewTextContent.value = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2)
        } catch (e) {
            previewTextContent.value = 'Unable to load text content.'
        }
    }
    showPreviewModal.value = true
}

// delete a single file (backend must support this)
async function deleteFile(file) {
    if (!file) return
    const confirmed = window.confirm(`Delete "${file.filename}"? This action cannot be undone.`)
    if (!confirmed) return

    const name = file?.safe_filename || file?.filename
    try {
        await axios.delete(`/api/share/${shareId}/file/${encodeURIComponent(name)}`)
        share.value.files = share.value.files.filter(f => (f.safe_filename || f.filename) !== (file.safe_filename || file.filename))
        downloadedSet.value.delete(name)
        selectedSet.value.delete(name)
        message.success('File deleted')
    } catch (e) {
        console.error(e)
        message.error('Failed to delete file')
    }
}

// delete selected (multiple)
async function deleteSelected() {
    if (!hasSelection.value) return
    const confirmed = window.confirm(`Delete ${selectedCount.value} selected file(s)? This cannot be undone.`)
    if (!confirmed) return

    deletingSelected.value = true
    try {
        const toDelete = Array.from(selectedSet.value)
        for (const name of toDelete) {
            try {
                await axios.delete(`/api/share/${shareId}/file/${encodeURIComponent(name)}`)
                share.value.files = share.value.files.filter(f => (f.safe_filename || f.filename) !== name)
                downloadedSet.value.delete(name)
                selectedSet.value.delete(name)
            } catch (e) {
                console.error('Failed to delete', name, e)
            }
        }
        message.success('Selected files deleted')
    } finally {
        deletingSelected.value = false
    }
}

// copy link
function copyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => message.success('Share link copied')).catch(() => message.error('Copy failed'))
}

// theme toggle
function toggleDarkTheme() {
    darkThemeEnabled.value = !darkThemeEnabled.value
    document.documentElement.classList.toggle('dark', darkThemeEnabled.value)
    localStorage.setItem('darkTheme', String(darkThemeEnabled.value))
}

// auto-download watcher
watch(autoDownload, (v) => { if (v && share.value?.files?.length) downloadAllFiles() })

// init
onMounted(() => {
    const saved = localStorage.getItem('darkTheme')
    darkThemeEnabled.value = saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', darkThemeEnabled.value)
    fetchShare()
})
</script>

<style scoped>
.preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
}

input[type="checkbox"] {
    accent-color: #2563eb;
}
</style>
