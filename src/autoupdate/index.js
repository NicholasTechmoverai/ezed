import { SITEMETA } from "../utils"

export async function checkForUpdate() {
  if (!navigator.onLine) {
    console.log("📴 Offline — skipping update check")
    return
  }

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/NicholasTechmoverai/project_versions/main/version.json",
      { cache: "no-cache" }
    )
    const data = await res.json()

    const { version } = data[SITEMETA.name || "e-zed"]
    const currentVersion = localStorage.getItem("pwaVersion") || "0.0.0"

    console.log(`Current version: ${currentVersion}, Latest version: ${version}`)

    if (version !== currentVersion) {
      console.log(`🔄 Update available → upgrading to ${version}`)

      localStorage.setItem("pwaVersion", version)

      // Selectively clear other keys (avoid wiping version again)
      Object.keys(localStorage).forEach(key => {
        if (key !== "pwaVersion") localStorage.removeItem(key)
      })
      sessionStorage.clear()

      // Clear service worker caches
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
        console.log("✅ Service worker caches cleared")
      }

      // Clear IndexedDB
      if ("indexedDB" in window && indexedDB.databases) {
        const dbs = await indexedDB.databases()
        for (const db of dbs) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
            console.log(`🗑️ Deleted IndexedDB: ${db.name}`)
          }
        }
      }

      // Tell SW to activate immediately
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" })
        }
      }

      // Hard reload to apply update
      window.location.reload()
    } else {
      console.log("✅ Already running the latest version")
    }
  } catch (err) {
    console.error("❌ Update check failed:", err)
  }
}
