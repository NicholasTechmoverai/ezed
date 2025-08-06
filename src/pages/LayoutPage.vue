<template>
  <n-layout has-sider class="min-h-screen">
    <div v-if="!isMobile">
      <SideMenu />

    </div>


    <!-- Main Layout -->
    <n-layout>
      <!-- Header -->
      <n-layout-header bordered class="flex flex-col  p-3 sticky top-0">
        <HeaderPage />
        <SecondLayerHeader />
      </n-layout-header>

      <!-- Main Content -->
      <n-layout-content  class="">
        <Transition enter-active-class="transition-transform transition-opacity duration-300 ease-out"
          enter-from-class="translate-x-4 opacity-0" enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition-transform transition-opacity duration-200 ease-in"
          leave-from-class="translate-x-0 opacity-100" leave-to-class="translate-x-4 opacity-0">
          <router-view />
        </Transition>
        <LoadingBarTrigger />
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
import { useLoadingBar } from 'naive-ui'
import { useStateStore } from '../store/stateStore';
import { watch } from 'vue';
const stateStore = useStateStore()
  const loadingBar = useLoadingBar()

const loadShit = () => {
stateStore.setLoadingBar(1)  
setTimeout(() => {
stateStore.setLoadingBar(0)  
  }, 3000);

}
loadShit()

watch(
  () => stateStore.loadingBar,
  (newVal) => {
    switch (newVal) {
      case 0:
        loadingBar.finish()
        break
      case 1:
        loadingBar.start()
        break
      case 2:
        loadingBar.error()
        break
      default:
        loadingBar.finish()
        break
    }
  }
)

const isMobile = useIsMobile()
</script>
