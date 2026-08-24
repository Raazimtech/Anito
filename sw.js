const CACHE = 'movied-shell-v2';
const SHELL = ['./','./index.html','./styles.css','./app.js','./catalog-filter.js','./episodes.js','./manifest.json','./favicon.svg'];
const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';
const MIN_YEAR = 2000;
const MAX_YEAR = new Date().getUTCFullYear();

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
));

self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim())
));

function rewriteArchiveSearch(url) {
  if (url.origin + url.pathname !== ARCHIVE_SEARCH) return url;
  const next = new URL(url);
  const q = next.searchParams.get('q') || 'mediatype:movies';
  if (!q.includes('year:[')) next.searchParams.set('q', `(${q}) AND year:[${MIN_YEAR} TO ${MAX_YEAR}]`);
  next.searchParams.set('sort', 'year desc');
  return next;
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }))
    );
    return;
  }

  if (url.origin === 'https://archive.org' && url.pathname === '/advancedsearch.php') {
    event.respondWith(fetch(rewriteArchiveSearch(url).toString(), event.request));
  }
});
