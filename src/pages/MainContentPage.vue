<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { NButton, NCard, NList, NListItem, NStatistic, NH1, NText, NTag, NIcon, NSkeleton, NProgress, NAlert } from 'naive-ui'
import { allSites } from '../composables'
import { getAllFiles } from '../db/download'
import { useDownloadStore } from '../store/downloadStore'
import { STATUS_CONFIG } from '../utils'

const downloadStore = useDownloadStore()
const files = ref([])
const isLoading = ref(true)
const error = ref(null)

// Fetch files on mount
onMounted(async () => {
  try {
    const result = await getAllFiles()
    files.value = Array.isArray(result) ? result : []
  } catch (err) {
    console.error('Failed to load files:', err)
    error.value = err.message || 'Failed to load download data'
  } finally {
    isLoading.value = false
  }
})

// Computed properties
const totalDownloads = computed(() => files.value.length)
const ongoingDownloadsCount = computed(() => downloadStore.onGoingDownloads.length || 0)

// Site counts
const siteCounts = computed(() => {
  const counts = {}
  allSites.forEach(site => {
    counts[site.key] = files.value.filter(file => file.key === site.key).length
  })
  return counts
})

// Status counts
const statusCounts = computed(() => {
  const counts = {}
  const statuses = Array.isArray(STATUS_CONFIG) ? STATUS_CONFIG : Object.values(STATUS_CONFIG)
  statuses.forEach(status => {
    counts[status.message] = files.value.filter(file => 
      file.status === status.message || file.status === status.message.toLowerCase()
    ).length
  })
  return counts
})

// Active downloads data
const activeDownloads = computed(() => downloadStore.onGoingDownloads)

const openTab = (filterKey, filterType = 'site') => {
  console.log(`Filter by ${filterType}:`, filterKey)
}
</script>

<template>
  <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
    <!-- Error message -->
    <n-alert v-if="error" type="error" title="Loading Error" class="mb-4">
      {{ error }} - Please try refreshing the page
    </n-alert>

    <!-- Header -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <n-h1 class="text-2xl sm:text-3xl font-bold mb-1">Downloads Manager</n-h1>
        <n-text depth="3" class="text-sm">Manage and monitor your downloaded content</n-text>
      </div>
      
      <div class="grid grid-cols-2 gap-4 w-full sm:w-auto">
        <n-card embedded size="small" class="rounded-xl">
          <n-statistic label="Total Downloads" class="text-center">
            <n-skeleton v-if="isLoading" text width="60%" />
            <template v-else>{{ totalDownloads }}</template>
          </n-statistic>
        </n-card>
        
        <n-card embedded size="small" class="rounded-xl">
          <n-statistic label="Active Downloads" class="text-center">
            <n-skeleton v-if="isLoading" text width="60%" />
            <template v-else>{{ ongoingDownloadsCount }}</template>
          </n-statistic>
        </n-card>
      </div>
    </header>

    <!-- Main cards grid -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Sites card -->
      <n-card title="Downloads by Site" size="medium" hoverable class="rounded-xl shadow-sm">
        <template #header-extra>
          <n-tag type="primary" size="small" round>{{ allSites.length }} Sites</n-tag>
        </template>

        <n-skeleton v-if="isLoading" text :repeat="4" height="36px" class="my-2" />
        
        <n-list v-else bordered hoverable class="py-1">
          <n-list-item v-for="site in allSites" :key="site.key">
            <div class="flex justify-between items-center w-full py-1">
              <n-button 
                size="medium" 
                secondary 
                class="flex items-center gap-2"
                @click="openTab(site.key, 'site')"
              >
                <n-icon :component="site.icon" class="text-xl" />
                <span class="font-medium">{{ site.label }}</span>
              </n-button>
              <n-tag 
                :bordered="false" 
                round
                :type="siteCounts[site.key] ? 'primary' : 'default'"
                size="medium"
              >
                {{ siteCounts[site.key] || 0 }}
              </n-tag>
            </div>
          </n-list-item>
        </n-list>
      </n-card>

      <!-- Status card -->
      <n-card title="Downloads by Status" size="medium" hoverable class="rounded-xl shadow-sm">
        <template #header-extra>
          <n-tag type="primary" size="small" round>
            {{ Array.isArray(STATUS_CONFIG) ? STATUS_CONFIG.length : Object.keys(STATUS_CONFIG).length }} Statuses
          </n-tag>
        </template>

        <n-skeleton v-if="isLoading" text 
          :repeat="Array.isArray(STATUS_CONFIG) ? STATUS_CONFIG.length : Object.keys(STATUS_CONFIG).length"
          height="36px" class="my-2"
        />
        
        <n-list v-else bordered hoverable class="py-1">
          <n-list-item v-for="status in (Array.isArray(STATUS_CONFIG) ? STATUS_CONFIG : Object.values(STATUS_CONFIG))"
            :key="status.message">
            <div class="flex justify-between items-center w-full py-1">
              <n-button 
                size="medium" 
                :type="status.type" 
                class="flex items-center gap-2"
                @click="openTab(status.message, 'status')"
              >
                <n-icon :component="status.icon" class="text-xl" />
                <span class="font-medium">{{ status.message }}</span>
              </n-button>
              <n-tag 
                :bordered="false" 
                round
                :type="statusCounts[status.message] ? status.type : 'default'"
                size="medium"
              >
                {{ statusCounts[status.message] || 0 }}
              </n-tag>
            </div>
          </n-list-item>
        </n-list>
      </n-card>
    </section>

    <!-- Active downloads section -->
    <section v-if="ongoingDownloadsCount > 0">
      <n-card title="Active Downloads" size="medium" hoverable class="rounded-xl shadow-sm">
        <template #header-extra>
          <n-tag type="info" size="small" round>{{ ongoingDownloadsCount }} in progress</n-tag>
        </template>
        
        <n-list hoverable>
          <n-list-item v-for="download in activeDownloads" :key="download.id" class="py-3">
            <div class="flex flex-col gap-2 w-full">
              <div class="flex justify-between items-center">
                <span class="font-medium truncate max-w-[70%]">{{ download.fileName }}</span>
                <n-tag type="info" size="small">{{ download.progress }}%</n-tag>
              </div>
              <n-progress
                type="line"
                :percentage="download.progress"
                :indicator-placement="'inside'"
                :height="20"
                status="info"
                processing
              />
              <div class="flex justify-between text-xs text-gray-500">
                <span>{{ download.site }}</span>
                <span>{{ download.speed }}/s</span>
              </div>
            </div>
          </n-list-item>
        </n-list>
      </n-card>
    </section>

    <!-- Empty state -->
    <n-card v-else-if="!isLoading" title="No Active Downloads" size="medium" class="rounded-xl">
      <n-alert type="info" :show-icon="false" class="text-center">
        You don't have any active downloads at the moment
      </n-alert>
    </n-card>
  </div>
</template>

<style scoped>
.n-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.n-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.n-list-item {
  transition: background-color 0.2s ease;
}

.n-button {
  transition: all 0.2s ease;
}

.n-button:hover {
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .n-statistic {
    padding: 8px;
  }
  
  .n-card {
    border-radius: 12px;
  }
}
</style>