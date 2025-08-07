// @ffmpeg/core@0.12.10
// @ffmpeg/ffmpeg@0.12.15
// @ffmpeg/util@0.12.2

import { ref, onMounted, onUnmounted } from 'vue';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useDownloadStore } from '../store/downloadStore';

export function useFfmpeg() {
  const ffmpeg = new FFmpeg();
  const ready = ref(false);
  const loading = ref(false);
  const progress = ref(0);
  const outputUrl = ref(null);
  const error = ref(null);

  const downloadStore = useDownloadStore();

  const cleanupListeners = () => {
    ffmpeg.off('log');
    ffmpeg.off('progress');
  };


  const mergeVideoAudio = async (videoFile, audioFile, id = null) => {
    const ffmpeg = new FFmpeg();
    const TEMP_FILES = {
      video: `input_video_${id || 'temp'}.mp4`,
      audio: `input_audio_${id || 'temp'}.mp3`,
      output: `output_${id || 'temp'}.mp4`,
    };

    try {
      // console.log('Initializing FFmpeg...');

      await ffmpeg.load();
      // console.log('FFmpeg initialized successfully');


      // ffmpeg.on('log', ({ message }) => console.debug(`[${id}] FFmpeg:`, message));
      ffmpeg.on('progress', ({ progress }) => {
        const percent = Math.round(progress * 100);
        if (id) {
          downloadStore.update_download_progress({
            id,
            merge_progress: percent,
            status: percent < 100 ? 'merging' : 'merged',
          });
        }
      });

      const [videoData, audioData] = await Promise.all([
        fetchFile(videoFile),
        fetchFile(audioFile),
      ]);

      await Promise.all([
        ffmpeg.writeFile(TEMP_FILES.video, videoData),
        ffmpeg.writeFile(TEMP_FILES.audio, audioData),
      ]);

      await ffmpeg.exec([
        '-i', TEMP_FILES.video,
        '-i', TEMP_FILES.audio,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        '-shortest',
        '-y',
        TEMP_FILES.output,
      ]);

      const outputData = await ffmpeg.readFile(TEMP_FILES.output);
      const blobUrl = URL.createObjectURL(new Blob([outputData.buffer], { type: 'video/mp4' }));

      await Promise.all([
        ffmpeg.deleteFile(TEMP_FILES.video),
        ffmpeg.deleteFile(TEMP_FILES.audio),
        ffmpeg.deleteFile(TEMP_FILES.output),
      ]);

      return blobUrl;
    } catch (err) {
      if (id) {
        downloadStore.update_download_progress({
          id,
          merge_progress: 0,
          status: 'merge_failed',
        });
      }
      throw err;
    }
  };


  const dispose = () => {
    if (outputUrl.value) {
      URL.revokeObjectURL(outputUrl.value);
      outputUrl.value = null;
    }
    cleanupListeners();
  };

  onUnmounted(dispose);

  return {
    ready,
    loading,
    progress,
    outputUrl,
    error,
    load,
    mergeVideoAudio,
    dispose,
  };
}
