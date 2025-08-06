<template>
    <div class=" flex flex-row justify-center items-center">
        <DownloadInputCard  :d_type="'facebook'"  :abb_r="'fb'"/>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import router from "../router";
import { useRouter, useRoute } from 'vue-router'
import DownloadInputCard from '../cards/DownloadInputCard.vue';
const route = useRoute()

const currentId = computed(() => route.params.id || null)

</script>