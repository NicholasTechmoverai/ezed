import { audioItags } from ".";

export const normalizeYouTubeUrl = (input) => {
    if (!input) return;
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|v\/|shorts\/)?|src="(?:https:\/\/www\.youtube\.com\/embed\/))([\w-]{11})/;

    const match = input.match(regex);

    if (match && match[1]) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
    }

    return null;
}

export function getYouTubeThumbnail(url) {
    // Optimized regex to match YouTube video ID across all URL formats
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?\/|.*[?&]v=))|youtu\.be\/|youtube\.com\/shorts\/)([^"&?/\s]{11})/;

    const match = url.match(regex);
    if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }

    console.warn(`Invalid YouTube URL: ${url}`);
    return null;
}

export function convertResolution(res) {
    if (!res) return 'Unknown';

    if (res === 'audio only') {
        return 'audio';
    }

    // Extract width and height from the resolution string (e.g., "1920x1080")
    const [width, height] = res.split('x').map(Number);


    if (isNaN(height)) return res;

    switch (height) {
        case 144: return '144p';
        case 240: return '240p';
        case 360: return '360p';
        case 480: return '480p';
        case 720: return '720p';
        case 1080: return '1080p';
        case 1440: return '2K';  // For 2K resolution
        case 2160: return '4K';  // For 4K resolution
        case 4320: return '8K';  // For 8K resolution
        default:
            if (height > 2160) return '8K';  
            return res;  
    }
}


export const suggestFilename = (url) => {
    try {
        const hostname = new URL(url).hostname
            .replace(/^www\./, '')   
            .split('.')[0]           

        const now = new Date()
        const datePart = now.toLocaleDateString('en-GB').replace(/\//g, '-') // 17-05
        const timePart = now
            .toTimeString()
            .split(' ')[0] // HH:MM:SS
            .replace(/:/g, '-') // HH-MM-SS

        return `zed_${hostname}_${datePart}_${timePart}`
    } catch (err) {
        console.error("Invalid URL:", url)
        return `zed_unknown_${Date.now()}`
    }
}




/**
 * Create an itag combination if needed
 * @param {string} clickedItag - The itag user clicked
 * @param {Array} formats - Available format objects from the API
 * @returns {string|null} - Combined itag (video+audio) or original itag
 */
export async function getItagWithAudio(clickedItag, formats) {
  const isAudioOnly = audioItags.includes(clickedItag);

  if (isAudioOnly) {
    return clickedItag;
  }

  if (clickedItag === "18") {
    return clickedItag;
  }

  const availableAudioItag = audioItags.find(aItag =>
    formats.some(f => f.itag === aItag)
  );

  if (availableAudioItag) {
    return `${clickedItag}+${availableAudioItag}`;
  }

  return clickedItag;
}



export const AUTO_DOWNLOAD_FORMATS = [
  // WebM (VP9) + Audio 140 (Best Quality)
  { label: '2160p (4K WebM)', key: '313+140' ,value: '313+140'},
  { label: '1440p (WebM)', key: '272+251' ,value: '272+251'},
  { label: '1080p (WebM)', key: '248+140' ,value: '248+140'},
  { label: '720p (WebM)', key: '247+140' ,value: '247+140'},
  { label: '480p (WebM)', key: '244+140' ,value: '244+140'},
  { label: '360p (MP4 - Single File)', key: '18' ,value: '18'},
  { label: 'mp3 (audio)', key: '140' ,value: '140'},
];