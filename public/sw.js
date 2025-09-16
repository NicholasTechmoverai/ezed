
// 🔄 Auto-update logic
self.addEventListener("install", (event) => {
  console.log("[SW] Installing new version…");
  self.skipWaiting(); // activate immediately
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new version…");
  event.waitUntil(clients.claim()); // take control of all tabs
});

// -----------------------------
// IndexedDB helpers
// -----------------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('share-db', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('share-store')) {
        db.createObjectStore('share-store', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveShareData(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('share-store', 'readwrite');
    const store = tx.objectStore('share-store');
    store.put(data);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// -----------------------------
// Share Intercept
// -----------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept GET requests to /share
  if (url.pathname === '/share' && event.request.method === 'GET') {
    console.log('[SW] Intercepted GET /share', url.search);

    event.respondWith((async () => {
      try {
        const dataToSave = {
          title: url.searchParams.get('title') || '',
          text: url.searchParams.get('text') || '',
          url: url.searchParams.get('url') || '',
          timestamp: Date.now(),
        };

        console.log('[SW] Parsed share data:', dataToSave);
        await saveShareData(dataToSave);

        // Try to find an open /share tab
        const allClients = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        let client = allClients.find((c) => c.url.includes('/share'));

        if (client) {
          console.log('[SW] Focusing existing /share tab');
          client.focus();
        } else {
          console.log('[SW] Opening new /share tab');
          client = await clients.openWindow('/share');
        }

        // Let your SPA handle rendering after navigation
        return Response.redirect('/share', 302);

      } catch (err) {
        console.error('[SW] Failed to handle GET /share:', err);
        return new Response('Failed to process share', { status: 500 });
      }
    })());
  }
});
