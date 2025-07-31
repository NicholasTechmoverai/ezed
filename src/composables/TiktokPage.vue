<template>
  <n-space vertical align="center" class="p-6">
    <n-card title="📥 Instagram Downloader" class="w-full max-w-xl shadow-md">
      <n-spin :show="show">
    <template #description>
       {{loadingDescription}}
      </template>
        <n-space vertical :size="16">
          <n-input v-model:value="url" placeholder="Paste Instagram URL..." clearable @keydown.enter="handleDownload" />
          <n-button type="primary" :loading="show" :disabled="!url.trim() || show" @click="handleDownload" block>
            Download
          </n-button>
        </n-space>
      </n-spin>
    </n-card>

    <n-result v-if="downloaded" status="success" title="Download Complete"
      description="Your video has been successfully downloaded!" class="mt-6 animate-fade-in" />
  </n-space>
</template>

<script setup>
import { ref } from 'vue'

const url = ref('')
const downloaded = ref(false)
const show = ref(false)
const loadingDescription = ref('loading...')
function handleDownload() {
  if (!url.value.trim()) return

  show.value = true
  downloaded.value = false

  // Simulate download delay
  setTimeout(() => {
    downloaded.value = true
    show.value = false
  }, 2000)
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
