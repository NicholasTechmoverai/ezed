// sw.js

console.log('Service Worker loaded');

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
  const tx = db.transaction('share-store', 'readwrite');
  const store = tx.objectStore('share-store');
  store.put(data);
  return tx.complete;
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only intercept GET requests to /share with params
  if (url.pathname === '/share' && event.request.method === 'GET') {
    console.log('[SW] Intercepted GET /share', url.search);

    event.respondWith((async () => {
      try {
        // Parse query params
        const dataToSave = {
          title: url.searchParams.get('title') || '',
          text: url.searchParams.get('text') || '',
          url: url.searchParams.get('url') || '',
          timestamp: Date.now()
        };

        console.log('[SW] Parsed share data:', dataToSave);

        // Save to IndexedDB
        await saveShareData(dataToSave);

        // Find or open the /share page
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        const client = allClients.find(c => c.url.includes('/share'));

        if (client) {
          console.log('[SW] Focusing existing /share tab');
          client.focus();
        } else {
          console.log('[SW] Opening /share page');
          await clients.openWindow('/share');
        }

        // Let the SPA handle rendering
        return fetch(event.request);

      } catch (err) {
        console.error('[SW] Failed to handle GET /share:', err);
        return new Response('Failed to process share', { status: 500 });
      }
    })());
  }
});
