// sw.js

console.log('Service Worker script loaded');

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('share-db', 1);
    request.onupgradeneeded = () => {
      console.log('IndexedDB upgrade needed, creating object store');
      const db = request.result;
      if (!db.objectStoreNames.contains('share-store')) {
        db.createObjectStore('share-store', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => {
      console.log('IndexedDB opened successfully');
      resolve(request.result);
    };
    request.onerror = () => {
      console.error('IndexedDB failed to open', request.error);
      reject(request.error);
    };
  });
}

async function saveShareData(data) {
  console.log('Saving share data to IndexedDB:', data);
  const db = await openDB();
  const tx = db.transaction('share-store', 'readwrite');
  const store = tx.objectStore('share-store');
  store.put(data);
  await tx.complete;
  console.log('Share data saved successfully');
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/share' && event.request.method === 'POST') {
    console.log('Intercepted POST /share request');

    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        console.log('FormData received:', formData);

        const dataToSave = {
          title: formData.get('title'),
          text: formData.get('text'),
          url: formData.get('url'),
          timestamp: Date.now()
        };

        await saveShareData(dataToSave);

        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        let client = allClients.find(c => c.url.includes('/share')) || allClients[0];
        if (client) {
          console.log('Focusing existing client:', client.url);
          client.focus();
        } else {
          console.log('Opening new window for /share');
          await clients.openWindow('/share');
        }

        return Response.redirect('/share', 303);
      } catch (e) {
        console.error('Failed to handle share POST:', e);
        return new Response('Failed to handle share', { status: 500 });
      }
    })());
  }
});
