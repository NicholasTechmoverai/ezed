<template>
    <div :style="{
        '--theme': SITEMETA.theme_color,
        '--theme-rgb': SITEMETA.theme_color_rgb,
        '--theme-light': SITEMETA.theme_light
    }" class="min-h-screen transition-colors duration-500
          backdrop-blur-sm">


        <div id="pwa-install-prompt" class="hidden fixed bottom-0 w-full p-4 bg-[var(--theme)] text-white text-center">
            <button id="install-btn" class="px-4 py-2 bg-white text-[var(--theme)] rounded-lg font-medium">Install
                App</button>
            <button id="dismiss-btn" class="ml-4 px-4 py-2 rounded-lg font-medium">Dismiss</button>
        </div>

        <div class="absolute top-4 right-4 z-10">
            <GlobalPrerenceTabs />
        </div>

        <main class=" mx-auto px-4 sm:px-6 lg:px-8 py-20   bg-gradient-to-b  backdrop-blur-sm
         from-white 
         via-[rgba(var(--theme-rgb),0.08)] 
         to-[var(--theme)]
         dark:bg-[linear-gradient(to_bottom,_black,_rgb(55,65,81)_40%,_rgba(var(--theme-rgb),0.5)_70%,_var(--theme))]">
            <div class="flex flex-col items-center text-center justify-center gap-8 animate-fade-in">
                <div class="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 animate-slide-up">
                    <img :src="SITEMETA.logo" :alt="SITEMETA.name || 'Site Logo'"
                        class="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-lg dark:shadow-gray-800/50 transition-all hover:scale-105" />
                    <h1
                        class="text-6xl sm:text-7xl md:text-8xl font-bold bg-clip-text text-[var(--theme)] bg-gradient-to-r from-[var(--theme)] to-[var(--theme-light)] dark:from-[var(--theme-light)] dark:to-[var(--theme)] px-2 py-1 rounded-lg backdrop-blur-sm">
                        {{ SITEMETA.name }}
                    </h1>
                </div>

                <h3
                    class="text-2xl sm:text-3xl text-gray-900 dark:text-white my-10 leading-tight max-w-3xl  lobster-font opacity-0 animate-fade-delay">
                    {{ SITEMETA.description }}
                </h3>

                <!-- Download Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 mt-8 transition-all duration-300">
                    <n-button type="primary" size="large"
                        class="bg-[var(--theme)] hover:bg-[var(--theme-light)] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        <template #icon>
                            <n-icon>
                                <LogoGooglePlaystore />
                            </n-icon>
                        </template>
                        <span class="font-medium">Download for Android</span>
                    </n-button>

                    <n-button type="primary" size="large" ghost
                        class="text-[var(--theme)] border-[var(--theme)] hover:bg-[var(--theme)]/10 transition-all hover:-translate-y-1">
                        <template #icon>
                            <n-icon>
                                <logo-windows />
                            </n-icon>
                        </template>
                        <span class="font-medium">Download for Windows</span>
                    </n-button>

                    <n-button type="primary" size="large" ghost
                        class="text-[var(--theme)] border-[var(--theme)] hover:bg-[var(--theme)]/10 transition-all hover:-translate-y-1">
                        <template #icon>
                            <n-icon>
                                <logo-apple />
                            </n-icon>
                        </template>
                        <span class="font-medium">Download for macOS</span>
                    </n-button>
                </div>

                <p class="mt-6 text-sm text-gray-500 dark:text-gray-900 font-inter opacity-0 animate-fade-delay-3">
                    Free — just one-time signup
                </p>

                <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                    <div v-for="(feature, idx) in pwaFeatures" :key="idx"
                        class="p-6 rounded-xl bg-white/70 dark:bg-[#313244]/70 shadow-md dark:shadow-none transition-all hover:scale-[1.02] opacity-0"
                        :class="`animate-fade-slide-delay-${idx}`">
                        <div class="text-[var(--theme)] text-3xl mb-4">{{ feature.icon }}</div>
                        <h3 class="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-2 font-geist">{{ feature.title }}</h3>
                        <p class="text-gray-600 dark:text-gray-300 font-inter">{{ feature.desc }}</p>
                    </div>
                </div>
            </div>
        </main>
        <div class="border-t-[8px] border-[var(--theme-light)] p-3 md:p-10 px-3 md:px-20 
        bg-gradient-to-b
        from-[rgba(var(--theme-rgb),0.5)]
         to-white
         dark:to-black
        ">
            <div class="mt-15 flex flex-col gap-30">
                <ResourcesPage />
                <SitesPage />
                <FooterPage/>
            </div>

        </div>
    </div>
</template>

<script setup>
import { SITEMETA } from "../utils";
import { LogoWindows, LogoApple, LogoGooglePlaystore } from "@vicons/ionicons5";
import SitesPage from "./SitesPage.vue";
import GlobalPrerenceTabs from "../pages/GlobalPrerenceTabs.vue";
import ResourcesPage from "./ResourcesPage.vue";
import FooterPage from "./FooterPage.vue";
const pwaFeatures = [
    { icon: "⚡", title: "Lightning Fast", desc: "Optimized for performance with PWA technology" },
    { icon: "📱", title: "Installable", desc: "Add to home screen for app-like experience" },
    { icon: "🌓", title: "Dark Mode", desc: "Beautiful catppuccin-inspired dark theme" }
];

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js");
    });
}

let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const prompt = document.getElementById("pwa-install-prompt");
    prompt.classList.remove("hidden");

    document.getElementById("install-btn").addEventListener("click", () => {
        prompt.classList.add("hidden");
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
        });
    });

    document.getElementById("dismiss-btn").addEventListener("click", () => {
        prompt.classList.add("hidden");
    });
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@latest/index.css');
@import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');

.lobster-font {
  font-family: 'Lobster', cursive;
}

.font-geist {
    font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.font-inter {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slide-up {
    from {
        opacity: 0;
        transform: translateY(40px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.8s ease forwards;
}

.animate-slide-up {
    animation: slide-up 1s ease forwards;
}

.opacity-0 {
    opacity: 0;
}

.animate-fade-delay {
    animation: fade-in 0.8s ease forwards 0.5s;
}

.animate-fade-delay-2 {
    animation: fade-in 0.8s ease forwards 0.8s;
}

.animate-fade-delay-3 {
    animation: fade-in 0.8s ease forwards 1.1s;
}

.animate-fade-slide-delay-0 {
    animation: fade-in 0.8s ease forwards 1.3s;
}

.animate-fade-slide-delay-1 {
    animation: fade-in 0.8s ease forwards 1.6s;
}

.animate-fade-slide-delay-2 {
    animation: fade-in 0.8s ease forwards 1.9s;
}

.drop-shadow-[0_3px_6px_rgba(0, 0, 0, 0.3)] {
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

@media (display-mode: standalone) {
    body {
        overscroll-behavior-y: contain;
    }
}
</style>
