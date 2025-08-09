
export const normalizeYouTubeUrl = (input) => {
    if (!input) return;
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|v\/|shorts\/)?|src="(?:https:\/\/www\.youtube\.com\/embed\/))([\w-]{11})/;

    const match = input.match(regex);

    if (match && match[1]) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
    }

    return null;
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