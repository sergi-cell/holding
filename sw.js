// Red primero: la versión nueva se ve al momento; la caché solo sirve sin conexión.
var CACHE = 'holding-v3';
var BASE = ['./', 'index.html', 'styles.css?v=3', 'manifest.json', 'js/data.js?v=3', 'js/engine.js?v=3', 'js/music.js?v=3', 'js/sprites.js?v=3', 'js/world.js?v=3', 'js/ui.js?v=3', 'js/pantallas.js?v=3', 'icons/icon-192.png', 'icons/icon-512.png', 'musica.pack'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin.indexOf('fonts.g') >= 0) {
    e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request).then(function (resp) { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); return resp; }); }));
    return;
  }
  e.respondWith(fetch(e.request, { cache: 'reload' }).then(function (resp) {
    if (resp.ok && url.origin === location.origin) { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); }
    return resp;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('index.html'); }); }));
});
