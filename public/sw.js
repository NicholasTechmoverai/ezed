// sw.js

// Open IndexedDB and create object store
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

// Save share data to IndexedDB
async function saveShareData(data) {
  const db = await openDB();
  const tx = db.transaction('share-store', 'readwrite');
  const store = tx.objectStore('share-store');
  store.put(data);
  return tx.complete;
}

// Intercept share POST
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();

        const dataToSave = {
          title: formData.get('title'),
          text: formData.get('text'),
          url: formData.get('url'),
          timestamp: Date.now()
          // You can add files handling here if needed
        };

        await saveShareData(dataToSave);

        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        let client = allClients.find(c => c.url.includes('/share')) || allClients[0];
        if (client) {
          client.focus();
        } else {
          await clients.openWindow('/share');
        }

        return Response.redirect('/share', 303);
      } catch (e) {
        return new Response('Failed to handle share', { status: 500 });
      }
    })());
  }
});
