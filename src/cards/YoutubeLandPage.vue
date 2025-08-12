<template>
    <div class="flex flex-col items-center justify-center h-full p-4 w-full max-w[400px]">
        <n-auto-complete v-model:value="value" :options="options" placeholder="Search in youtube" size="medium" />
    </div>
</template>