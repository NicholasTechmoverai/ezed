<template>
    <div>
        <n-space align="center" size="small">
            <n-switch v-model:value="isDark" size="small">
                <template #checked-icon>
                    <n-icon :component="MoonOutline" />
                </template>
                <template #unchecked-icon>
                    <n-icon :component="SunnyOutline" />
                </template>
            </n-switch>
        </n-space>

    </div>
</template>

<script setup>
import { ref ,watch} from 'vue';
import { useUserStore } from '../store/userStore';
const userStore = useUserStore()

const isDark = ref(userStore.theme === 'dark')

watch(isDark, (val) => {
  userStore.setTheme(val ? 'dark' : 'light')
})

</script>