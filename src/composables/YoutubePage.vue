<template>
  <div >
    <n-tabs type="segment" v-model:value="activeTab" animated>
      <n-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name" :tab="tab.label">
        <!-- <Transition enter-active-class="transition-transform transition-opacity duration-600 ease-out"
          enter-from-class="translate-x-10 opacity-0" enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition-transform transition-opacity duration-200 ease-in"
          leave-from-class="translate-x-0 opacity-100" leave-to-class="translate-x-4 opacity-0">
          <router-view />
        </Transition> -->
        <router-view />
      </n-tab-pane>
    </n-tabs>
  </div>

</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const tabs = [
  { name: 'wonderwall', url: '/h/yt/wonder-wall', label: 'Wonderwall' },
  { name: 'automatic', url: '/h/yt/automatic', label: 'Automatic Mode' },
  { name: 'custom-config', url: '/h/yt/custom-config', label: 'Custom Settings' }
]

const router = useRouter()
const route = useRoute()
const activeTab = ref(tabs[0].name)
const currentId = computed(() => route.params.id || null)
const currentListId = computed(() => route.params.list_id || null)
// On mount, set activeTab based on current route
onMounted(() => {
  const currentTab = tabs.find(tab => tab.url === route.path)
  if (currentTab) {
    activeTab.value = currentTab.name
  }
})

// Watch activeTab changes and push URL
watch(activeTab, (newTab) => {
  const tab = tabs.find(t => t.name === newTab)
  if (tab && tab.url !== route.path) {
    router.push(tab.url)
  }
})
</script>
