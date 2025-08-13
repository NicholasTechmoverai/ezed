<template>
  <div class="download-selection-container">
    <n-card :title="listName ? listName : 'Playlist Downloader'" hoverable class="">
      <n-space vertical>
        <n-alert type="info" :show-icon="false">
          You have selected {{ checkedRowKeys.length }} item{{ checkedRowKeys.length !== 1 ? 's' : '' }}
          <span v-if="listSongs.length > 0" class="absolute right-1"> {{ listSongs.length }} Songs</span>
        </n-alert>

        <div class="batch-actions">
          <n-button-group>
            <n-button secondary @click="selectAllRows" :disabled="listSongs.length === 0">
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
            <!-- New format selection button -->
            <n-popselect
              v-model:value="batchFormat"
              :options="formatOptions"
              @update:value="applyBatchFormat"
              trigger="click"
              size="small"
              :disabled="!checkedRowKeys.length"
            >
              <n-button secondary :disabled="!checkedRowKeys.length">
                <template #icon>
                  <n-icon>
                    <FormatIcon />
                  </n-icon>
                </template>
                Set Format
              </n-button>
            </n-popselect>
            <n-button type="success" @click="handleDownloadSelected" :disabled="!checkedRowKeys.length">
              <template #icon>
                <n-icon>
                  <DownloadOutline />
                </n-icon>
              </template>
              Download Selected
            </n-button>
            <n-button type="error" @click="handleDeleteSelected" :disabled="!checkedRowKeys.length">
              <template #icon>
                <n-icon>
                  <DeleteIcon />
                </n-icon>
              </template>
              Delete Selected
            </n-button>
            <n-tooltip placement="bottom" trigger="hover">
              <template #trigger>
                <n-button type="warning" @click="handleSongsRefetch">
                  <template #icon>
                    <n-icon>
                      <RefreshIcon />
                    </n-icon>
                  </template>
                  refetch songs
                </n-button>
              </template>
              refetch playlist songs
            </n-tooltip>
          </n-button-group>
        </div>
        <n-spin :show="isLoading">
          <n-data-table :columns="columns" :data="listSongs" :pagination="pagination" :row-key="rowKey"
            v-model:checked-row-keys="checkedRowKeys" :bordered="true" class="download-table" />
          <template #description>
            fetching list songs
          </template>
        </n-spin>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, h, onMounted, watch } from 'vue'
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
  NTag,
  NSelect,
  NPopselect
} from 'naive-ui'
import {
  Download as DownloadIcon,
  DownloadOutline,
  RefreshCircleOutline as RefreshIcon,
  Trash as DeleteIcon,
  Albums as SelectAllIcon,
  Close as ClearAllIcon,
  InformationCircle as InfoIcon,
  Options as FormatIcon
} from '@vicons/ionicons5'
import { deleteFile, getAllFiles } from '../db/download'
import defaultThumbnail from "../assets/defaultThumbnail.png"
import { formatDistanceToNow } from 'date-fns'
import router from '../router'
import { useRoute } from 'vue-router'

import { useMessage } from 'naive-ui'
import { useDownloadStore } from '../store/downloadStore'
import { useStateStore } from '../store/stateStore'
import { generateUUID } from '../reusables'
import { AUTO_DOWNLOAD_FORMATS } from '../utils/others'

const downloadStore = useDownloadStore()
const route = useRoute()
const abb_r = ref("yt")
const listSongs = ref([])
const listName = ref('untitled')
const isLoading = ref(false)
const currentListId = computed(() => route.params.list_id || null)
const stateStore = useStateStore()
const message = useMessage()

// New reactive states for format management
const batchFormat = ref(null)
const formatOptions = computed(() => 
  AUTO_DOWNLOAD_FORMATS.map(f => ({ label: f.label, value: f.value }))
)

const getSongs = async () => {
  try {
    if (!downloadStore.listSongs[currentListId.value]) {
      const task = stateStore.openedTasks.find(t => t.id === currentListId.value)
      if (!task) return message.error("List songs Not found!!")
      handleSongsRefetch(task.listUrl)
      return
    }
    listSongs.value = downloadStore.listSongs[currentListId.value].songs
    listName.value = downloadStore.listSongs[currentListId.value].name
  } catch (error) {
    message.error('Error fetching file:', error)
    console.error('Error fetching file:', error)
  }
}

watch(
  () => downloadStore.listSongs[currentListId.value],
  (newVal) => {
    listSongs.value = newVal?.songs || [];
    listName.value = newVal?.name || "";
    isLoading.value = newVal?.isLoading || false
  },
  { deep: true, immediate: true }
);

// Reactive state
const checkedRowKeys = ref([])

// Computed properties
const selectedItems = computed(() =>
  listSongs.value.filter(item => checkedRowKeys.value.includes(item.id))
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

// Format management functions
const applyBatchFormat = () => {
  if (!batchFormat.value) return;
  
  checkedRowKeys.value.forEach(id => {
    const row = listSongs.value.find(r => r.id === id);
    if (row) {
      downloadStore.updateSongFormat(currentListId.value, row.id, batchFormat.value);
    }
  });
  
  message.success(`Format updated for ${checkedRowKeys.value.length} items`);
  batchFormat.value = null;
};

const updateSingleFormat = (row, newFormat) => {
  downloadStore.updateSongFormat(currentListId.value, row.id, newFormat);
};

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
            onPositiveClick: () => handleDownload(row)
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
                icon: () => h(NIcon, null, { default: () => h(DownloadOutline) })
              }
            ),
            default: () => 'Are you sure you want to retry this download?'
          }
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row)
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

// Enhanced format column with editable dropdown
const createFormatColumn = () => {
  return {
    title: 'Format',
    key: 'format',
    width: 180,
    filterOptions: formatOptions.value,
    filter: (value, row) => row.format === value,
    render(row) {
      return h(NSelect, {
        value: row.format,
        options: formatOptions.value,
        onUpdateValue: (value) => updateSingleFormat(row, value),
        size: 'small',
        clearable: true,
        placeholder: "Select format"
      })
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
      h('div', { class: 'song-title' }, row.title || 'Untitled'),
      h('div', { class: 'song-artist text-muted' }, row.artist || null)
    ])
  },
  {
    title: 'Url',
    key: 'url',
    width: 200,
    render: (row) => row.url
  },
  createFormatColumn(), // Use the new editable format column
  {
    title: 'Time',
    key: 'time',
    width: 100,
    sorter: (a, b) => parseFloat(a.timestamp || 0) - parseFloat(b.timestamp || 0),
    render: (row) => row.timestamp ? formatDistanceToNow(new Date(row.timestamp).toLocaleString()) : "_:_"
  },
  {
    title: 'Size',
    key: 'size',
    width: 100,
    sorter: (a, b) => parseFloat(a.filesize || 0) - parseFloat(b.filesize || 0),
    render: (row) => row.filesize ? (row.status != 'completed' ? 
      `${Math.round((row.downloadedSize / row.filesize) * 100)}%` : 
      formatFileSize(row.filesize)) : '--'
  },
  createStatusColumn(),
  createActionsColumn()
]

const rowKey = (row) => row.id

// Methods
const handleDownload = async (row) => {
  message.loading(`downloading ${row.title}`)
  const new_id = generateUUID()
  const itag = row.format || "18"  // Use row-specific format if available
  const r = await downloadStore.download_file('inst/Nick/download', new_id, row.url, itag)
  if (r) message.info(r)
  else message.success("done")
}

const handleDownloadSelected = async () => {
  message?.loading(`Downloading ${checkedRowKeys.value.length} songs`)
  for (const id of checkedRowKeys.value) {
    const row = listSongs.value.find(d => d.id === id)
    await handleDownload(row)
  }
  clearSelection()
}

const handleSongsRefetch = async (url = null) => {
  const username = "Nick";
  let url_ = url;

  if (!url_) {
    try {
      const task = stateStore.openedTasks.find(t => t.id === currentListId.value)
      if (!task?.listUrl) {
        return message.error("List URL not found!");
      }
      url_ = task.listUrl;
    } catch (err) {
      console.error("Error resolving list URL:", err);
      return message.error("Unable to fetch list URL.");
    }
  }

  await downloadStore.getListSongs(
    `${abb_r.value}/${username}/list`,
    url_,
    currentListId.value
  );
};

const handleDelete = async (row) => {
  if (!row?.url) return;
  message?.info(`Deleted download: ${row.title || row.url}`);
  await deleteFile(row.id);
  listSongs.value = listSongs.value.filter(s => s.url !== row.url);
};

const handleDeleteSelected = async () => {
  if (!checkedRowKeys.value.length) {
    message.warning("No list songs selected");
    return;
  }

  for (const songUrl of checkedRowKeys.value) {
    const songRow = listSongs.value.find(s => s.url === songUrl);
    if (songRow) {
      await handleDelete(songRow);
    }
  }

  message?.info(`Deleted ${checkedRowKeys.value.length} download(s)`);
  clearSelection();
};

const selectAllRows = () => {
  checkedRowKeys.value = listSongs.value.map(item => item.id || item.url)
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
  getSongs()
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
  gap: 8px;
  flex-wrap: wrap;
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

/* Ensure select dropdowns are visible */
.n-select {
  min-width: 150px;
}
</style>