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
  BanSharp,
  AlertCircle
} from '@vicons/ionicons5'


export const STATUS_CONFIG = {
  starting: {
    message: 'Starting',
    icon: NavigateOutline,
    type: 'info',
    key: 'starting',
    color: '#3b82f6' // Blue
  },
  processing: {
    message: 'Processing',
    icon: SpeedometerOutline,
    type: 'info',
    key: 'processing',
    color: '#3b82f6' // Blue
  },
  downloading: {
    message: 'Downloading',
    icon: DownloadOutline,
    type: 'info',
    key: 'downloading',
    color: '#3b82f6' // Blue
  },
  merging: {
    message: 'Merging',
    icon: TimeOutline,
    type: 'info',
    key: 'merging',
    color: '#2563eb' // Darker blue
  },
  merge_failed: {
    message: 'Merge Failed',
    icon: CloseCircleOutline,
    type: 'error',
    key: 'merge_failed',
    color: '#dc2626' // Red
  },
  paused: {
    message: 'Paused',
    icon: PauseOutline,
    type: 'warning',
    key: 'paused',
    color: '#ca8a04' // Amber/Orange
  },
  interrupted: {
    message: 'Interrupted',
    icon: BanSharp,
    type: 'error',
    key: 'interrupted',
    color: '#b91c1c' // Dark red
  },
  error: {
    message: 'Error',
    icon: CloseCircleOutline,
    type: 'error',
    key: 'error',
    color: '#ef4444' // Bright red
  },
  completed: {
    message: 'Completed',
    icon: CheckmarkOutline,
    type: 'success',
    key: 'completed',
    color: '#16a34a' // Green
  },
  default: {
    message: 'Ready',
    icon: DownloadOutline,
    type: 'default',
    key: 'default',
    color: '#6b7280' // Gray
  }, 
  failed: {
    message: 'failed',
    icon: AlertCircle,
    type: 'error',
    key: 'failed',
    color: '#ef4444' // red
  }

}

