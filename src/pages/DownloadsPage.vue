<template>
    <div class="download-selection-container">
        <n-card title="Download Management" hoverable class="">
            <n-space vertical>
                <n-alert type="info" :show-icon="false">
                    You have selected {{ checkedRowKeys.length }} item{{ checkedRowKeys.length !== 1 ? 's' : '' }}
                </n-alert>

                <div class="batch-actions">
                    <n-button-group>
                        <n-button secondary @click="selectAllRows" :disabled="downloads.length === 0">
                            <template #icon>
                                <n-icon>
                                    <SelectAllIcon />
                                </n-icon>
                            </template>
                            Select All
                        </n-button>
                        <n-button secondary @click="clearSelection" :disabled="!checkedRowKeys.length">
                            <template #icon>
                                <n-icon>
                                    <ClearAllIcon />
                                </n-icon>
                            </template>
                            Clear
                        </n-button>
                        <n-button type="warning" @click="handleRetrySelected" :disabled="!checkedRowKeys.length">
                            <template #icon>
                                <n-icon>
                                    <RetryIcon />
                                </n-icon>
                            </template>
                            Retry Selected
                        </n-button>
                        <n-button type="error" @click="handleDeleteSelected" :disabled="!checkedRowKeys.length">
                            <template #icon>
                                <n-icon>
                                    <DeleteIcon />
                                </n-icon>
                            </template>
                            Delete Selected
                        </n-button>
                    </n-button-group>
                </div>

                <n-data-table :columns="columns" :data="downloads" :pagination="pagination" :row-key="rowKey"
                    v-model:checked-row-keys="checkedRowKeys" :bordered="true" class="download-table" />


            </n-space>
        </n-card>
    </div>
</template>

<script setup>
import { ref, reactive, computed, h, onMounted } from 'vue'
import {
    NButton,
    NCard,
    NSpace,
    NDataTable,
    NAlert,
    NIcon,
    NImage,
    NButtonGroup,
    NPopconfirm,
    NTag
} from 'naive-ui'
import {
    Download as DownloadIcon,
    Refresh as RetryIcon,
    Trash as DeleteIcon,
    Albums as SelectAllIcon,
    Close as ClearAllIcon,
    InformationCircle as InfoIcon
} from '@vicons/ionicons5'
import { deleteFile, getAllFiles } from '../db/download'
import defaultThumbnail from "../assets/defaultThumbnail.png"
import { formatDistanceToNow } from 'date-fns'
import router from '../router'
import { useMessage } from 'naive-ui'
import { useDownloadStore } from '../store/downloadStore'
const downloadStore = useDownloadStore()

const downloads = ref([])
const getDownloads = async () => {
    try {
        const dbFile = await getAllFiles()
        if (dbFile) {
            downloads.value = dbFile
            console.log("downloads::", downloads.value)
        }
    } catch (error) {
        console.error('Error fetching file:', error)
    }
}

// Reactive state
const checkedRowKeys = ref([])
const message = useMessage()

// Computed properties
const selectedItems = computed(() =>
    downloads.value.filter(item => checkedRowKeys.value.includes(item.id))
)

// Table configuration
const pagination = reactive({
    page: 1,
    pageSize: 10,
    showSizePicker: true,
    pageSizes: [5, 10, 20],
    onChange: (page) => { pagination.page = page },
    onUpdatePageSize: (pageSize) => {
        pagination.pageSize = pageSize
        pagination.page = 1
    }
})

const createActionsColumn = () => {
    return {
        title: 'Actions',
        key: 'actions',
        width: 150,
        align: 'center',
        render(row) {
            return h('div', { class: 'action-buttons' }, [
                h(
                    NButton,
                    {
                        size: 'small',
                        type: 'info',
                        quaternary: true,
                        onClick: (e) => {
                            e.stopPropagation()
                            //   window.open(`/h/meta/${row.id}`, '_blank')
                            router.push(`/h/meta/${row.id}`)
                        }
                    },
                    {
                        icon: () => h(NIcon, null, { default: () => h(InfoIcon) })
                    }
                ),
                h(
                    NPopconfirm,
                    {
                        onPositiveClick: () => handleRetry(row)
                    },
                    {
                        trigger: () => h(
                            NButton,
                            {
                                size: 'small',
                                type: 'warning',
                                quaternary: true,
                                onClick: (e) => e.stopPropagation()
                            },
                            {
                                icon: () => h(NIcon, null, { default: () => h(RetryIcon) })
                            }
                        ),
                        default: () => 'Are you sure you want to retry this download?'
                    }
                ),
                h(
                    NPopconfirm,
                    {
                        onPositiveClick: () => handleDelete(row.id)
                    },
                    {
                        trigger: () => h(
                            NButton,
                            {
                                size: 'small',
                                type: 'error',
                                quaternary: true,
                                onClick: (e) => e.stopPropagation()
                            },
                            {
                                icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
                            }
                        ),
                        default: () => 'Are you sure you want to delete this download?'
                    }
                )
            ])
        }
    }
}

const createStatusColumn = () => {
    return {
        title: 'Status',
        key: 'status',
        width: 120,
        render(row) {
            const statusMap = {
                completed: { type: 'success', text: 'Completed' },
                failed: { type: 'error', text: 'Failed' },
                pending: { type: 'warning', text: 'Pending' },
                downloading: { type: 'info', text: 'Downloading' }
            }
            const status = statusMap[row.status] || { type: 'default', text: row.status }
            return h(NTag, { type: status.type }, { default: () => status.text })
        }
    }
}

const columns = [
    {
        type: 'selection',
        disabled: (row) => false
    },
    {
        title: 'Thumbnail',
        key: 'thumbnail',
        width: 100,

        render: (row) => h(NImage, {
            width: 60,
            src: row.thumbnail || defaultThumbnail,
            fallbackSrc: defaultThumbnail,
            style: 'border-radius: 4px;'
        })
    },
    {
        title: 'Title',
        key: 'title',
        width: 200,

        sorter: (a, b) => a.title?.localeCompare(b.title),
        render: (row) => h('div', {
            class: 'song-info',
        }, [
            h('div', { class: 'song-title' }, row.filename || 'Untitled'),
            h('div', { class: 'song-artist text-muted' }, row.artist || null)
        ])
    },
    {
        title: 'Duration',
        key: 'duration',
        width: 100,
        align: 'center'
    },
    {
        title: 'Format',
        key: 'format',
        width: 100,
        filterOptions: [
            { label: 'MP3', value: 'MP3' },
            { label: 'MP4', value: 'MP4' },
            { label: 'FLAC', value: 'FLAC' }
        ],
        filter: (value, row) => row.format?.includes(value)
    },
    {
        title: 'Quality',
        key: 'quality',
        width: 100
    },
    {
        title: 'Time',
        key: 'time',
        width: 100,
        sorter: (a, b) => parseFloat(a.timestamp || 0) - parseFloat(b.timestamp || 0),
        render: (row) => row.timestamp ? formatDistanceToNow(new Date(row.timestamp).toLocaleString()) : null
    },
    {
        title: 'Size',
        key: 'size',
        width: 100,
        sorter: (a, b) => parseFloat(a.filesize || 0) - parseFloat(b.filesize || 0),
        render: (row) => row.filesize ? (row.status != 'completed' ? formatFileSize(row.downloadedSize) / formatFileSize(row.filesize) : formatFileSize(row.filesize)) : 'Unknown'
    },
    createStatusColumn(),
    createActionsColumn()
]

const rowKey = (row) => row.id

// Methods
const handleDownload = async () => {
    if (!checkedRowKeys.value.length) return

    message.info(`Downloading ${checkedRowKeys.value.length} items`)
}

const handleRetry = async (row) => {
    message.loading(`Retrying download ${row.filename}`)
    // console.log('retring',row.url)
    const r = await downloadStore.download_file('inst/Nick/download', row.id, row.url)
    if (r) message.info(r)
    else message.success("done")

}

const handleRetrySelected = async () => {
    message?.loading(`Retrying ${checkedRowKeys.value.length} downloads`)
    for (const id of checkedRowKeys.value) {
        const row = downloads.value.find(d => d.id === id)
        const r = await downloadStore.download_file('inst/Nick/download', row.id, row.url)
        if (r) message.error(r)
        else message.success("done")

    }
    clearSelection()
}

const handleDelete = async (id) => {
    message?.info(`Deleted download ${id}`)
    await deleteFile(id)
    await getDownloads()
}

const handleDeleteSelected = async () => {
    const selectedIds = checkedRowKeys.value

    if (!selectedIds.length) {
        message.warning("No downloads selected")
        return
    }


    for (const id of selectedIds) {
        await deleteFile(id)
    }

    message?.info(`Deleted ${selectedIds.length} download(s)`)

    await getDownloads()
    clearSelection()
}


const selectAllRows = () => {
    checkedRowKeys.value = downloads.value.map(item => item.id)
}

const clearSelection = () => {
    checkedRowKeys.value = []
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(() => {
    getDownloads()
})
</script>

<style scoped>
.download-selection-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

.download-table {
    --n-border-color: #eee;
    --n-th-color: #f8f9fa;
}

.action-bar {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
}

.batch-actions {
    display: flex;
    justify-content: flex-start;
    padding-bottom: 16px;
    overflow-x: auto;
}

.download-button {
    min-width: 200px;
}

.song-info {
    display: flex;
    flex-direction: column;
}

.song-title {
    font-weight: 500;
}

.song-artist {
    font-size: 0.9em;
    color: #666;
}

.text-muted {
    color: #666;
}

.action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
}
</style>