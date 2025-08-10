<template>
    <section class="flex flex-col justify-center items-center px-6 py-12 max-w-6xl gap-25 mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center w-full">
            <div class="max-w-xl text-center md:text-left">
                <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight lobster-font animate-fade-delay">
                    {{ t('footer_header') }}
                </h1>
                <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed animate-fade-delay">
                    {{ t("footer_info") }}
                </p>
            </div>
            <PhoneLayout />
        </div>
        <footer
            class="w-full  py-6 px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p class="text-sm text-gray-600 dark:text-gray-400 select-none">
                &copy; 2025 {{ SITEMETA.name }}. All rights reserved.
            </p>
            <div class="flex items-center space-x-4">
                <span class="text-gray-600 dark:text-gray-400 select-none hidden sm:inline">{{t('scan')}}</span>
                <n-qr-code :value="'https://e-zed.netlify.app/'"       :icon-src="SITEMETA.logo" :color="SITEMETA.theme_color" :icon-size="32"/>
            </div>
        </footer>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import PhoneLayout from './PhoneLayout.vue';
import { SITEMETA } from '../utils';
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

</script>
