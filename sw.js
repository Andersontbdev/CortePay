// CortePay: permite instalar como app e abrir a tela mesmo com internet instável.
// Sempre busca a versão mais nova; a cópia guardada só é usada quando a rede falha.
// Dados (Supabase) nunca passam por aqui: vão direto para a internet.
const CACHE = 'cortepay-v8';
const BASE = ['/', '/index.html', '/style.css?v=8', '/script.js?v=8', '/manifest.webmanifest',
  '/icones/icone-192.png', '/icones/icone-512.png', '/icones/favicon-64.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return resp;
    }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
  );
});
