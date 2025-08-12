<script setup>
import { computed, ref, onMounted } from 'vue'
import { allSites } from '../composables'
import { getAllFiles } from '../db/download'
import { useDownloadStore } from '../store/downloadStore'
import { STATUS_CONFIG } from '../utils'

const downloadStore = useDownloadStore()

const files = ref([])
const siteCounts = ref({})
const isLoading = ref(true)

onMounted(async () => {
  try {
    const result = await getAllFiles()
    files.value = Array.isArray(result) ? result : []
  } catch (error) {
    console.error('Failed to load files:', error)
  } finally {
    isLoading.value = false
  }
  getCountBySite()
})

const getCountByStatus = (status) =>
  files.value.filter(file => file.status === status || file.status === status.toLowerCase()).length

const getCountBySite = (site = null) => {
  if (site) return files.value.filter(file => file.key === site).length

  for (const siteObj of allSites) {
    siteCounts.value[siteObj.key] = files.value.filter(file => file.key === siteObj.key).length
  }
}


const totalDownloads = computed(() => files.value.length)
const ongoingDownloadsCount = computed(() => downloadStore.onGoingDownloads.length || 0)

const openTab = (filterKey, filterType = 'site') => {
  console.log(`Filter by ${filterType}:`, filterKey)
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <n-h1 class="text-3xl font-bold mb-1">Downloads Manager</n-h1>
        <n-text depth="3" class="text-sm">Manage your downloaded content</n-text>
      </div>
      <div class="flex items-center gap-6">
        <n-statistic label="Total Downloads" class="text-right">
          <template #suffix>
            <n-skeleton v-if="isLoading" text width="60%" />
            <template v-else>{{ totalDownloads }}</template>
          </template>
        </n-statistic>
        <n-statistic label="Active Downloads" class="text-right">
          <template #suffix>
            <n-skeleton v-if="isLoading" text width="60%" />
            <template v-else>{{ ongoingDownloadsCount }}</template>
          </template>
        </n-statistic>
      </div>
    </header>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <n-card title="Downloads by Site" size="small" hoverable>
        <template #header-extra>
          <n-tag type="primary" size="small">{{ allSites.length }} Sites</n-tag>
        </template>

        <n-skeleton v-if="isLoading" text :repeat="allSites.length" height="24px" />

        <n-list v-else bordered hoverable>
          <n-list-item v-for="site in allSites" :key="site.key">
            <div class="flex justify-between items-center w-full">
              <n-button size="small" secondary class="flex items-center gap-2" @click="openTab(site.key, 'site')">
                <n-icon :component="site.icon" />
                <span>{{ site.label }}</span>
              </n-button>
              <n-tag :bordered="false" :type="siteCounts[site.key] ? 'primary' : 'default'">
                {{ siteCounts[site.key] }}
              </n-tag>
            </div>
          </n-list-item>
        </n-list>
      </n-card>

      <n-card title="Downloads by Status" size="small" hoverable>
        <template #header-extra>
          <n-tag type="primary" size="small">
            {{ Array.isArray(STATUS_CONFIG) ? STATUS_CONFIG.length : Object.keys(STATUS_CONFIG).length }} Statuses
          </n-tag>
        </template>

        <n-skeleton v-if="isLoading" text
          :repeat="Array.isArray(STATUS_CONFIG) ? STATUS_CONFIG.length : Object.keys(STATUS_CONFIG).length"
          height="24px" />

        <n-list v-else bordered hoverable>
          <n-list-item v-for="status in (Array.isArray(STATUS_CONFIG) ? STATUS_CONFIG : Object.values(STATUS_CONFIG))"
            :key="status.message">
            <div class="flex justify-between items-center w-full">
              <n-button size="small" :type="status.type" class="flex items-center gap-2"
                @click="openTab(status.message, 'status')">
                <n-icon :component="status.icon" />
                <span>{{ status.message }}</span>
              </n-button>
              <n-tag :bordered="false" :type="getCountByStatus(status.message) ? status.type : 'default'">
                {{ getCountByStatus(status.message) }}
              </n-tag>
            </div>
          </n-list-item>
        </n-list>
      </n-card>
    </section>

    <n-card v-if="ongoingDownloadsCount > 0" title="Active Downloads" size="small" hoverable>
      <n-alert type="info" :show-icon="false" class="mb-0">
        You have {{ ongoingDownloadsCount }} active downloads in progress
      </n-alert>
    </n-card>
  </div>
</template>

<style scoped>
.n-card {
  border-radius: 10px;
}

.n-list-item {
  padding: 8px 12px;
}

.n-button {
  transition: all 0.2s ease;
}

.n-button:hover {
  transform: translateY(-1px);
}

.grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
