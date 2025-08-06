<template>
    <div class=" flex flex-row justify-center items-center">
        <DownloadCard  :id="currentId"/>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import DownloadCard from "../cards/DownloadProgressCard.vue"
import router from "../router";
import { useRouter, useRoute } from 'vue-router'
const route = useRoute()

const currentId = computed(() => route.params.id || null)

</script>