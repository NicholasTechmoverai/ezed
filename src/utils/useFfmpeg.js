import { ref, onMounted, onUnmounted } from 'vue';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// Constants for better maintainability
const CORE_FILES = {
  core: '/ffmpeg/ffmpeg-core.js',
  wasm: '/ffmpeg/ffmpeg-core.wasm'
};

export function useFfmpeg() {
  const ffmpeg = new FFmpeg();
  const ready = ref(false);
  const loading = ref(false);
  const progress = ref(0);
  const outputUrl = ref(null);
  const error = ref(null);

  // Cleanup event listeners
  const cleanupListeners = () => {
    ffmpeg.off('log');
    ffmpeg.off('progress');
  };

  /**
   * Load FFmpeg core files
   */
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
          console.debug(`[FFmpeg] Progress: ${progress.value}%`);
        }
      });

      await ffmpeg.load({
        coreURL: CORE_FILES.core,
        wasmURL: CORE_FILES.wasm,
      });

      ready.value = true;
      console.log('FFmpeg initialized successfully');
    } catch (err) {
      error.value = err.message || 'Failed to initialize FFmpeg';
      console.error('FFmpeg initialization error:', err);
      throw err; // Re-throw to allow component to handle
    } finally {
      loading.value = false;
    }
  };

  /**
   * Merge video and audio files
   */
  const mergeVideoAudio = async (videoFile, audioFile) => {
    if (!ready.value) await load();
    if (error.value) throw new Error(error.value);

    const TEMP_FILES = {
      video: 'input_video.mp4',
      audio: 'input_audio.mp3',
      output: 'output.mp4'
    };

    try {
      console.log('Starting video/audio merge...');
      
      // Parallel file reading
      const [videoData, audioData] = await Promise.all([
        fetchFile(videoFile),
        fetchFile(audioFile)
      ]);

      // Parallel file writing
      await Promise.all([
        ffmpeg.writeFile(TEMP_FILES.video, videoData),
        ffmpeg.writeFile(TEMP_FILES.audio, audioData)
      ]);

      // Execute FFmpeg command with optimized settings
      await ffmpeg.exec([
        '-i', TEMP_FILES.video,
        '-i', TEMP_FILES.audio,
        '-c:v', 'copy',          // No video re-encoding
        '-c:a', 'aac',           // AAC audio
        '-b:a', '192k',          // Audio bitrate
        '-movflags', '+faststart', // Web optimization
        '-shortest',             // Match shortest stream
        '-y',                    // Overwrite
        TEMP_FILES.output
      ]);

      // Read output
      const outputData = await ffmpeg.readFile(TEMP_FILES.output);
      
      // Cleanup temporary files
      await Promise.all([
        ffmpeg.deleteFile(TEMP_FILES.video),
        ffmpeg.deleteFile(TEMP_FILES.audio),
        ffmpeg.deleteFile(TEMP_FILES.output)
      ]);

      // Create object URL
      outputUrl.value = URL.createObjectURL(
        new Blob([outputData.buffer], { type: 'video/mp4' })
      );

      console.log('Merge completed successfully');
      return outputUrl.value;
    } catch (err) {
      error.value = err.message || 'Merge failed';
      console.error('Merge error:', err);
      
      // Attempt cleanup on error
      try {
        await Promise.allSettled([
          ffmpeg.deleteFile(TEMP_FILES.video),
          ffmpeg.deleteFile(TEMP_FILES.audio),
          ffmpeg.deleteFile(TEMP_FILES.output)
        ]);
      } catch (cleanupErr) {
        console.warn('Cleanup error:', cleanupErr);
      }
      
      throw err;
    }
  };

  /**
   * Clean up resources
   */
  const dispose = () => {
    if (outputUrl.value) {
      URL.revokeObjectURL(outputUrl.value);
      outputUrl.value = null;
    }
    cleanupListeners();
  };

  // Auto-cleanup
  onUnmounted(dispose);
  
  // Lazy initialization
  onMounted(() => {
    // Only auto-load if not in SSR
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
    dispose
  };
}