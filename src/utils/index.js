export const BASE_URL = "http://127.0.0.1:8000";
// export const BASE_URL = "https://tribune-electronics-openings-number.trycloudflare.com";

export const B_URL = `${BASE_URL}/api`;




export const ENDPOINTS = {
    AUTH_WITH_GOOGLE: `${BASE_URL}/api/login/google`,
    MANUAL_LOGIN: `${BASE_URL}/api/login`,
    SIGN_UP: `${BASE_URL}/api/signup`,
    SEND_EMAIL_RESET_CODES: `${BASE_URL}/api/send_email_reset_codes`,
    VERIFY_CODES: `${BASE_URL}/api/verify_reset_codes`,
    RESET_PASSWORD: `${BASE_URL}/api/reset_email_password`,
}

export const FILE_PROGRESS = {
    PROCESSING: 'processing',
    STARTING: "starting",
    ACTIVE: "active",
    DOWNLOADING: "downloading",
    PAUSED: "paused",
    INTERUPTED:"interupted",
    ERROR: "error",
    MERGING:"merging",
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