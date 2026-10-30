const CACHE_VERSION = "money-tracking-network-only-v1";
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith("money-tracking-") && key !== CACHE_VERSION).map((key) => caches.delete(key)));
  await self.clients.claim();
})()));
// Financial pages and API responses are deliberately never cached.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
