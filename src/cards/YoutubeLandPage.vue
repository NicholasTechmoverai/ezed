<template>
    <div class="flex flex-col items-center p-4 w-full max-w-800px mx-auto min-h-screen">
        <!-- Search Section -->
        <div class="w-full max-w-600px mb-8">
            <div class="flex gap-2 w-full items-center">
                <n-auto-complete v-model:value="query" :options="filteredSuggestions" placeholder="Search in YouTube"
                    size="large" class="flex-1" :loading="isLoading" @select="handleSelect" @keyup.enter="handleSearch"
                    clearable>
                    <template #prefix>
                        <n-icon :component="Search" color="#888" />
                    </template>
                </n-auto-complete>

                <n-button type="primary" size="large" @click="handleSearch" :loading="isSearching" class="min-w-32">
                    <template #icon>
                        <n-icon>
                            <Search />
                        </n-icon>
                    </template>
                    Search
                </n-button>
            </div>

            <n-text v-if="showManualOption" depth="3" class="text-sm mt-1 ml-1">
                No exact match found. Press Enter or click Search to search for "{{ query }}"
            </n-text>
        </div>

        <div class="w-full max-w-800px">
            <n-space v-if="isLoading" vertical class="w-full space-y-1">
                <!-- <n-skeleton height="100px" width="100%" :repeat="3" /> -->
            </n-space>

            <n-empty v-else-if="!searchResults.length && !isSearching" description="No results found" class="mt-12">
                <template #extra>
                    <n-button size="small" @click="query = ''">
                        Clear search
                    </n-button>
                </template>
            </n-empty>
        </div>

        <n-list v-if="searchResults.length" class="w-full max-w-800px" bordered>
            <n-scrollbar style="max-height: 500px">

                <n-list-item v-for="result in searchResults" :key="result.id" class="!p-0">
                    <n-card :bordered="false" hoverable content-style="p-0">
                        <div class="flex flex-col gap-4 p-4">
                            <div class="flex gap-4 w-full md:flex-row flex-col">
                                <div class="w-full md:w-200px  flex-shrink-0">
                                    <n-image width="100%" :src="getYouTubeThumbnail(result.url)" object-fit="cover"
                                        class="rounded-lg aspect-video shadow-md hover:shadow-lg transition-shadow max-h-[180px]">
                                        <template #error>
                                            <div
                                                class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                                <n-icon :size="48" color="lightGrey">
                                                    <ImageOutline />
                                                </n-icon>
                                            </div>
                                        </template>
                                    </n-image>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <n-gradient-text type="info" class="text-lg font-bold mb-2">
                                        <n-ellipsis style="max-width: 300px">{{ result.title }}</n-ellipsis>
                                    </n-gradient-text>

                                    <n-space vertical size="small" class="mb-3">
                                        <n-text v-if="result.duration" depth="3" class="text-sm">
                                            <n-icon :component="TimeOutline" size="14" class="mr-1" />
                                            {{ result.duration }}
                                        </n-text>
                                        <n-text v-if="result.views" depth="3" class="text-sm">
                                            <n-icon :component="EyeOutline" size="14" class="mr-1" />
                                            {{ result.views }}
                                        </n-text>
                                    </n-space>

                                    <!-- Action Buttons -->
                                    <n-space :size="8">
                                        <n-tooltip>
                                            <template #trigger>
                                                <n-button secondary size="small" @click="copyToClipboard(result.url)"
                                                    class="!text-gray-600 dark:!text-gray-300">
                                                    <template #icon>
                                                        <n-icon>
                                                            <CopyOutline />
                                                        </n-icon>
                                                    </template>
                                                    Copy
                                                </n-button>
                                            </template>
                                            Copy URL to clipboard
                                        </n-tooltip>
                                        <n-dropdown :options="downloadoptions"
                                            @select="(key) => handleDownload(result,key)">
                                            <n-tooltip>
                                                <template #trigger>
                                                    <n-button secondary type="primary" size="small">
                                                        <template #icon>
                                                            <n-icon>
                                                                <DownloadOutline />
                                                            </n-icon>
                                                        </template>
                                                        Download
                                                    </n-button>
                                                </template>
                                                Download this video
                                            </n-tooltip>
                                        </n-dropdown>


                                        <n-tooltip>
                                            <template #trigger>
                                                <n-button secondary size="small" @click="showInfo(result)">
                                                    <template #icon>
                                                        <n-icon>
                                                            <InformationCircleOutline />
                                                        </n-icon>
                                                    </template>
                                                    Details
                                                </n-button>
                                            </template>
                                            View video details
                                        </n-tooltip>
                                    </n-space>
                                </div>
                            </div>

                            <n-input-group>
                                <n-input readonly size="small" :value="result.url" class="!cursor-text">
                                    <template #prefix>
                                        <n-icon :component="LinkOutline" />
                                    </template>
                                </n-input>
                                <n-button type="info" @click="copyToClipboard(result.url)" secondary>
                                    <template #icon>
                                        <n-icon>
                                            <CopyOutline />
                                        </n-icon>
                                    </template>
                                </n-button>
                            </n-input-group>
                        </div>
                    </n-card>
                </n-list-item>
            </n-scrollbar>
        </n-list>

    </div>
</template>



<script setup>
import { ref, watch, computed } from 'vue'
import { usersSocket } from '../web_socket'
import axios from 'axios'
import { ENDPOINTS } from '../api'
import { getYouTubeThumbnail } from '../utils/others'
import { FlashOutline, ImageOutline, CopyOutline, DownloadOutline, InformationCircleOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import router from '../router'
import { saveFile } from '../db/download'
import { useUserStore } from '../store/userStore'
import { useDownloadStore } from '../store/downloadStore'
import { generateUUID } from '../reusables'

const query = ref('')
const suggestions = ref([])
const isLoading = ref(false)
const isSearching = ref(false)
const lastSearchQuery = ref('')
const searchResults = ref([])
watch(query, (newQuery) => {
    if (newQuery.length > 2 && newQuery !== lastSearchQuery.value) {
        getSuggestions()
    } else {
        suggestions.value = []
    }
})

const message = useMessage()
const filteredSuggestions = computed(() => {
    return suggestions.value.filter(option =>
        option.label.toLowerCase().includes(query.value.toLowerCase())
    )
})
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    message.success('URL copied to clipboard!')
}

const userStore = useUserStore()
const downloadStore = useDownloadStore()

const downloadoptions = [
    {
        label: 'video',
        key: '18',
        icon: ""
    },
    {
        label: 'audio',
        key: '140',
        icon: ""
    },

]


const handleDownload = async (result, key) => {
    const id = generateUUID()

    setTimeout(() => {
        message.info('Download started')
        // router.push({ name: 'YoutubeDetail', params: { id } })
    }, 2000)
    await saveFile(id, {
        url: result.url,
        itag: '18',
        startTime: Date.now(),
    });
    downloadStore.get_download_meta(id, result.url, key)
    downloadStore.update_download_progress({
        id,
        downloadName: result.title,
        filename: result.title,
        url: result.url,
        type: 'youtube',
        status: 'downloading',
        progress: 0,
        createdAt: Date.now(),
    })
    await downloadStore.download_file(`yt/${userStore.user?.username}/download`, id, result.url, key)
}
const showInfo = (format) => {
    try {
        const id = generateUUID()
        downloadStore.loadedformats[id] = {
            formats: {},
            status: 'loading',
            url: format.url,
            title: '',
            artist: '',
            views: '',
            thumbnail: getYouTubeThumbnail(format.url),
            duration: 0
        }
        setTimeout(() => {
            isLoading.value = false
            router.push({ name: 'CustomConfig', query: { id } })
        }, 1500);

        message.loading('Loading formats...')
        isLoading.value = true
        downloadStore.getFileSogs(id, format.url)

    } catch (err) {
        console.error(err)
        message.error('Failed to load formats.')
    } finally {
        isLoading.value = false
    }
}
const showManualOption = computed(() => {
    return query.value && query.value.length > 2 &&
        !filteredSuggestions.value.some(option =>
            option.label.toLowerCase() === query.value.toLowerCase()
        )
})

const getSuggestions = () => {
    isLoading.value = true
    usersSocket.emit('get_search_suggestions', { query: query.value })
    usersSocket.on('response_search_suggestions', (data) => {
        suggestions.value = data.search_suggestions.map(item => ({
            label: item.name + " - " + item.artist,
            value: item.id
        }))
        isLoading.value = false
    })
}

const handleSelect = (value) => {
    const selected = suggestions.value.find(item => item.value === value)
    if (selected) {
        query.value = selected.label
        handleSearch()
    }
}

const handleSearch = () => {
    if (!query.value.trim()) return

    isSearching.value = true
    lastSearchQuery.value = query.value

    getSearch(query.value)
        .catch(err => {
            console.log("Error fetching search results:", err)
        })

}


const getSearch = async (query) => {
    try {
        const { data } = await axios.get(ENDPOINTS.YOUTUBE_SEARCH, { params: { q: query } });
        searchResults.value = data || [];
        isSearching.value = false;

    } catch (error) {
        console.error(`Failed to fetch metadata for URL [${url}]:`, error);
        throw error;
    }
}
</script>
