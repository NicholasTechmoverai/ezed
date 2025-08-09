<style scoped>
.card {
  width: 100%;
  height: 100%;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  color: white;
  text-align: center;
}

.card p {
  font-size: 14px;
  color: white;
}

.slider {
  width: 100%;
  height: var(--height);
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent, #000 10% 90%, transparent);
}

.slider .list {
  display: flex;
  width: 100%;
  min-width: calc(var(--width) * var(--quantity));
  position: relative;
}

.slider .list .item {
  width: var(--width);
  height: var(--height);
  position: absolute;
  left: 100%;
  animation: autoRun 10s linear infinite;
  transition: filter 0.5s;
  animation-delay: calc((10s / var(--quantity)) * (var(--position) - 1) - 10s) !important;
}

.slider .list .item img {
  width: 100%;
}

@keyframes autoRun {
  from {
    left: 100%;
  }

  to {
    left: calc(var(--width) * -1);
  }
}

.slider:hover .item {
  animation-play-state: paused !important;
  filter: grayscale(1);
}

.slider .item:hover {
  filter: grayscale(0);
}

.slider[reverse="true"] .item {
  animation: reversePlay 10s linear infinite;
}

@keyframes reversePlay {
  from {
    left: calc(var(--width) * -1);
  }

  to {
    left: 100%;
  }
}
</style>

<template>
  <div class="flex flex-col justify-center items-center gap-9">
    <h4 class="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-6 leading-tight animate-fade-delay lobster-font" >Download videos from this platforms</h4>
    <div class="slider" style="--width: 200px;
      --height: 200px;
      --quantity: 9;">
      <div class="list">

        <div v-for="site in sites" :key="site.name" class="item animate-fade-delay" :style="{ '--position': site.position }">
          <div class="card  !rounded-full shadow-md text-white transition-transform transform hover:scale-101 "
            :style="{ background: site.cl }">
            <div class="flex flex-col items-center gap-2 p-4 ">
              <component :is="site.icon" class="w-8 h-8" />
              <span class="truncate max-w-[100px] text-center">{{ site.name }}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>

</template>


<script setup>
import {
  LogoTiktok,
  LogoYoutube,
  LogoInstagram,
  LogoFacebook,
  LogoTwitter,
  LogoSnapchat,
  LogoLinkedin,
  LogoPinterest,
  LogoReddit
} from '@vicons/ionicons5'
import { SITEMETA } from '../utils';

const sites = [
  {
    name: "TikTok",
    position: 1,
    cl: "linear-gradient(to right, #84fab0, #8fd3f4)",
    icon: LogoTiktok,
    color: "#000000"
  },
  {
    name: "YouTube",
    position: 2,
    cl: "linear-gradient(to right, #ff0000, #cc0000)",
    icon: LogoYoutube,
    color: "#ff0000"
  },
  {
    name: "Instagram",
    position: 3,
    cl: "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
    icon: LogoInstagram,
    color: "#e4405f"
  },
  {
    name: "Facebook",
    position: 4,
    cl: "linear-gradient(to right, #3b5998, #1877f2)",
    icon: LogoFacebook,
    color: "#1877f2"
  },
  {
    name: "Twitter",
    position: 5,
    cl: "linear-gradient(to right, #1da1f2, #0d8ddb)",
    icon: LogoTwitter,
    color: "#1da1f2"
  },
  {
    name: "Snapchat",
    position: 6,
    cl: "linear-gradient(to right, #fffc00, #ffe033)",
    icon: LogoSnapchat,
    color: "#fffc00"
  },
  {
    name: "LinkedIn",
    position: 7,
    cl: "linear-gradient(to right, #0077b5, #004471)",
    icon: LogoLinkedin,
    color: "#0077b5"
  },
  {
    name: "Pinterest",
    position: 8,
    cl: "linear-gradient(to right, #e60023, #b00018)",
    icon: LogoPinterest,
    color: "#e60023"
  },
  {
    name: "Reddit",
    position: 9,
    cl: "linear-gradient(to right, #ff4500, #d63b00)",
    icon: LogoReddit,
    color: "#ff4500"
  }
]
</script>
