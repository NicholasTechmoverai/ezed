import { defineStore } from 'pinia'
import { ref } from 'vue'
import { addTask_db, deleteTask_db, getAllTasks_db } from '../db/activeState'

export const useStateStore = defineStore('stateStore', () => {
  const activeTab = ref('main')
  const loadingBar = ref(0) // 0-finish,1-start,2-error
  const openedTasks = ref([])

  async function init() {
    try {
      const tasksFromDb = await getAllTasks_db()
      openedTasks.value = (tasksFromDb || []).map(t => ({ ...t }))
    } catch (err) {
      console.error('stateStore.init failed:', err)
    }
  }

  function addTask(task) {
    if (!task || !task.id) {
      console.warn('addTask expects a task object with an id')
      return
    }

    const i = openedTasks.value.findIndex(t => t.id === task.id)
    if (i !== -1) {
      openedTasks.value[i] = { ...openedTasks.value[i], ...task }
    } else {
      openedTasks.value.push(task)
    }

    addTask_db(task).catch(err => {
      console.error('addTask_db failed:', err)
    })
  }

  function removeTask(id) {
    openedTasks.value = openedTasks.value.filter(task => task.id !== id)
    deleteTask_db(id).catch(err => {
      console.error('deleteTask_db failed:', err)
    })
  }

  function setActiveTab(value) {
    activeTab.value = value
  }

 /**
   * use 0->finish, 1->start, ->2-error
   @param -set loading bar with 0-finish ,1-start,2-error
   */
  function setLoadingBar(value) {
    loadingBar.value = value
  }

  return {
    init,
    setActiveTab,
    setLoadingBar,
    addTask,
    removeTask,
    activeTab,
    loadingBar,
    openedTasks
  }
})
