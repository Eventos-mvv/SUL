// Service worker — Check-in Sul 2026
// Estratégia: network-first para o app (garante que atualizações cheguem
// quando online), com fallback em cache para funcionar offline.
const CACHE_NAME = 'checkin-sul26-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var req = event.request;

  // Nunca interceptar chamadas ao Firebase (dados de check-in em tempo real)
  if (req.url.indexOf('firebaseio.com') !== -1 ||
      req.url.indexOf('firebasedatabase.app') !== -1 ||
      req.url.indexOf('googleapis.com') !== -1) {
    return;
  }

  // Só tratamos GET; outros métodos seguem direto para a rede
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req).then(function(res) {
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(req, resClone);
      });
      return res;
    }).catch(function() {
      return caches.match(req).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
