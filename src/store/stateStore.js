// stores/themeStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStateStore = defineStore('stateStore', () => {
  const activeTab = ref('main')
  const loadingBar = ref(0) //0-finish,1-start,2-error
  const openedTasks = ref([
    // { name: "Song of Dawn", id: "id001" },
    // { name: "Midnight Echo", id: "id002" },
    // { name: "Golden Horizon", id: "id003" },
    // { name: "Electric Pulse", id: "id004" },
    // { name: "Rainy Roads", id: "id005" },
    // { name: "Silent Whispers", id: "id006" },
    // { name: "Neon Skies", id: "id007" },
    // { name: "Shadow Dance", id: "id008" },
    // { name: "Crystal Shore", id: "id009" },
    // { name: "Dreamer's Path", id: "id010" },
    // { name: "Firelight Anthem", id: "id011" },
    // { name: "Frozen Steps", id: "id012" },
    // { name: "Solar Bloom", id: "id013" },
    // { name: "Twilight Frame", id: "id014" },
    // { name: "Echoes Unfold", id: "id015" }
  ]);

function addTask(task) {
  openedTasks.value.push(task)
}

  function removeTask(id) {
    openedTasks.value = openedTasks.value.filter((task) => task.id !== id);

  }
  function setActiveTab(value) {
    activeTab.value = value
  }
  function setLoadingBar(value) {
    loadingBar.value = value
  }


  return {
    setActiveTab,
    setLoadingBar,
    addTask,
    removeTask,
    activeTab,
    loadingBar,
    openedTasks
  }
})
