// Service Worker — Almoxarifado Prumo
const CACHE = 'prumo-almox-v1';
const ASSETS = [
  '/PRUMO-/',
  '/PRUMO-/index.html',
  '/PRUMO-/manifest.json',
  '/PRUMO-/icon-192.png',
  '/PRUMO-/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Instala e faz cache dos assets principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.warn('Cache miss:', url, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

// Limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first, fallback para cache
self.addEventListener('fetch', e => {
  // Supabase API — sempre network, sem cache
  if (e.request.url.includes('supabase.co')) return;
  // Google Fonts — cache first
  if (e.request.url.includes('fonts.')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }
  // App shell — network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/PRUMO-/index.html')))
  );
});
