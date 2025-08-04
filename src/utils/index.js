export const BASE_URL = "http://127.0.0.1:8000";
export const B_URL =`${BASE_URL}/api`;


export const AUTH_WITH_GOOGLE = `${BASE_URL}/api/login/google`;
export const MANUAL_LOGIN = `${BASE_URL}/api/login`;
export const SIGN_UP = `${BASE_URL}/api/signup`;
export const SEND_EMAIL_RESET_CODES = `${BASE_URL}/api/send_email_reset_codes`;
export const VERIFY_CODES = `${BASE_URL}/api/verify_reset_codes`
export const RESET_PASSWORD = `${BASE_URL}/api/reset_email_password`


export function extractYouTubeID(url) {
    if (url.includes('https://')) {
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;  // Extracts video ID from YouTube URL
    }
    return url
}