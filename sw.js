// Service worker: deixa o app funcionando mesmo sem internet no dia da prova.
// Ao mudar qualquer arquivo do app, aumente a versão abaixo para os celulares baixarem a nova.
const VERSAO = 'desafio-v1';
const ARQUIVOS = [
  './', 'index.html', 'css/style.css', 'js/app.js', 'manifest.webmanifest',
  'assets/logo.jpg', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Tenta a internet primeiro; se não tiver sinal, usa a cópia salva.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
