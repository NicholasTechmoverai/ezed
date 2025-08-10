<template>
    
    <n-tabs type="segment" animated class="overflow-x-auto whitespace-nowrap scrollbar-thin">
        <n-tab-pane v-for="feature in downloadFeatures" :key="feature.id" :name="feature.id" class="sticky p-2 top-0 border rounded-2xl bg-white/30 dark:bg-gray-8/10 backdrop-blur-2xl">
            <template #tab>
                <n-tooltip trigger="hover">
                    <template #trigger>
                        <span class="truncate-tab">{{ feature.label }}</span>
                    </template>
                    {{ feature.label }}
                </n-tooltip>
            </template>
  <n-watermark
    :content="SITEMETA.name"
    cross
    selectable
    :font-size="16"
    :line-height="16"
    :width="192"
    :height="128"
    :x-offset="12"
    :y-offset="28"
    :rotate="-15"
  >
            <div class="p-2 py-10">
                <component :is="feature.component"  :screenShot="feature.image" v-if="feature.component" />
            </div>
  </n-watermark>
        </n-tab-pane>
    </n-tabs>
</template>

<script setup>


import DownloadProgressShot from "../assets/downloadProgressShot.png"
import Downloads from "../assets/LandscapeDownloadShot.png"
import inputCardShot from "../assets/inputCardShot.png"
import QualitySelectionShot from "../assets/qualitySelectionShot.png"
import ShotDisplayer from './ShotDisplayer.vue';
import { Sitemap } from "@vicons/fa";
import { SITEMETA } from "../utils";
import { useI18n } from 'vue-i18n'
import { computed } from "vue";
const { tm } = useI18n()


const downloadFeatures = computed(() => {
  const labels = tm('downloadFeatures') // This will return translated array
  return [
    { id: "direct-input", label: labels[0], icon: "📥", image: inputCardShot, component: ShotDisplayer },
    { id: "progress-visualization", label: labels[1], icon: "📊", image: DownloadProgressShot, component: ShotDisplayer },
    { id: "resume-support", label: labels[2], icon: "⏯️", image: DownloadProgressShot, component: ShotDisplayer },
    { id: "quality-options", label: labels[3], icon: "✨", image: QualitySelectionShot, component: ShotDisplayer },
    { id: "playlist-support", label: labels[4], icon: "🎵", image: Downloads, component: ShotDisplayer },
    { id: "manga-downloads", label: labels[5], icon: "🎵", image: Downloads, component: ShotDisplayer }
  ]
})

</script>

<style scoped>
.truncate-tab {
    display: inline-block;
    max-width: 110px;
    /* matches tab-style */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
}

@media (max-width: 640px) {

    /* On small devices */
    .truncate-tab {
        max-width: 80px;
        /* tighter space for small screens */
    }
}


@media (max-width: 500px) {

    /* On small devices */
    .truncate-tab {
        max-width: 50px;
        /* tighter space for small screens */
    }
}

.feature-icon {
    font-size: 1.2rem;
}
</style>
