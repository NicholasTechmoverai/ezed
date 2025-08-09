import { openDB } from 'idb'

const DB_NAME = 'downloads-db'
const STORE_NAME = 'files'


async function checkIDBSupport() {
    try {
        if (!window.indexedDB) {
            throw new Error("IndexedDB not supported");
        }
        const request = indexedDB.open("test-db", 1);
        await new Promise((resolve, reject) => {
            request.onerror = () => reject(new Error("IDB access blocked"));
            request.onsuccess = () => resolve();
        });
        request.result.close();
        indexedDB.deleteDatabase("test-db");
        return true;
    } catch (error) {
        console.error("IDB blocked:", error);
        return false;
    }
}

if (!await checkIDBSupport()) {
    alert("This app needs IndexedDB. Check browser settings or disable private mode.");
}
await checkIDBSupport()


export async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        },
    })
}

/**
 * Saves or updates file download/merge metadata in IndexedDB.
 * 
 * Used for:
 * - Tracking download/merge progress and state.
 * - Debugging failed downloads/merges.
 * - Recording metrics for performance analysis or error reporting.
 *
 * === Stored Fields ===
 *
 * 📦 General File Info:
 * - id: Unique identifier (usually UUID).
 * - url: Original download URL.
 * - filename: Local or generated filename.
 * - format: e.g. "mp4", "webm", etc.
 * - ext: File extension.
 * - itag: YouTube format identifier (if applicable).
 * - hasAudio: Boolean flag if video includes audio.
 * - thumbnail: Video thumbnail URL.
 * -duration:
 * -format
 *
 * 🔁 Download Status:
 * - status:... 'pending' | 'downloading' | 'completed' | 'failed' | 'merging' | 'merged' | 'merge_failed'
 * - filesize: Total file size in bytes.
 * - downloadedSize: Number of bytes downloaded so far.
 * - audioLastChunk: Last audio chunk (for resume/debug).
 * - videoLastChunk: Last video chunk (for resume/debug).
 * - audioBlob / videoBlob: Optional binary blobs for incomplete or staged downloads.
 *
 * ⏱ Timing:
 * - startTime: Download start timestamp (ms).
 * - stopTime: Download end timestamp (ms).
 * - startMergeTime: Merge process start timestamp (ms).
 * - stopMergeTime: Merge process end timestamp (ms).
 *
 * 🔁 Merge Info:
 * - mergeStatus: 'pending' | 'merging' | 'merged' | 'failed'
 * - merge_progress: Percentage progress of merging (0–100)
 *
 * ⚙️ Internal:
 * - timestamp: Last updated timestamp.
 *
 * @param {string} id - Unique identifier for the file record.
 * @param {Object} updates - Partial object of fields to update.
 * @returns {Promise<Object>} - The updated record.
 */
export async function saveFile(id, updates = {}) {
    try {
        const db = await getDB();
        const existing = (await db.get(STORE_NAME, id)) || {};

        const updated = {
            ...existing,
            id,
            timestamp: Date.now(),
        };

        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                updated[key] = value;
            }
        }

        await db.put(STORE_NAME, updated);
        return updated;
    } catch (err) {
        console.error('saveFile failed:', err);
        throw err;
    }
}


export async function getFile(id) {
    const db = await getDB()
    return db.get(STORE_NAME, id)
}

export async function getAllFiles() {
    const db = await getDB()
    return db.getAll(STORE_NAME)
}


export async function clearBlob(id) {
    const db = await getDB()
    const file = await db.get(STORE_NAME, id)
    if (!file) return

    file.audioBlob = null
    file.videoBlob = null
    await db.put(STORE_NAME, file)
}


export async function deleteFile(id) {
    const db = await getDB()
    await db.delete(STORE_NAME, id)
}

export async function deleteAllFiles() {
    const db = await getDB()
    await db.clear(STORE_NAME)
}


