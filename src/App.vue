<template>
  <n-config-provider :theme="resolvedTheme">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <RouterView/>
          </n-dialog-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup>
// import MainPage from './pages/LayoutPage.vue'
import { useThemeStore } from '@/store/themeStore'
import { computed } from 'vue'
import { darkTheme } from 'naive-ui'

const themeStore = useThemeStore()
const resolvedTheme = computed(() => themeStore.theme === 'dark' ? darkTheme : null)
</script>
