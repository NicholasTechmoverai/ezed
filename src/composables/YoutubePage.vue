<template>
  <div>
    <n-tabs 
      type="segment" 
      v-model:value="activeTab" 
      @update:value="onTabChange" 
      animated
    >
      <n-tab-pane 
        v-for="tab in tabs" 
        :key="tab.name" 
        :name="tab.name" 
        :tab="tab.label" 
      />
    </n-tabs>
    <router-view />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const tabs = [
  { name: 'WonderWall', label: 'Wonderwall' },
  { name: 'YoutubeAutomatic', label: 'Automatic Mode' },
  { name: 'CustomConfig', label: 'Manual Mode' }
]

const router = useRouter()
const route = useRoute()
const activeTab = ref(null)

watch(
  () => route.name,
  (newRouteName) => {
    if (tabs.some(tab => tab.name === newRouteName)) {
      activeTab.value = newRouteName
    } else if (newRouteName === 'Youtube') {
      router.push({ name: 'WonderWall' })
    } else {
      activeTab.value = null
    }
  },
  { immediate: true }
)

function onTabChange(newTab) {
  if (newTab) {
    router.push({ name: newTab }).catch(() => {})
  }
}
</script>