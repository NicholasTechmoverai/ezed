<template>
    <div class=" pt-12 pb-8 px-7 h-full">
        <div class=" w-[320px] h-[640px]  overflow-hidden  relative ">
            <img class="w-full h-full object-cover opacity-90 z-10 select-none pointer-events-none absolute top-0 "
                :src="phone_layout" alt="Background pattern" />
            <div class="w-full h-full  -z-0  opacity-100  rounded-4xl p-7 pt-15 box-border">
                <div class="flex flex-col justify-between items-center">
                    <img :src="SITEMETA.logo" :alt="SITEMETA.name || 'Site Logo'"
                        class="w-30 h-30  rounded-2xl shadow-lg dark:shadow-gray-800/50 transition-all hover:scale-105" />
                    <div class="flex flex-col  gap-4 mt-8 transition-all duration-300">
                        <n-button type="primary" size="large"
                            class="bg-[var(--theme)] hover:bg-[var(--theme-light)] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                            <template #icon>
                                <n-icon>
                                    <LogoGooglePlaystore />
                                </n-icon>
                            </template>
                            <span class="font-medium">{{tm('download.a')}}</span>
                        </n-button>

                        <n-button type="primary" size="large" ghost
                            class="text-[var(--theme)] border-[var(--theme)] hover:bg-[var(--theme)]/10 transition-all hover:-translate-y-1">
                            <template #icon>
                                <n-icon>
                                    <logo-windows />
                                </n-icon>
                            </template>
                            <span class="font-medium">{{tm('download.w')}}</span>
                        </n-button>

                        <n-button type="primary" size="large" ghost
                            class="text-[var(--theme)] border-[var(--theme)] hover:bg-[var(--theme)]/10 transition-all hover:-translate-y-1">
                            <template #icon>
                                <n-icon>
                                    <logo-apple />
                                </n-icon>
                            </template>
                            <span class="font-medium">{{tm('download.m')}}</span>
                        </n-button>
                    </div>

                    <p class="mt-6 text-sm text-gray-500 dark:text-gray-200 font-inter opacity-0 animate-fade-delay-3">
                        {{tm('free')}}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { LogoWindows, LogoApple, LogoGooglePlaystore } from "@vicons/ionicons5";
import phone_layout from "../assets/PhoneFrame.png"
import { SITEMETA } from "../utils";
import { useI18n } from 'vue-i18n'

const { tm } = useI18n()

</script>