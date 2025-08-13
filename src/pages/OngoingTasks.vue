<template>
  <n-tabs
    type="card"
    size="small"
    animated
    closable
    :value="activeTaskId"
    @update:value="handleOpenById"
    @close="handleClose"
    class="overflow-x-auto whitespace-nowrap scrollbar-thin"
  >
    <n-tab-pane
      v-for="task in stateStore.openedTasks"
      :key="task.id"
      :name="task.id"
    >
      <template #tab>
        <n-tooltip trigger="hover">
          <template #trigger>
            <span class="truncate-tab">{{ task.name }}</span>
          </template>
          {{ task.name }}
        </n-tooltip>
      </template>
    </n-tab-pane>
  </n-tabs>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStateStore } from '../store/stateStore'
import router from '../router'

const stateStore = useStateStore()
stateStore.init()
const activeTaskId = ref(null)

watch(
  () => stateStore.openedTasks,
  (tasks) => {
    if (!tasks.find(t => t.id === activeTaskId.value)) {
      activeTaskId.value = tasks[0]?.id || null
    }
  },
  { deep: true }
)

const handleOpenById = (id) => {
  const task = stateStore.openedTasks.find(t => t.id === id)
  if (task) {
    activeTaskId.value = id

    router.push(task.url?task.url:`/h/yt/${id}`)
  }
}

const handleClose = (id) => {
  stateStore.removeTask(id)
}
</script>

<style scoped>
.truncate-tab {
  display: inline-block;
  max-width: 100px; /* matches tab-style max-width */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
