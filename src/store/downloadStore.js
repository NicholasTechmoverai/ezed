import { defineStore } from 'pinia';
import { useUserStore } from "./userStore.js";
import { B_URL } from "@/utils/index.js";
import { clearBlob, saveFile } from "../db/download.js"
import { useStateStore } from './stateStore.js';
import { useFfmpeg } from '../utils/useFfmpeg.js';

export const useDownloadStore = defineStore('downloadStore', {
  state: () => ({
    userStore: useUserStore(),
    stateStore: useStateStore(),
    useFfmpeg: useFfmpeg(),
    onGoingDownloads: {}, // Tracks all active downloads
    pendingMerges: {},    // Tracks downloads waiting to be merged
    currentDownloadCount: 0,
    mergeProgress: {},
    // mergeProgress: useFfmpeg.progress
  }),

  getters: {
    userId: (state) => state.userStore.userId,
    activeFilesize: (state) => state.userStore.activeFilesize,
    activeDownloads: (state) => Object.keys(state.onGoingDownloads).length
  },

  actions: {
    /**
     * Calculates estimated time remaining for download
     * @param {number} fileSizeInMB - File size in megabytes
     * @param {number} downloadSpeedMbps - Download speed in megabits per second
     * @returns {string} Formatted ETA string
     */
    calculateETA(fileSizeInMB, downloadSpeedMbps) {
      if (downloadSpeedMbps <= 0) return "Calculating...";
      const etaSeconds = (fileSizeInMB * 8) / downloadSpeedMbps;
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = Math.round(etaSeconds % 60);
      return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
    },

    /**
     * Calculates download speed in Mbps
     * @param {number} fetchedSize - Bytes downloaded
     * @param {number} elapsedTime - Time elapsed in seconds
     * @returns {number} Speed in Mbps
     */
    calculateSpeedPerSec(fetchedSize, elapsedTime) {
      if (fetchedSize <= 0 || elapsedTime <= 0) return 0;
      return (fetchedSize / (1024 * 1024)) * 8 / elapsedTime;
    },

    /**
     * Formats seconds into HH:MM:SS
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatETA(seconds) {
      if (seconds <= 0) return "00:00";
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');
    },

    /**
     * Updates download progress and persists to IndexedDB
     * @param {object} prg - Progress object containing download metadata
     */
    async update_download_progress(prg = {}) {
      if (!prg?.id) {
        console.warn('Invalid progress update - missing ID', prg);
        return;
      }

      const isAudio = !!prg.is_audio;

      // Initialize entry if not present
      if (!this.onGoingDownloads[prg.id]) {
        this.onGoingDownloads[prg.id] = { id: prg.id };
      }

      const target = this.onGoingDownloads[prg.id];

      // Fields to update
      const baseFields = [
        'filename', 'progress', 'status', 'eta',
        'downloadSpeedMbps', 'thumbnail', 'filesize',
        'downloadedSize', 'url'
      ];

      // Prefix for audio fields
      const prefix = isAudio ? 'a_' : '';

      // Update fields with optional prefix
      baseFields.forEach(key => {
        if (prg[key] !== undefined) {
          target[`${prefix}${key}`] = prg[key];
        }
      });

      // Store is_audio flag separately to differentiate streams
      target[`${prefix}is_audio`] = isAudio;

      // Determine if complete
      const downloadedSize = prg.downloadedSize;
      const contentLength = prg.contentLength;
      const isComplete = typeof downloadedSize === 'number' &&
        typeof contentLength === 'number' &&
        downloadedSize === contentLength;

      const persistentStatus = isComplete
        ? 'completed'
        : (prg.status ?? target[`${prefix}status`] ?? 'interrupted');

      try {
        await saveFile(
          prg.id,
          prg.url ?? target[`${prefix}url`],
          prg.filename ?? target[`${prefix}filename`],
          null, // blob
          persistentStatus,
          prg.thumbnail ?? target[`${prefix}thumbnail`],
          prg.contentLength ?? target[`${prefix}filesize`],
          prg.downloadedSize ?? target[`${prefix}downloadedSize`]
        );
      } catch (err) {
        console.error('Failed to persist download state:', err);
      }
    },

    /**
     * Splits combined itag into video and audio components if present
     * @param {string} itag - YouTube format itag (may contain '+')
     * @returns {array|null} Array of [videoTag, audioTag] or null if not combined
     */
    async split_combined_itag(itag) {
      if (!itag?.includes('+')) return [null, null];
      return itag.split("+");
    },

    /**
     * Initiates a YouTube download, handling both single and combined (video+audio) formats
     * @param {string} endpoint - API endpoint for download
     * @param {string} id - YouTube video ID
     * @param {string} url - YouTube URL
     * @param {string} itag - YouTube format itag
     * @param {string} ext - File extension
     * @param {number} startByte - Byte offset for resuming
     * @param {string|null} format - File format
     */
    async download_file(endpoint, id, url, itag = null, ext = null, startByte = 0, format = null) {
      if (!url) {
        console.error("Download failed: No URL provided");
        return;
      }

      // Initialize download tracking
      if (!this.onGoingDownloads[id]) {
        this.onGoingDownloads[id] = {
          status: "starting",
          progress: 0,
          timestamp: Date.now()
        };
      }

      this.stateStore.addTask({ name: `${id}`, id: id, url: `/h/inst/${id}` });

      // Handle combined video+audio itag (e.g., "137+140")
      if (itag) {
        const [videoTag, audioTag] = await this.split_combined_itag(itag);

        if (videoTag && audioTag) {
          // Track that we're expecting two parts for this download
          this.pendingMerges[id] = {
            video: null,
            audio: null,
            filename: null,
            extension: ext || 'mp4'
          };

          // In download_file():
          if (videoTag && audioTag) {
            await Promise.all([
              this.handle_download(endpoint, id, url, videoTag, ext, startByte, format, false),
              this.handle_download(endpoint, id, url, audioTag, ext, startByte, format, true)
            ]);
            return;
          }
        }
      }

      // Single format download
      await this.handle_download(endpoint, id, url, itag, ext, startByte, format, false);
    },

    /**
     * Handles the actual download process for a single format
     * @param {string} endpoint - API endpoint
     * @param {string} id - Video ID
     * @param {string} url - Video URL
     * @param {string} itag - Format itag
     * @param {string} ext - File extension
     * @param {number} startByte - Resume position
     * @param {string} format - Output format
     * @param {boolean} isAudio - Whether this is an audio stream
     */
    async handle_download(endpoint, id, url, itag, ext, startByte, format, isAudio) {
      let downloadId;
      const downloadType = isAudio ? 'audio' : 'video';

      try {
        const response = await fetch(`${B_URL}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itag,
            id,
            url,
            start_byte: startByte,
            format,
            ext
          })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        this.onGoingDownloads[id].status = "downloading";

        // Parse response headers
        const headers = response.headers;
        const contentDisposition = headers.get("Content-Disposition");
        const filename = contentDisposition?.split("filename=")[1]?.replace(/"/g, "") || id;
        const extension = headers.get("format") || ext || 'mp4';
        downloadId = headers.get("X-Download-URL") || id;

        // Initialize download tracking
        if (!this.onGoingDownloads[id]) {
          this.onGoingDownloads[id] = {};
        }

        // For combined downloads, store filename in pending merge
        if (this.pendingMerges[id]) {
          this.pendingMerges[id].filename = filename;
          this.pendingMerges[id][downloadType] = { status: 'downloading' };
        }

        // Download progress tracking
        let contentLength = this.activeFilesize * 1024 * 1024; // Convert MB to bytes
        let downloadedSize = 0;
        const startTime = performance.now();
        let lastUpdateTime = startTime;
        let lastDownloadedSize = 0;
        const speedSamples = [];
        const MAX_SAMPLES = 5;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Handle first chunk which may contain content length
          if (downloadedSize === 0 && value) {
            const str = new TextDecoder().decode(value);
            const match = str.match(/^\[CONTENT-LENGTH:(\d+)\]/);

            if (match) {
              contentLength = parseInt(match[1]);
              const stripped = value.slice(match[0].length);
              chunks.push(stripped);
              downloadedSize += stripped.length;
              continue;
            }
          }

          chunks.push(value);
          downloadedSize += value.length;

          // Update progress periodically
          const currentTime = performance.now();
          const timeDiff = (currentTime - lastUpdateTime) / 1000;

          if (timeDiff > 0.5) { // Throttle updates to twice per second
            const sizeDiff = downloadedSize - lastDownloadedSize;
            const instantSpeed = (sizeDiff / timeDiff) / (1024 * 1024); // MB/s

            // Calculate moving average speed
            speedSamples.push(instantSpeed);
            if (speedSamples.length > MAX_SAMPLES) speedSamples.shift();
            const avgSpeed = speedSamples.reduce((sum, s) => sum + s, 0) / speedSamples.length;

            // Calculate progress metrics
            const progress = Math.min((downloadedSize / contentLength) * 100, 100);
            const remainingBytes = contentLength - downloadedSize;
            const remainingSeconds = remainingBytes / (avgSpeed * 1024 * 1024);
            const eta = this.formatETA(remainingSeconds);
            const formattedSpeed = this.formatSpeed(avgSpeed);

            await this.update_download_progress({
              id,
              url,
              filename,
              status: 'downloading',
              progress,
              downloadSpeedMbps: formattedSpeed,
              eta,
              thumbnail: "",
              contentLength,
              filesize: contentLength,
              downloadedSize,
              is_audio: isAudio
            });

            lastUpdateTime = currentTime;
            lastDownloadedSize = downloadedSize;
          }
        }

        // Download complete - assemble blob
        const blob = new Blob(chunks);

        // For combined downloads, store blob and check if ready to merge
        if (this.pendingMerges[id]) {
          this.pendingMerges[id][downloadType] = {
            blob,
            status: 'completed'
          };

          await this.checkAndMergeDownloads(id);
        } else {
          // Single download - save immediately
          await this.finalizeDownload(id, blob, filename, extension);
        }

      } catch (error) {
        console.error("Download failed:", error);
        if (downloadId && this.onGoingDownloads[downloadId]) {
          this.onGoingDownloads[downloadId].status = "failed";
        }

        // Clean up pending merge if one part fails
        if (this.pendingMerges[id]) {
          delete this.pendingMerges[id];
        }
      }
    },

    /**
     * Checks if both video and audio parts are downloaded and merges them
     * @param {string} id - Video ID
     */
    // async checkAndMergeDownloads(id) {
    //   const pending = this.pendingMerges[id];
    //   if (!pending || !pending.video?.blob || !pending.audio?.blob) return;

    //   try {
    //     this.onGoingDownloads[id].status = "merging";

    //     // Use FFmpeg to merge video and audio
    //     const mergedBlob = await this.useFfmpeg.mergeVideoAudio(
    //       pending.video.blob,
    //       pending.audio.blob,
    //     );

    //     // Finalize the merged download
    //     await this.finalizeDownload(id, mergedBlob, pending.filename, pending.extension);

    //     // Clean up
    //     delete this.pendingMerges[id];
    //   } catch (error) {
    //     console.error("Failed to merge downloads:", error);
    //     this.onGoingDownloads[id].status = "merge_failed";
    //   }
    // },

    async checkAndMergeDownloads(id) {
      const pending = this.pendingMerges[id];
      if (!pending || !pending.video?.blob || !pending.audio?.blob) return;

      try {
        // Initialize merge progress
        this.mergeProgress[id] = 0;
        this.onGoingDownloads[id].status = "merging";
        this.onGoingDownloads[id].merge_progress = 0;

        // Setup FFmpeg progress listener
        const progressListener = ({ progress }) => {
          const percent = Math.round(progress * 100);
          this.mergeProgress[id] = percent;
          this.onGoingDownloads[id].merge_progress = percent;

          // Update the main progress display
          this.update_download_progress({
            id,
            status: 'merging',
            merge_progress: percent
          });
        };

        this.useFfmpeg.ffmpeg.on('progress', progressListener);

        // Perform the merge
        const mergedBlob = await this.useFfmpeg.mergeVideoAudio(
          pending.video.blob,
          pending.audio.blob
        );

        // Cleanup
        this.useFfmpeg.ffmpeg.off('progress', progressListener);
        delete this.mergeProgress[id];

        // Finalize download
        await this.finalizeDownload(id, mergedBlob, pending.filename, pending.extension);
        delete this.pendingMerges[id];

      } catch (error) {
        console.error("Failed to merge downloads:", error);
        this.onGoingDownloads[id].status = "merge_failed";
        this.onGoingDownloads[id].merge_progress = 0;
        delete this.mergeProgress[id];
      }
    },

    /**
     * Finalizes a completed download
     * @param {string} id - Download ID
     * @param {Blob} blob - Downloaded content
     * @param {string} filename - Output filename
     * @param {string} extension - File extension
     */
    async finalizeDownload(id, blob, filename, extension) {
      // Update status
      await this.update_download_progress({
        id,
        status: 'completed',
        progress: 100,
        downloadSpeedMbps: "0 Mb/s",
        eta: '00:00',
        downloadedSize: blob.size
      });

      // Save to IndexedDB
      try {
        await saveFile(
          id,
          this.onGoingDownloads[id]?.url || '',
          filename,
          blob,
          'completed',
          this.onGoingDownloads[id]?.thumbnail || '',
          blob.size,
          blob.size
        );
      } catch (err) {
        console.error('Failed to persist completed download:', err);
      }



      // Offer download to user
      this.saveToFileSystem(blob, filename, extension);
    },

    /**
     * Formats speed for display
     * @param {number} speedMBps - Speed in megabytes per second
     * @returns {string} Formatted speed string
     */
    formatSpeed(speedMBps) {
      if (speedMBps > 1) return `${speedMBps.toFixed(2)} MB/s`;
      if (speedMBps > 0.001) return `${(speedMBps * 1024).toFixed(2)} KB/s`;
      return `${(speedMBps * 1024 * 1024).toFixed(0)} B/s`;
    },

    /**
     * Saves blob to user's file system
     * @param {Blob} blob - Data to save
     * @param {string} filename - Base filename
     * @param {string} extension - File extension
     */
    saveToFileSystem(blobOrUrl, filename = 'download', extension = 'mp4') {
      const fullName = `${filename}${extension.startsWith('.') ? extension : '.' + extension}`;

      if (blobOrUrl instanceof Blob) {
        const url = URL.createObjectURL(blobOrUrl);
        this.triggerDownload(url, fullName);
        URL.revokeObjectURL(url); // Clean up after download
      } else if (typeof blobOrUrl === 'string') {
        this.triggerDownload(blobOrUrl, fullName);
      } else {
        console.error('saveFile: Unsupported input type. Must be a Blob or URL string.');
      }
    },

    triggerDownload(url, filename) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    incrementDownloadCount() {
      this.currentDownloadCount++;
    },

    decrementDownloadCount() {
      this.currentDownloadCount = Math.max(0, this.currentDownloadCount - 1);
    }
  }
});