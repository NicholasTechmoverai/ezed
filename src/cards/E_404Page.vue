<template>
  <div
    class="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6"
  >
    <div class="text-center max-w-md px-4">
      <div class="relative mb-12 inline-flex items-center space-x-4 select-none">
        <n-gradient-text
          gradient="linear-gradient(90deg, #ff758c 0%, #8e54e9 50%, #4776e6 100%)"
          class="text-[120px] font-extrabold drop-shadow-lg"
          >4</n-gradient-text
        >

        <span
          class="opacity-40 animate-float"
          aria-hidden="true"
          title="Error icon"
        >
          <n-icon size="90" :component="BanOutline" />
        </span>

        <n-gradient-text
          gradient="linear-gradient(90deg, #ff758c 0%, #8e54e9 50%, #4776e6 100%)"
          class="text-[120px] font-extrabold drop-shadow-lg"
          >4</n-gradient-text
        >

        <!-- Gradient underline -->
        <div
          class="absolute -bottom-4 left-1/2 w-40 h-2 rounded-full bg-gradient-to-r from-pink-400 via-purple-600 to-blue-500 blur-md -translate-x-1/2"
          aria-hidden="true"
        ></div>
      </div>

      <n-h2 class="text-3xl font-semibold mb-3 text-gray-900 dark:text-gray-200 tracking-wide">
        Oops! Page Not Found
      </n-h2>

      <n-p class="text-gray-700 dark:text-gray-400 mb-10 leading-relaxed">
        The page you're looking for doesn't exist or has been moved. Don't worry,
        you can find your way back home.
      </n-p>

      <div class="flex gap-6 justify-center mb-14" aria-label="Navigation actions">
        <n-button
          type="primary"
          size="large"
          @click="goHome"
          class="shadow-lg transition hover:shadow-xl"
          aria-label="Go to home page"
        >
          <template #icon>
            <n-icon :component="HomeOutline" />
          </template>
          Go Home
        </n-button>

        <n-button
          size="large"
          @click="goBack"
          class="shadow-lg transition hover:shadow-xl"
          aria-label="Go back to previous page"
        >
          <template #icon>
            <n-icon :component="ArrowBackOutline" />
          </template>
          Go Back
        </n-button>
      </div>

      <div
        class="mx-auto w-24 text-gray-400 dark:text-gray-600 animate-float"
        aria-hidden="true"
      >
        <n-icon size="96" :component="CompassOutline" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { NH2, NP, NButton, NIcon } from 'naive-ui'
import {
  HomeOutline,
  ArrowBackOutline,
  CompassOutline,
  BanOutline,
} from '@vicons/ionicons5'
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/h')
}
const goBack = () => {
  router.go(-1)
}
</script>

<style>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
