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

  const updateMergeProgress = (id, p) => {
    if (!id) return;
    const entry = downloadStore.onGoingDownloads[id];
    if (entry) {
      entry.merge_progress = p;
    }
  };

  const load = async () => {
    if (ready.value || loading.value) return;

    loading.value = true;
    error.value = null;
    cleanupListeners();

    try {
      console.log('Initializing FFmpeg...');

      ffmpeg.on('log', ({ message }) => {
        console.debug('[FFmpeg]', message);
      });

      ffmpeg.on('progress', ({ progress: p }) => {
        const newProgress = Math.round(p * 100);
        if (newProgress !== progress.value) {
          progress.value = newProgress;
          console.debug(`[FFmpeg] Progress: ${newProgress}%`);
        }
      });

      await ffmpeg.load();
      ready.value = true;
      console.log('FFmpeg initialized successfully');
    } catch (err) {
      error.value = err.message || 'Failed to initialize FFmpeg';
      console.error('FFmpeg initialization error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const mergeVideoAudio = async (videoFile, audioFile, id = null) => {
    if (!ready.value) await load();
    if (error.value) throw new Error(error.value);

    const TEMP_FILES = {
      video: 'input_video.mp4',
      audio: 'input_audio.mp3',
      output: 'output.mp4',
    };

    try {
      console.log('Starting video/audio merge...');

      ffmpeg.on('progress', ({ progress: p }) => {
        const mergeProgress = Math.round(p * 100);
        if (mergeProgress !== progress.value) {
          progress.value = mergeProgress;
          updateMergeProgress(id, mergeProgress);
          console.debug(`[FFmpeg][${id}] Merge Progress: ${mergeProgress}%`);
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

      await Promise.all([
        ffmpeg.deleteFile(TEMP_FILES.video),
        ffmpeg.deleteFile(TEMP_FILES.audio),
        ffmpeg.deleteFile(TEMP_FILES.output),
      ]);

      outputUrl.value = URL.createObjectURL(
        new Blob([outputData.buffer], { type: 'video/mp4' })
      );

      console.log('Merge completed successfully');
      return outputUrl.value;
    } catch (err) {
      error.value = err.message || 'Merge failed';
      console.error('Merge error:', err);

      try {
        await Promise.allSettled([
          ffmpeg.deleteFile(TEMP_FILES.video),
          ffmpeg.deleteFile(TEMP_FILES.audio),
          ffmpeg.deleteFile(TEMP_FILES.output),
        ]);
      } catch (cleanupErr) {
        console.warn('Cleanup error:', cleanupErr);
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

  onMounted(() => {
    if (typeof window !== 'undefined') {
      setTimeout(load, 500);
    }
  });

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
