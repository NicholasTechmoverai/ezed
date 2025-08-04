import { defineStore } from 'pinia';
import { useUserStore } from "./userStore.js";
import { B_URL } from "@/utils/index.js";

export const useDownloadStore = defineStore('downloadStore', {
  state: () => ({
    userStore: useUserStore(),
    onGoingDownloads: {},
    currentDownloadCount: 0
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

      const speedMbps = (fetchedSize / (1024 * 1024)) * 8 / elapsedTime;
      return speedMbps;
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
     * Initiates a YouTube download
     * @param {string} id - YouTube video ID
     * @param {string} url - YouTube URL
     * @param {string} itag - YouTube format itag
     * @param {string} ext - File extension
     * @param {number} startByte - Byte offset for resuming downloads
     * @param {string|null} format - File format
     */
    async download_file(
      endpoint, id, url, itag = null, ext = null, startByte = 0, format = null
    ) {


      if (!url) {
        console.log("Please select a stream to download.", resolution);
        return;
      }

      let download_id;

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
        this.downloadsCount('+');

        let isFirstChunk = true;
        const startTime = performance.now();
        const header_info = response.headers;
        const contentDisposition = header_info.get("Content-Disposition");

        const filename = contentDisposition
          ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
          : filename || "downloaded_file";

        const extension = header_info.get("format") || extension;
        download_id = header_info.get("X-Download-URL") || songId;
        const timestamp = Date.now();

        if (!this.onGoingDownloads) {
          this.onGoingDownloads = {};
        }

        let contentLength = this.activeFilesize * 1024 * 1024; // Convert MB to bytes
        let downloadedSize = 0;
        let lastUpdateTime = startTime;
        let lastDownloadedSize = 0;
        let speedSamples = [];
        const MAX_SAMPLES = 5; // Number of samples for moving average

        const reader = response.body.getReader();

        const stream = new ReadableStream({
          start: (controller) => {
            const push = () => {
              reader.read().then(async ({ done, value }) => {
                if (done) {
                  console.log("\nDownload completed!");
                  this.onGoingDownloads[download_id].status = "completed";
                  this.onGoingDownloads[download_id].progress = 100;
                  this.onGoingDownloads[download_id].downloadSpeedMbps = "0 Mb/s";
                  this.onGoingDownloads[download_id].eta = "00:00";
                  controller.close();
                  return;
                }
                if (isFirstChunk) {
                  const str = new TextDecoder().decode(value);
                  const match = str.match(/^\[CONTENT-LENGTH:(\d+)\]/);

                  if (match) {
                    contentLength = parseInt(match[1]);
                    console.log("Content length:", contentLength);
                    const stripped = value.slice(match[0].length);
                    value = stripped; // ✅ Use modified value for streaming
                  }

                  isFirstChunk = false;

                }

                const currentTime = performance.now();
                const chunkSize = value.length;
                downloadedSize += chunkSize;

                // Calculate instant speed
                const timeDiff = (currentTime - lastUpdateTime) / 1000; // in seconds
                const sizeDiff = downloadedSize - lastDownloadedSize;

                if (timeDiff > 0) {
                  const instantSpeed = (sizeDiff / timeDiff) / (1024 * 1024); // in MB/s

                  // Add to speed samples for moving average
                  speedSamples.push(instantSpeed);
                  if (speedSamples.length > MAX_SAMPLES) {
                    speedSamples.shift();
                  }

                  // Calculate average speed
                  const avgSpeed = speedSamples.reduce((sum, speed) => sum + speed, 0) / speedSamples.length;

                  // Calculate progress
                  const progress = Math.min((downloadedSize / contentLength) * 100, 100);

                  // Calculate ETA
                  const remainingBytes = contentLength - downloadedSize;
                  const remainingSeconds = remainingBytes / (avgSpeed * 1024 * 1024);
                  const eta = this.formatETA(remainingSeconds);

                  // Format speed
                  let formattedSpeed;
                  if (avgSpeed > 1) {
                    formattedSpeed = `${avgSpeed.toFixed(2)} MB/s`;
                  } else if (avgSpeed > 0.001) {
                    formattedSpeed = `${(avgSpeed * 1024).toFixed(2)} KB/s`;
                  } else {
                    formattedSpeed = `${(avgSpeed * 1024 * 1024).toFixed(0)} B/s`;
                  }

                  // Update download info
                  if (!this.onGoingDownloads[download_id]) {
                    this.onGoingDownloads[download_id] = {};
                  }

                  this.onGoingDownloads[download_id] = {
                    timestamp,
                    filename,
                    progress,
                    status: "downloading",
                    eta,
                    downloadSpeedMbps: formattedSpeed,
                    thumbnail: thumbnail,
                    filesize: contentLength,
                    downloadedSize: downloadedSize,
                  };

                  // Log progress (optional)
                  console.clear();
                  console.log(`Downloading: ${filename}`);
                  console.log(`Progress: ${progress.toFixed(2)}%`);
                  console.log(`Speed: ${formattedSpeed}`);
                  console.log(`ETA: ${eta}`);

                  lastUpdateTime = currentTime;
                  lastDownloadedSize = downloadedSize;


                }

                controller.enqueue(value);
                push();
              });
            };
            push();
          }
        });

        const main_blob = await new Response(stream).blob();
        this.saveToFile(main_blob, filename)

      } catch (error) {
        console.error("Download failed:", error);
        if (this.onGoingDownloads[download_id]) {
          this.onGoingDownloads[download_id].status = "failed";
        }
      }
    },


    /**
     * Formats speed for display
     */
    formatSpeed(speedMBps) {
      if (speedMBps > 1) {
        return `${speedMBps.toFixed(2)} MB/s`;
      } else if (speedMBps > 0.001) {
        return `${(speedMBps * 1024).toFixed(2)} KB/s`;
      }
      return `${(speedMBps * 1024 * 1024).toFixed(0)} B/s`;
    },

    /**
     * Finalizes download status
     */
    finalizeDownload(downloadId) {
      if (this.onGoingDownloads[downloadId]) {
        this.onGoingDownloads[downloadId] = {
          ...this.onGoingDownloads[downloadId],
          status: "completed",
          progress: 100,
          downloadSpeed: "0 B/s",
          eta: "00:00"
        };
      }
    },



    /**
     * Saves blob to file system
     */
    saveToFile(blob, filename, extension) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      this.decrementDownloadCount();
    },

    incrementDownloadCount() {
      this.currentDownloadCount++;
    },

    decrementDownloadCount() {
      this.currentDownloadCount--;
    },

    /**
     * Updates ongoing downloads tracking
     */
    setDownloadStatus(id, downloadInfo) {
      if (!this.onGoingDownloads[id]) {
        this.onGoingDownloads[id] = downloadInfo;
      } else {
        Object.assign(this.onGoingDownloads[id], downloadInfo);
      }
    }
  }
});













