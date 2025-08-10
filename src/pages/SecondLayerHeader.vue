<template>
    <div class="flex flex-row items-center gap-2">
        <div>
            <n-drawer v-model:show="drawerVisible" placement="left" size="240px" show-mask :mask-closable="true">
                <div class="relative p-1">
                    <div
                        class="p-4 flex items-center gap-2 justify-center border-b border-gray-200 dark:border-gray-700">
                        <img :src="SITEMETA.logo" :alt="SITEMETA.name || 'Site Logo'"
                            class="w-10 h-8 rounded-xl shadow-lg dark:shadow-gray-800/50 transition-all duration-300" />
                        <n-text v-if="!collapsed" strong class="text-2xl font-bold"
                            :class="{ color: SITEMETA.theme_color }">{{ SITEMETA.name }}</n-text>
                    </div>
                    <n-space vertical size="medium" class="p-4">
                        <n-button v-for="(site, index) in allSites" :key="index" size="medium" block
                            @click="openTab(site.key); drawerVisible = false">
                            <n-icon>
                                <component :is="site.icon" />
                            </n-icon>
                            {{ site.label }}
                        </n-button>
                    </n-space>
                </div>
            </n-drawer>
            <n-icon size="large" class="cursor-pointer" aria-label="Menu options" @click="drawerVisible = true">
                <Menu2 />
            </n-icon>
        </div>
        <div class="flex flex-row  p-2 space-x-2">
            <n-button text @click="toggleSearch">
                <n-icon size="large">
                    <SearchOutline />
                </n-icon>
            </n-button>

            <transition name="fade">
                <n-input v-if="showSearch" v-model:value="searchQuery" placeholder="Search..." size="small" clearable
                    round @blur="handleBlur" style="width: 200px" />
            </transition>
        </div>
        <OngoingTasks />
    </div>
</template>

<script setup>
import { NTooltip, NSpace, NButton, NIcon } from 'naive-ui'
import { Menu2 } from '@vicons/tabler'
import { SearchOutline } from '@vicons/ionicons5'
import { ref } from 'vue'
import OngoingTasks from './OngoingTasks.vue'
import router from '../router'
import { allSites } from '../composables'
import { useRoute } from 'vue-router'
import { useStateStore } from '../store/stateStore'
import { SITEMETA } from '../utils'
const showSearch = ref(false)
const route = useRoute()
const stateStore = useStateStore()
const searchQuery = ref('')
const drawerVisible = ref(false)

const toggleSearch = () => {
    showSearch.value = !showSearch.value
}

const handleBlur = () => {
    showSearch.value = false
}
const openTab = (tab) => {

    const currentTab = route.path.split('/')[2] || route.params?.child
    stateStore.setLoadingBar(1)


    if (currentTab === tab) {
        router.go(0)
    } else {
        router.push(`/h/${tab}`)
    }
    router.push(`/h/${tab}`)
    setInterval(() => {
        stateStore.setLoadingBar(0)

    }, 1000);

}

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: scaleX(0.8);
}
</style>