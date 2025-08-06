// src/downloadStore.js
import { openDB } from 'idb'

const DB_NAME = 'downloads-db'
const STORE_NAME = 'files'

export async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        },
    })
}

export async function saveFile(id, url, filename = undefined, blob = undefined, status = undefined, thumbnail = undefined, filesize = undefined, downloadedSize = undefined) {
    try {
        const db = await getDB();
        const existing = await db.get(STORE_NAME, id) || {};

        const updated = {
            ...existing,
            id,
            url,
            timestamp: Date.now(),
        };

        if (filename !== undefined && filename !== null) updated.filename = filename;
        if (blob !== undefined) updated.blob = blob; // allow null to clear blob
        if (status !== undefined && status !== null) updated.status = status;
        if (thumbnail !== undefined && thumbnail !== null) updated.thumbnail = thumbnail;
        if (filesize !== undefined && filesize !== null) updated.filesize = filesize;
        if (downloadedSize !== undefined && downloadedSize !== null) updated.downloadedSize = downloadedSize;

        await db.put(STORE_NAME, updated);
    } catch (err) {
        console.error('saveFile failed:', err);
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

    file.blob = null
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


