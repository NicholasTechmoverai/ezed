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

export async function saveFile(id, name, blob) {
    const db = await getDB()
    await db.put(STORE_NAME, { id, thumbnail, name, blob })
}

export async function getFile(id) {
    const db = await getDB()
    return db.get(STORE_NAME, id)
}

export async function getAllFiles() {
    const db = await getDB()
    return db.getAll(STORE_NAME)
}
