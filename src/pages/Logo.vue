<template>
  <router-link to="/" class="brand-link flex items-center gap-2">
    <img :src="SITEMETA.logo" :alt="SITEMETA.name || 'Site Logo'"
      class="w-10 h-8 rounded-xl shadow-lg dark:shadow-gray-800/50 transition-all duration-300"
      :class="{ 'w-10 h-8': size == 2, 'w-9 h-8': size == 1, 'w-8 h-8': size == 0, 'rounded-xl': rounded == 1, 'rounded-2xl': rounded == 2, 'rounded-full': rounded == 3 }" />
    <n-text v-if="showName" strong class="text-2xl font-bold" :class="{ color: SITEMETA.theme_color }">{{ SITEMETA.name
      }}</n-text>
  </router-link>
</template>

<script setup>
import { SITEMETA } from '../utils';

const props = defineProps({
  showName: {
    type: Boolean,
    default: true
  },
  rounded: {
    type: Number,
    default: 2
  },
  size: {
    type: Number,
    default: 2
  }
})
</script>
