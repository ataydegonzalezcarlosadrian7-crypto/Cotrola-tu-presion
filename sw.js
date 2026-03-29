const CACHE_NAME = 'hipercontrol-v3-cache';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png'
];

// Instalación y cacheo de archivos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Estrategia: Cache First, falling back to network
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones de anuncios o externas de analítica para evitar errores de cache
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Solo cachear recursos locales
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Si todo falla (offline total), servir index.html si es una navegación
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
