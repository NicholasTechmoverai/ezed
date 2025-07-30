<template>
    <div class="flex flex-row items-center gap-2">
        <!-- Tooltip Menu Trigger -->
        <n-tooltip trigger="click"  placement="bottom-end" :show-arrow="false">
            <template #trigger>
                <n-icon size="large" class="cursor-pointer" aria-label="Menu options">
                    <Menu2 />
                </n-icon>
            </template>

            <!-- Tooltip Content -->
            <template #default>
                <n-space size="small">
                    <n-button size="tiny" secondary>
                        <n-icon>
                            <Youtube />
                        </n-icon>
                         Youtube</n-button>
                    <n-button size="tiny" secondary>
                         <n-icon>
                            <Facebook />
                        </n-icon>
                        facebook</n-button>
                    <n-button size="tiny" secondary> <n-icon>
                            <Instagram />
                        </n-icon>
                        Intagram</n-button>
                    <n-button size="tiny" secondary> <n-icon>
                            <Tiktok />
                        </n-icon>
                        Tiktok</n-button>
                    <n-button size="tiny" secondary>x</n-button>
                </n-space>
            </template>
        </n-tooltip>
        <n-input size="medium" class="!max-w-[400px] shrink-0" round placeholder="Large" />

    </div>
</template>

<script setup>
import { NTooltip, NSpace, NButton, NIcon } from 'naive-ui'
import { Menu2 } from '@vicons/tabler'
import { Facebook, Youtube, Instagram, Tiktok } from '@vicons/fa'

</script>

<style scoped>
.tooltip-menu {
    display: inline-block;
    padding: 4px;
}
</style>
