// Auto-unregister: this service worker removes itself and all caches
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.matchAll())
      .then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SW_UNREGISTERED' }));
        return self.registration.unregister();
      })
  );
});
