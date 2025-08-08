
export const normalizeYouTubeUrl =  (input) =>{
    if (!input) return;
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|v\/|shorts\/)?|src="(?:https:\/\/www\.youtube\.com\/embed\/))([\w-]{11})/;

    const match = input.match(regex);

    if (match && match[1]) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
    }

    return null;
}