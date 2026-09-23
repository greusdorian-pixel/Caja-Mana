const CACHE_NAME = 'caja-mana-v4';

// Al instalar la nueva versión, tomar control inmediatamente
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './css/styles.css',
        './js/app.js',
        './js/config.js',
        './js/fiados.js',
        './js/gastos.js',
        './js/pos.js',
        './js/productos.js',
        './js/resumen.js',
        './js/storage.js',
        './assets/logo.jpg',
        './manifest.json'
      ]);
    })
  );
});

// Al activar, eliminar TODAS las cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Eliminando caché vieja:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First (primero intenta internet, si falla usa caché)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, actualiza la caché
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin internet, sirve desde caché
        return caches.match(event.request);
      })
  );
});
