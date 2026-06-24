const CACHE_NAME = "dash-k-express-booking-v13";
const APP_SHELL = [
  "/",
  "/index.html",
  "/privacy.html",
  "/terms.html",
  "/hr.html",
  "/styles.css?v=13",
  "/app.js?v=13",
  "/hr.js?v=10",
  "/movingos-ai.html",
  "/movingos-ai.css",
  "/movingos-ai.js",
  "/manifest.webmanifest?v=13",
  "/icons/icon.svg",
  "/icons/apple-touch-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("/index.html"));
    })
  );
});
