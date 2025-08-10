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
import { computed } from 'vue'
import { darkTheme } from 'naive-ui'
import { useUserStore } from './store/userStore'

const userStore  = useUserStore()
const resolvedTheme = computed(() =>
  userStore.theme === 'dark' ? darkTheme : null
)
</script>
