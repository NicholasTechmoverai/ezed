<template>
  <n-layout has-sider class="min-h-screen">
    <div v-if="!isMobile">
        <SideMenu />

    </div>


    <!-- Main Layout -->
    <n-layout>
      <!-- Header -->
      <n-layout-header bordered class="flex flex-col  p-3">
        <HeaderPage />
        <SecondLayerHeader />
      </n-layout-header>

      <!-- Main Content -->
      <n-layout-content style="padding: 24px;">
        <MainContentPage />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup>
import HeaderPage from './HeaderPage.vue';
import SecondLayerHeader from './SecondLayerHeader.vue';
import MainContentPage from './MainContentPage.vue';
import SideMenu from './SideMenu.vue';
import { useIsMobile } from '../reusables';

const isMobile = useIsMobile()
</script>
