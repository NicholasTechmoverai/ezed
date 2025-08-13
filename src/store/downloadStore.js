import { defineStore } from 'pinia';
import { useUserStore } from "./userStore.js";
import { B_URL } from "@/utils/index.js";
import { clearBlob, saveFile } from "../db/download.js"
import { useStateStore } from './stateStore.js';
import { useFfmpeg } from '../utils/useFfmpeg.js';
import axios from 'axios';
import { audioItags, STATUS_CONFIG } from '../utils/index.js';
import { getYouTubeThumbnail, suggestFilename } from '../utils/others.js';
import { timestamp } from '@vueuse/core';
import { getSiteKeyFromURL } from '../composables/index.js';
import { ENDPOINTS } from '../api/index.js';

export const useDownloadStore = defineStore('downloadStore', {
  state: () => ({
    userStore: useUserStore(),
    stateStore: useStateStore(),
    useFfmpeg: useFfmpeg(),
    onGoingDownloads: {}, // Tracks all active downloads
    pendingMerges: {},    // Tracks downloads waiting to be merged
    currentDownloadCount: 0,
    mergeProgress: {},
    listSongs: {},//playlist url songs
    loadedformats: {}//url download formats
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
      // console.log("updating", prg)
      if (!prg?.id) {
        console.warn('Invalid progress update', prg);
        return;
      }

      const isAudio = !!prg.is_audio;
      const prefix = isAudio ? 'a_' : '';
      const target = this.onGoingDownloads[prg.id] ||= { id: prg.id };

      // Update progress fields
      const fields = [
        'filename', 'progress', 'status', 'eta',
        'downloadSpeedMbps', 'thumbnail', 'filesize',
        'downloadedSize', 'url', 'merge_progress'
      ];

      fields.forEach(key => {
        if (prg[key] !== undefined) {
          target[`${prefix}${key}`] = prg[key];
        }
      });

      target.hasAudio = isAudio;

      // Persist state to IndexedDB
      try {
        await saveFile(prg.id, {
          url: prg.url ?? target[`${prefix}url`],
          filename: prg.filename ?? target[`${prefix}filename`],
          status: prg.status ?? STATUS_CONFIG.interrupted.key,
          thumbnail: prg.thumbnail ?? target[`${prefix}thumbnail`],
          filesize: prg.contentLength ?? target[`${prefix}filesize`],
          downloadedSize: prg.downloadedSize ?? target[`${prefix}downloadedSize`],
          stopTime: prg.status === 'completed' ? Date.now() : null,
          hasAudio: isAudio || undefined,
          duration: prg.duration || undefined,
          format: prg.format || undefined,
          key: prg.key || undefined,
          itag: prg.itag || undefined,
          downloadName: prg.downloadName || undefined,
          islist: prg.islist || false,
        });
      } catch (err) {
        console.error('Persist failed:', err);
      }
    },

    /**
     * Splits combined itag into video/audio components
     * @param {string} itag - YouTube format tag (e.g., "137+140")
     * @returns {[string, string]|null} Video/audio tags or null
     */
    split_combined_itag(itag) {
      return itag?.includes('+') ? itag.split("+") : [null, null];
    },

    /**
     * Initiates YouTube download handling combined formats
     * @param {string} endpoint - API endpoint
     * @param {string} id - Video ID
     * @param {string} url - Source URL
     * @param {string} itag - Format specification
     * @param {string} ext - File extension
     * @param {number} startByte - Resume position
     * @param {string} format - Output format
     */
    async download_file(endpoint, id, url, itag, ext, startByte = 0, format) {
      if (!url) return console.error("Missing URL");
      let filename = suggestFilename(url);
      let extension = ext || (audioItags.includes(itag) ? "mp4a" : "mp4");
      const abb_r = await getSiteKeyFromURL(url);

      this.update_download_progress({
        id,
        status: STATUS_CONFIG.starting.key,
        progress: 0,
        filename,
        extension,
        startTime: Date.now(),
        key: abb_r,
        url: url,
        itag: itag,
        format: format || extension,
        islist: false,
        thumbnail: abb_r === 'yt' ? getYouTubeThumbnail(url) : undefined
      })

      this.get_download_meta(id, url, itag)
        .catch(err => {
          console.error('get_download_meta failed:', err);
        });

      this.stateStore.addTask({ id, name: `${filename}`, url: `/h/${abb_r}/${id}`, time: Date.now() });

      // Handle combined formats (video+audio)
      const [videoTag, audioTag] = await this.split_combined_itag(itag);
      if (videoTag && audioTag) {
        this.pendingMerges[id] = {
          video: null,
          audio: null,
          filename: null,
          extension: ext || 'mp4'
        };

        // await Promise.all([
        this.handle_download(endpoint, id, url, videoTag, ext, startByte, format, false),
          this.handle_download(endpoint, id, url, audioTag, ext, startByte, format, true)
        // ]);
        return;
      }

      // Single format download
      await this.handle_download(endpoint, id, url, itag, ext, startByte, format, false);
    },

    /**
     * Core download executor with progress tracking
     * @param {boolean} isAudio - Audio stream flag
     */
    async handle_download(endpoint, id, url, itag, ext, startByte, format, isAudio) {
      const downloadType = isAudio ? 'audio' : 'video';
      let downloadId;

      try {
        const response = await fetch(`${B_URL}/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.userStore?.token?.token || ""}`
          },
          body: JSON.stringify({ itag, id, url, start_byte: startByte, format, ext })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        // Process response headers
        const headers = response.headers;
        const contentDisposition = headers.get("Content-Disposition");

        downloadId = headers.get("X-Download-URL") || id;

        this.update_download_progress({ id, status: 'processing' })
        if (this.pendingMerges[id]) {
          this.pendingMerges[id][downloadType] = { status: 'processing' };
        }

        // Stream processing setup
        let contentLength = this.activeFilesize * 1024 * 1024;
        let downloadedSize = 0;
        const startTime = performance.now();
        const chunks = [];
        const reader = response.body.getReader();

        // Progress tracking optimizations
        let lastUpdateTime = startTime;
        let lastDownloadedSize = 0;
        const speedSamples = [];
        const MAX_SAMPLES = 5;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Handle initial content-length metadata
          if (downloadedSize === 0) {
            const headerStr = new TextDecoder().decode(value);
            const lengthMatch = headerStr.match(/^\[CONTENT-LENGTH:(\d+)\]/);
            if (lengthMatch) {
              contentLength = parseInt(lengthMatch[1]);
              chunks.push(value.slice(lengthMatch[0].length));
              downloadedSize = chunks[0].length;
              continue;
            }
          }

          chunks.push(value);
          downloadedSize += value.length;

          // Throttled progress updates (max 2/sec)
          const now = performance.now();
          if ((now - lastUpdateTime) > 500) {
            const elapsed = (now - lastUpdateTime) / 1000;
            const chunkSize = downloadedSize - lastDownloadedSize;
            const instantSpeed = (chunkSize / elapsed) / (1024 * 1024); // MB/s

            speedSamples.push(instantSpeed);
            if (speedSamples.length > MAX_SAMPLES) speedSamples.shift();
            const avgSpeed = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;

            const progress = Math.min((downloadedSize / contentLength) * 100, 100);
            const remainingSec = (contentLength - downloadedSize) / (avgSpeed * 1024 * 1024);

            this.update_download_progress({
              id,
              url,
              status: STATUS_CONFIG.downloading.key,
              progress,
              downloadSpeedMbps: this.formatSpeed(avgSpeed),
              eta: this.formatETA(remainingSec),
              contentLength,
              filesize: contentLength,
              downloadedSize,
              is_audio: isAudio,
              timestamp: Date.now()
            });

            lastUpdateTime = now;
            lastDownloadedSize = downloadedSize;
          }
        }

        const blob = new Blob(chunks);
        if (this.pendingMerges[id]) {
          this.pendingMerges[id][downloadType] = { blob, status: STATUS_CONFIG.completed.key };
          await this.checkAndMergeDownloads(id);
        } else {
          await this.finalizeDownload(id, blob, downloadedSize, this.onGoingDownloads[id].filename, this.onGoingDownloads[id].extension, isAudio);
        }

      } catch (error) {
        console.error("Download failed:", error);
        this.onGoingDownloads[id].status = "failed";
        if (this.pendingMerges[id]) delete this.pendingMerges[id];
      }
    },

    /** Merges downloaded video/audio blobs */
    async checkAndMergeDownloads(id) {
      const pending = this.pendingMerges[id];
      if (!pending || !pending.video?.blob || !pending.audio?.blob) return;

      try {
        this.onGoingDownloads[id].status = STATUS_CONFIG.merging.key;

        // Use WebWorker for non-blocking merging
        const mergedBlob = await this.useFfmpeg.mergeVideoAudio(
          pending.video.blob,
          pending.audio.blob,
          id
        );

        await this.finalizeDownload(id, mergedBlob, this.onGoingDownloads[id].downloadedSize, this.onGoingDownloads[id].filename, this.onGoingDownloads[id].extension, false);
        delete this.pendingMerges[id];
      } catch (error) {
        console.error("Merge failed:", error);
        this.onGoingDownloads[id].status = STATUS_CONFIG.merge_failed.key;
      }
    },

    async finalizeDownload(id, blob, downloadedSize, filename, extension, isAudio) {
      this.update_download_progress({
        id,
        status: STATUS_CONFIG.completed.key,
        progress: 100,
        downloadSpeedMbps: "0 Mb/s",
        eta: '00:00',
        downloadedSize: downloadedSize,
        stopTime: Date.now()
      });

      try {
        await saveFile(id, {
          url: this.onGoingDownloads[id]?.url || '',
          filename,
          [isAudio ? 'audioBlob' : 'videoBlob']: blob,
          status: STATUS_CONFIG.completed.key,
          thumbnail: this.onGoingDownloads[id]?.thumbnail || '',
          downloadedSize: blob.size
        });
      } catch (err) {
        console.error('Persist failed:', err);
      }

      this.saveToFileSystem(blob, filename, extension, id);
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
    saveToFileSystem(blobOrUrl, filename = 'download', extension = 'mp4', id = null) {
      let fullName = `${filename}${extension.startsWith('.') ? extension : '.' + extension}`;
      if (this.onGoingDownloads[id].downloadName) {
        fullName = this.onGoingDownloads[id].downloadName
      }


      // console.log(this.onGoingDownloads[id])

      if (blobOrUrl instanceof Blob) {
        const url = URL.createObjectURL(blobOrUrl);
        this.triggerDownload(url, fullName, id);
        URL.revokeObjectURL(url); // Clean up after download
      } else if (typeof blobOrUrl === 'string') {
        this.triggerDownload(blobOrUrl, fullName);
      } else {
        console.error('saveFile: Unsupported input type. Must be a Blob or URL string.');
      }
    },

    triggerDownload(url, filename, id) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (id) clearBlob(id)
    },

    incrementDownloadCount() {
      this.currentDownloadCount++;
    },

    decrementDownloadCount() {
      this.currentDownloadCount = Math.max(0, this.currentDownloadCount - 1);
    },

    async getListSongs(endpoint, listUrl, id) {
      if (!this.listSongs[id]) this.listSongs[id] = {};
      this.stateStore.addTask({ name: `list:${id}`, id: id, listUrl: listUrl, url: `/h/yt/list/${id}` });

      this.listSongs[id] = {
        ...this.listSongs[id],
        isLoading: true,
        url: listUrl
      };

      try {
        const { data } = await axios.post(`${B_URL}/${endpoint}`, { listUrl });

        this.listSongs[id] = {
          ...this.listSongs[id],
          songs: data.songs ?? [],
          name: data.playlist_name ?? 'Untitled',
          count: data.count ?? null,
          isLoading: false

        };
        this.stateStore.addTask({ name: `list:${data.playlist_name}` || "", id: id, listUrl: listUrl, url: `/h/yt/list/${id}` });

      } catch (error) {
        console.error(`Failed to fetch playlist [${id}]:`, error);
        this.listSongs[id] = {
          ...this.listSongs[id],
          songs: [],
          name: 'Error loading playlist',
          isLoading: false
        };
      }
    },
    async get_download_meta(id, url, itag) {
      try {
        const startTime = performance.now();

        const { data } = await axios.post(ENDPOINTS.FETCH_LIST_SONGS, { url, itag });
        this.stateStore.addTask({ id: id, name: data.title || data.filename  });
        await this.update_download_progress({
          id,
          downloadName: data.filename,
          filename: data.title,
          extension: data.extension,
          format: data.extension,
          duration: data.duration
        });

        const endTime = performance.now();
        // console.log(`Loaded file meta:`, data, `in ${(endTime - startTime).toFixed(2)} ms`);

        // return data; // return the metadata if needed

      } catch (error) {
        console.error(`Failed to fetch metadata for URL [${url}]:`, error);
        throw error;
      }
    },

    async getFileSogs(id, url) {
      try {
        const startTime = performance.now();
        const { data } = await axios.post(ENDPOINTS.FETCH_URL_FORMATS, { url });
        // this.stateStore.addTask({ id: id, name: data.title  })

        this.loadedformats[id] = {
          formats: data.streams || {},
          status: 'ready',
          title: data.info.title,
          artist: data.info.artist,
          views: data.info.views,
          duration: data.info.duration_sec,
          thumbnail: getYouTubeThumbnail(url),
          url: url
        }

        const endTime = performance.now();
        // console.log(`Loaded file meta:`, data, `in ${(endTime - startTime).toFixed(2)} ms`);

        // return data; // return the metadata if needed

      } catch (error) {
        console.error(`Failed to fetch metadata for URL [${url}]:`, error);
        throw error;
      }
    }

  }
});
