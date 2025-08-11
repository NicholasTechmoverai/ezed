export const BASE_URL = "http://127.0.0.1:8000";
// export const BASE_URL = "https://tribune-electronics-openings-number.trycloudflare.com";

export const B_URL = `${BASE_URL}/api`;

export const SITEMETA = {
    name: "e-zed",
    logo: "/icons/icon-512x512.png",
    theme_color: '#22c55e',
    theme_color_rgb: '34, 197, 94', // same color but RGB only
    theme_light: '#a7f3d0',
    icons: "/icons/icon-512x512.png",
    description: "Download any  intresting music and videos effortlessly on all social media platforms. One simple share is all it takes to get it installed on your device — fast, easy, and social!"
}

export const FILE_PROGRESS = {
    PROCESSING: 'processing',
    STARTING: "starting",
    ACTIVE: "active",
    DOWNLOADING: "downloading",
    PAUSED: "paused",
    INTERUPTED: "interupted",
    ERROR: "error",
    MERGING: "merging",
    COMPLETED: "completed"
};

export const audioItags = [
    "251", // Opus ~160kbps webm
    "140", // AAC ~128kbps m4a
    "250", // Opus ~70kbps webm
    "249", // Opus ~50kbps webm
    "234", // Opus ~80kbps webm
    "233"  // Opus ~unknown webm
];



export function extractYouTubeID(url) {
    if (url.includes('https://')) {
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;  // Extracts video ID from YouTube URL
    }
    return url
}

import {
  NavigateOutline,
  PauseOutline,
  CloseCircleOutline,
  DownloadOutline,
  SpeedometerOutline,
  TimeOutline,
  CheckmarkOutline,
  BanSharp
} from '@vicons/ionicons5'

export const STATUS_CONFIG = {
  starting: {
    message: 'Starting',
    icon: NavigateOutline,
    type: 'info'
  },
  processing: {
    message: 'Processing',
    icon: SpeedometerOutline,   // indicates “working/processing” well
    type: 'info'
  },
  active: {
    message: 'Downloading',
    icon: DownloadOutline,      // more intuitive than Play for download
    type: 'info'
  },
  merging: {
    message: 'Merging',
    icon: TimeOutline,          // suggests “waiting” or “in progress”
    type: 'info'
  },
  paused: {
    message: 'Paused',
    icon: PauseOutline,
    type: 'warning'
  },
  interrupted: {
    message: 'Interrupted',
    icon: BanSharp,
    type: 'error'
  },
  error: {
    message: 'Error',
    icon: CloseCircleOutline,
    type: 'error'
  },
  completed: {
    message: 'Completed',
    icon: CheckmarkOutline,
    type: 'success'
  },
  default: {
    message: 'Ready',
    icon: DownloadOutline,      // Ready for download, keep as is
    type: 'default'
  }
}
