
<template>
  <n-layout has-sider class="min-h-screen">
    <SideMenu 
      v-if="!isMobile" 
      :collapsed="collapsed" 
      @update:collapsed="collapsed = $event" 
    />

    <n-layout-content 
      :native-scrollbar="false" 
      :style="{ marginLeft: contentMarginLeft }" 
      class="flex flex-col min-h-screen"
    >
      <n-layout-header
        bordered
        class="flex flex-col p-3 sticky top-0  z-30"
      >
        <HeaderPage />
        <SecondLayerHeader />
      </n-layout-header>

      <n-layout-content class="flex-1 overflow-auto">
        <Transition
          enter-active-class="transition-transform transition-opacity duration-300 ease-out"
          enter-from-class="translate-x-4 opacity-0"
          enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition-transform transition-opacity duration-200 ease-in"
          leave-from-class="translate-x-0 opacity-100"
          leave-to-class="translate-x-4 opacity-0"
        >
          <router-view />
        </Transition>
        <LoadingBarTrigger />
      </n-layout-content>
    </n-layout-content>
  </n-layout>
</template>

<script setup>
import HeaderPage from './HeaderPage.vue';
import SecondLayerHeader from './SecondLayerHeader.vue';
import MainContentPage from './MainContentPage.vue';

import SideMenu from './SideMenu.vue';
import { useIsMobile } from '../reusables';
import { useLoadingBar, useMessage } from 'naive-ui'
import { useStateStore } from '../store/stateStore';
import { watch } from 'vue';
const stateStore = useStateStore()
const loadingBar = useLoadingBar()
const message = useMessage()
const collapsed = ref(false);  
import { ref, computed } from 'vue';
import { usersSocket } from '../web_socket';
import { useNotificationSocket } from '../web_socket/useNotificationSocket';

const contentMarginLeft = computed(() => {
  if (isMobile.value) return '0px'; 
  return collapsed.value ? '64px' : '240px'; 
});
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
useNotificationSocket()

const isMobile = useIsMobile()

</script>
