<template>
  <div class="download-selection-container ">
    <n-card title="Download Selection" hoverable class="">
      <n-space vertical>
        <n-alert type="info" :show-icon="false">
          You have selected {{ checkedRowKeys.length }} item{{ checkedRowKeys.length !== 1 ? 's' : '' }} for download
        </n-alert>

        <n-data-table
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
          :row-key="rowKey"
          v-model:checked-row-keys="checkedRowKeys"
          :bordered="true"
          class="download-table"
        />

        <div class="action-bar">
          <n-button 
            type="primary" 
            @click="handleDownload"
            :disabled="!checkedRowKeys.length"
            class="download-button"
          >
            <template #icon>
              <n-icon><DownloadIcon /></n-icon>
            </template>
            Download Selected ({{ checkedRowKeys.length }})
          </n-button>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed ,h} from 'vue'
import { NButton, NCard, NSpace, NDataTable, NAlert, NIcon,NImage } from 'naive-ui'
import { Download as DownloadIcon } from '@vicons/ionicons5'
import { generateUUID } from '../reusables'

// Sample data - in a real app this would come from an API
const sampleData = Array.from({ length: 10 }).map((_, index) => ({
  id: generateUUID(),
  title: `Song Title ${index + 1}`,
  artist: `Artist ${index + 1}`,
  duration: `${Math.floor(Math.random() * 4) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  format: ['MP3', 'MP4', 'FLAC'][Math.floor(Math.random() * 3)],
  quality: ['360p', '480p', '720p', '1080p'][Math.floor(Math.random() * 4)],
  thumbnail: `https://picsum.photos/100/100?random=${index}`,
  size: `${(Math.random() * 10 + 1).toFixed(1)} MB`,
  url: `/download/yt/${generateUUID()}`
}))

// Reactive state
const tableData = ref(sampleData)
const checkedRowKeys = ref([])

// Computed properties
const selectedItems = computed(() => 
  tableData.value.filter(item => checkedRowKeys.value.includes(item.id))
)

// Table configuration
const pagination = reactive({
  page: 1,
  pageSize: 5,
  showSizePicker: true,
  pageSizes: [5, 10, 20],
  onChange: (page) => { pagination.page = page },
  onUpdatePageSize: (pageSize) => {
    pagination.pageSize = pageSize
    pagination.page = 1
  }
})

const columns = [
  {
    type: 'selection',
    disabled: (row) => false // You can add logic to disable specific rows
  },
  {
    title: 'Thumbnail',
    key: 'thumbnail',
    render: (row) => h(NImage, {
      width: 60,
      src: row.thumbnail,
      fallbackSrc: 'https://via.placeholder.com/60',
      style: 'border-radius: 4px;'
    })
  },
  {
    title: 'Title',
    key: 'title',
    sorter: (a, b) => a.title.localeCompare(b.title),
    render: (row) => h('div', { class: 'song-info' }, [
      h('div', { class: 'song-title' }, row.title),
      h('div', { class: 'song-artist text-muted' }, row.artist)
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
    filter: (value, row) => row.format.includes(value)
  },
  {
    title: 'Quality',
    key: 'quality',
    width: 100
  },
  {
    title: 'Size',
    key: 'size',
    width: 100,
    sorter: (a, b) => parseFloat(a.size) - parseFloat(b.size)
  }
]

const rowKey = (row) => row.id

// Methods
const handleDownload = async () => {
  if (!checkedRowKeys.value.length) return
  
  console.log('Initiating download for:', selectedItems.value)
  // Here you would call your actual download method
  // await downloadSelectedItems(selectedItems.value)
  
  // Optional: Show success message
  window.$message?.success(`Downloading ${checkedRowKeys.value.length} items`)
}
</script>

<style scoped>
.download-selection-container {
  max-width: 1200px;
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
</style>