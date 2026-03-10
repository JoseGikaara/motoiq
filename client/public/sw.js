const CACHE_NAME = "motoriq-shell-v1";
const API_CACHE = "motoriq-api-v1";
const SHELL_ASSETS = ["/", "/index.html", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API caching for recent leads/tasks (view-only when offline)
  if (url.pathname.startsWith("/api/leads") || url.pathname.startsWith("/api/tasks")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // App shell: network-first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((res) => res || caches.match("/index.html")))
    );
  }
});

