<template>
  <div class="flex items-center justify-center min-h-[150px] lg:min-h-[400px]">
    <img
      v-if="currentScreenshot"
      :src="currentScreenshot"
      alt="Screenshot preview"
      class="w-full max-w-[900px] h-auto rounded-lg shadow-md transition-opacity duration-300 min-h-300px"
    />
    <span v-else class="text-gray-500 text-sm">No screenshot available</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  screenShot: {
    type: String,
    default: ''
  }
})

const currentScreenshot = ref(props.screenShot)

// Watch for prop changes
watch(
  () => props.screenShot,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      currentScreenshot.value = newVal
      console.log('Screenshot updated:', newVal)
    }
  }
)
</script>
