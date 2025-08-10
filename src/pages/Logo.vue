<script setup >
import { SITEMETA } from '../utils';

</script>

<template>
  <router-link to="/" class="brand-link">
    <img :src="SITEMETA.logo" :alt="SITEMETA.name || 'Site Logo'"
      class="w-9 h-8 rounded-2xl shadow-lg dark:shadow-gray-800/50 transition-all duration-300"
      :class="{ 'rotate-[15deg]': isHovered }" />
    <!-- <n-gradient-text :size="24" type="primary" class="font-bold">
      Zed
    </n-gradient-text> -->
  </router-link>
</template>