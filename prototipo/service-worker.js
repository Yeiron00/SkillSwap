// Service worker de SkillSwap (PWA).
// - Archivos estáticos de la app: "stale-while-revalidate" (abre al instante desde caché y se actualiza en segundo plano).
// - Llamadas a la API (otro origen): siempre a la red; nunca se cachean datos de usuarios.
// Sube CACHE_VERSION cuando cambie la lista de archivos para invalidar la caché anterior.

const CACHE_VERSION = "skillswap-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./api.js",
  "./app.js",
  "./chatbot.js",
  "./pwa.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async cache => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached || (req.mode === "navigate" ? cache.match("./index.html") : undefined));
      return cached || network;
    })
  );
});
