<template>
    <div class=" flex flex-row justify-center items-center">
        <DownloadInputCard  :d_type="'X'"  :abb_r="'x'"/>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import router from "../router";
import { useRouter, useRoute } from 'vue-router'
import DownloadInputCard from '../cards/DownloadInputCard.vue';
const route = useRoute()

const currentId = computed(() => route.params.id || null)

</script
