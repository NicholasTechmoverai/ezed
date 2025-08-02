import { defineStore } from 'pinia';
import { useUserStore } from "@/store/index.js";
import { computed } from "vue";
import { BASE_URL,extractYouTubeID } from "@/utils/index.js";
// import { FFmpeg } from '@ffmpeg/ffmpeg';

// import socket from "@/services/websocket";
// import { ID3Writer } from 'browser-id3-writer';

// console.log("FFmpeg",FFmpeg); // Check if this logs the function



export const adv_UserStore = defineStore('downloadStore', {
  state: () => {
    const userStore = useUserStore();
    return {
      userStore,
      onGoingDownloads: {},
     
    };
  },


  actions: {
    async calculateETA(fileSizeInMB, downloadSpeedMbps) {
      if (downloadSpeedMbps <= 0) return "Calculating..."; // Avoid division by zero
  
      const etaSeconds = (fileSizeInMB * 8) / downloadSpeedMbps; // Convert MB to Megabits
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = Math.round(etaSeconds % 60);
  
      return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
  },

  async calculateSpeedPerSec(fetchedSize, elapseTime) {
    if (fetchedSize <= 0 || elapseTime <= 0) return 0; // Avoid division by zero

    // Convert fetched bytes to Megabits per second (Mbps)
    const speedMbps = (fetchedSize / (1024 * 1024)) * 8 / elapseTime; 

    console.log(`Fetched: ${fetchedSize} bytes | Time: ${elapseTime}s | Speed: ${speedMbps.toFixed(2)} Mbps`);
    
    return speedMbps; // Return numeric value
},

async download_yt_stream(
   songId,
   itag, 
   filename,
   extension, 
   start_byte = 0,
   size_mb=0,
   format = null,
   thumbnail=null,
   resolution,
  groupId =null,
  groupName=null,
  groupType=null,
  groupUrl=null
  ) {



    if (!this.userId) {
      
        return;
    }
    if (!itag) {
        return;
    }

    this.userStore.set_isAboutToDownload(true);
    let download_id;

    try {
        const response = await fetch(`${BASE_URL}/api/dwnld/download/yt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                itag, 
                song_url: songId, 
                songId: extractYouTubeID(songId),
                filename,
                userId:this.userId ,
                start_byte:start_byte,
                size_mb:size_mb,
                format: format,
                thumbnailUrl: thumbnail,
                ext: extension,
                groupId :groupId,
                groupName:groupName,
                groupType:groupType,
                groupUrl:groupUrl
            })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        this.downloadsCount('+');

        let isFirstChunk = true;
        const startTime = performance.now();
        const header_info = response.headers;
        const contentDisposition = header_info.get("Content-Disposition");

        const b_filename = contentDisposition 
            ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") 
            : filename || "downloaded_file"; 

        const b_extension = header_info.get("format") || extension;
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
        this.saveToFile(main_blob, b_filename, b_extension);
    } catch (error) {
        console.error("Download failed:", error);
        if (this.onGoingDownloads[download_id]) {
            this.onGoingDownloads[download_id].status = "failed";
        }
    } finally {
        this.userStore.set_isAboutToDownload(false);
    }
},


// Helper method to format ETA
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



    // Save File to Local System
    saveToFile(blob, filename, ext) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      console.log("File saved successfully:", filename);
      this.downloadsCount('-');
    },

  
    downloadsCount(val) {
      if (val === '+') {
        this.currentDownloadCount++;
      } else if (val === '-') {
        this.currentDownloadCount--;
      }
    },
    set_onGoingDownloads(id, dwn) {
      if (!this.onGoingDownloads[id]) {
        this.onGoingDownloads[id] = dwn; // Add new download
      } else {
        Object.assign(this.onGoingDownloads[id], dwn); // Update existing download
      }
    },
    
  }
});
