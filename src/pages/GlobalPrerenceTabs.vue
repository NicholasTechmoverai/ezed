<template>
    <div>
        <n-space align="center" size="small">
            <n-dropdown :options="languageOptions" trigger="click" @select="onSelectLanguage">
                <n-button quaternary class="flex flex-row items-center gap-2">
                    <span :class="`fi fi-${selectedLanguage.flag}`"></span>
                    <span>{{ selectedLanguage.label }}</span>
                </n-button>
            </n-dropdown>
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
import { ref, watch } from 'vue'
import { useUserStore } from '../store/userStore'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'

const userStore = useUserStore()
const isDark = ref(userStore.theme === 'dark')

watch(isDark, (val) => {
    userStore.setTheme(val ? 'dark' : 'light')
})

const languages = [
  { label: 'English', value: 'en', flag: 'us' },          // 🇺🇸
  { label: '中文', value: 'zh', flag: 'cn' },               // Chinese - 🇨🇳
  { label: 'Українська', value: 'uk', flag: 'ua' },       // Ukrainian - 🇺🇦
  { label: 'हिन्दी', value: 'hi', flag: 'in' },            // Hindi - 🇮🇳
  { label: 'Swahili', value: 'sw', flag: 'ke' },        // Swahili - 🇰🇪
  { label: 'العربية', value: 'ar', flag: 'sa' }           // Arabic - 🇸🇦
]

const selectedLanguage = ref(languages[0])

const languageOptions = languages.map(lang => ({
    label: lang.label,
    key: lang.value,
    value: lang.value,
}))

function onSelectLanguage(value) {
    const lang = languages.find(l => l.value === value)
    if (lang) {
        selectedLanguage.value = lang
        // Your language switching logic here
    }
}
</script>
