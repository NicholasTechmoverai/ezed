<template>
  <div class="flex flex-row overflow-x-auto p-2 space-x-1 scrollbar scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200">
    <n-tag
      v-for="task in stateStore.openedTasks"
      :key="task.id"
      closable
      @close="handleClose(task.id)"
      @click="handleOpen(task.url)"
      type="success"
      size="medium"
    >
      {{ task.name }}
    </n-tag>
    
  </div>
  
</template>

<script setup>
import { ref } from 'vue';
import { useStateStore } from '../store/stateStore';
import router from '../router';

const stateStore = useStateStore()
const handleOpen= (url) => {
  router.push(url)
};
const handleClose = (id) => {
  stateStore.removeTask(id)
};
</script>
<style scoped>
/* ./src/assets/styles/scrollbar.css */
::-webkit-scrollbar {
  width: 2px;
  height: 2px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 8px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>