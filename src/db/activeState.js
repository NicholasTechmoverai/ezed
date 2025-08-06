import { openDB } from 'idb'

const DB_NAME = 'active_state-db'
const STORE_NAME = 'openedTasks' 

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Add or update a task in IndexedDB
 * @param {Object} task - Task object with at least an `id` property
 */
export async function addTask_db(task) {
  if (!task || !task.id) {
    console.error('addTask: Task must be an object with an "id" property')
    return 'addTask: Task must be an object with an "id" property'
  }

  try {
    const db = await getDB()
    const existing = await db.get(STORE_NAME, task.id) || {}

    const updated = {
      ...existing,
      ...task,
      timestamp: Date.now()
    }

    await db.put(STORE_NAME, updated)
  } catch (err) {
    console.error('addTask failed:', err)
  }
}

export async function getTask_db(id) {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}


export async function getAllTasks_db() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}


export async function deleteTask_db(id) {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}


export async function deleteAllTasks_db() {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
