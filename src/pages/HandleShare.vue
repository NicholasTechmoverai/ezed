<template>
  <div class="p-6 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">📤 Shared Content</h1>

    <div v-if="loading" class="text-gray-500">Loading shared content...</div>

    <div v-else>
      <div v-if="shareData.text">
        <h2 class="font-semibold">Text:</h2>
        <p class="bg-gray-100 p-2 rounded">{{ shareData.text }}</p>
      </div>

      <div v-if="shareData.url" class="mt-4">
        <h2 class="font-semibold">URL:</h2>
        <a :href="shareData.url" target="_blank" class="text-blue-500 underline">
          {{ shareData.url }}
        </a>
      </div>

      <button
        @click="handleDone"
        class="mt-6 px-4 py-2 bg-green-500 text-white rounded"
      >
        Done
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const shareData = ref({
  text: '',
  url: '',
  title: ''
})

// Open IndexedDB helper (same as sw.js)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('share-db', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('share-store')) {
        db.createObjectStore('share-store', { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get latest share data from IndexedDB
async function getLatestShareData() {
  const db = await openDB()
  const tx = db.transaction('share-store', 'readonly')
  const store = tx.objectStore('share-store')

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const all = request.result
      resolve(all.length ? all[all.length - 1] : null)
    }
    request.onerror = () => reject(request.error)
  })
}

onMounted(async () => {
  try {
    const data = await getLatestShareData()
    if (data) {
      shareData.value = data
    }
  } catch (e) {
    console.error('Failed to load share data:', e)
  } finally {
    loading.value = false
  }
})

async function handleDone() {
  // Optionally: clear share data from IndexedDB here if you want
  router.push('/h') // redirect home or anywhere
}
</script>
