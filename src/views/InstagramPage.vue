<template>
    <div class="flex flex-col items-center p-6 w-full">
        <div class="relative" :style="{ width: 'var(--size)', height: 'var(--size)' }" style="--size: 180px">
            <n-progress type="multiple-circle" :stroke-width="8" :circle-gap="1" :percentage="progressValues"
                :color="progressColors" :rail-style="railStyles" :show-indicator="false">
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full">
                    <n-text depth="3" class="block text-sm mb-1 text-gray-500">
                        {{ statusMessage }}
                    </n-text>
                    <n-text strong class="block text-2xl font-semibold">
                        {{ activePercentage }}%
                    </n-text>
                </div>
            </n-progress>
        </div>

        <n-progress v-if="showDownloadProgress" type="line" indicator-placement="inside"
            :percentage="downloadPercentage" :color="themeVars.errorColor"
            :rail-color="changeColor(themeVars.errorColor, { alpha: 0.2 })" :height="10" :border-radius="4"
            class="w-full max-w-[400px] mt-6 transition-all duration-300">

        </n-progress>
        Downloading: {{ download.name || 'file' }} ({{ downloadPercentage }}%)

    </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useThemeVars } from 'naive-ui'

const themeVars = useThemeVars()

// Animation state
const percentage = ref(0)
const statusMessage = ref('Processing...')
const downloadPercentage = ref(60)
const showDownloadProgress = ref(true)

const download = ref({
    name: 'example.zip',
    id: '12345',
    thumbnail: ''
})

// Computed properties
const progressValues = computed(() => [
    percentage.value,
    (percentage.value + 15) % 100,
    (percentage.value + 30) % 100,
    (percentage.value + 45) % 100,
])

const progressColors = computed(() => [
    themeVars.value.infoColor,
    themeVars.value.successColor,
    themeVars.value.warningColor,
    themeVars.value.errorColor,
])

const railStyles = computed(() => [
    { stroke: themeVars.value.infoColor, opacity: 0.2 },
    { stroke: themeVars.value.successColor, opacity: 0.2 },
    { stroke: themeVars.value.warningColor, opacity: 0.2 },
    { stroke: themeVars.value.errorColor, opacity: 0.2 },
])

const activePercentage = computed(() => Math.floor(percentage.value))

// Animation loop
const animationInterval = setInterval(() => {
    percentage.value = (percentage.value + 0.5) % 100
}, 50)

// Clean up interval on component unmount
onUnmounted(() => {
    clearInterval(animationInterval)
})

// Simulate download progress
const simulateDownload = () => {
    showDownloadProgress.value = true
    downloadPercentage.value = 0
    const interval = setInterval(() => {
        if (downloadPercentage.value >= 100) {
            clearInterval(interval)
            statusMessage.value = 'Completed!'
            setTimeout(() => showDownloadProgress.value = false, 2000)
            return
        }
        downloadPercentage.value = Math.min(downloadPercentage.value + Math.random() * 5, 100)
    }, 300)
}

const changeColor = (color, options = { alpha: 1 }) => {
    return color.replace(/rgb\((.*)\)/, `rgba($1, ${options.alpha})`)
}
</script>

<style>
/* Animation for the progress circles */
.n-progress-circle-path {
    transition: stroke-dashoffset 0.3s ease;
}
</style>