<template>
  <div class="p-6 text-center">
    <h1 class="text-2xl font-bold mb-4">📤 Shared to e-zed</h1>

    <div v-if="loading" class="text-gray-500">Processing shared content...</div>

    <div v-else>
      <div v-if="shareData.text">
        <h2 class="font-semibold">Shared Text:</h2>
        <p class="bg-gray-100 p-2 rounded">{{ shareData.text }}</p>
      </div>

      <div v-if="shareData.url" class="mt-4">
        <h2 class="font-semibold">Shared URL:</h2>
        <a :href="shareData.url" target="_blank" class="text-blue-500 underline">
          {{ shareData.url }}
        </a>
      </div>

      <div v-if="shareData.files.length" class="mt-4">
        <h2 class="font-semibold">Shared Files:</h2>
        <div v-for="(file, index) in shareData.files" :key="index" class="mt-2">
          <img
            v-if="file.type.startsWith('image/')"
            :src="file.preview"
            alt="Shared Image"
            class="max-w-xs mx-auto rounded"
          />
          <video
            v-else-if="file.type.startsWith('video/')"
            controls
            class="max-w-xs mx-auto rounded"
          >
            <source :src="file.preview" :type="file.type" />
          </video>
          <p class="text-gray-600">{{ file.name }} ({{ file.type }})</p>
        </div>
      </div>

      <button
        @click="goHome"
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
  files: []
})

onMounted(async () => {
  try {
    // Parse POST form data from the Web Share Target API
    const formData = await getFormDataFromRequest()
    shareData.value.text = formData.get('text') || ''
    shareData.value.url = formData.get('url') || ''

    const file = formData.get('file')
    if (file && file.name) {
      shareData.value.files.push({
        name: file.name,
        type: file.type,
        preview: URL.createObjectURL(file)
      })
    }
  } catch (err) {
    console.error('Error reading shared data:', err)
  } finally {
    loading.value = false
  }
})

function goHome() {
  router.push('/')
}

// Helper to parse the incoming POST body
async function getFormDataFromRequest() {
  // Service workers intercept this request when installed PWA is launched from share
  if ('launchQueue' in window) {
    return new Promise((resolve) => {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (!launchParams.files.length) return resolve(new FormData())

        const fileHandles = await Promise.all(
          launchParams.files.map(f => f.getFile())
        )
        const fd = new FormData()
        fileHandles.forEach((file) => fd.append('file', file))
        resolve(fd)
      })
    })
  }

  // Fallback for browsers that send POST with multipart/form-data
  const response = await fetch(window.location.href, { method: 'POST' })
  return await response.formData()
}
</script>
