const CACHE_VERSION = "v1";
const CACHE_NAME = `pwa-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  // اگر فایل‌های css/js جدا داری اضافه کن:
  // "/styles.css",
  // "/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // فقط برای GET درخواست بده
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // برای resource های مهم، cache کن
          const copy = res.clone();

          // اگر قابل cache نبود (مثلاً 404)، هندل کن
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => {
          // fallback: اگر صفحه در دسترس نبود، index را بده
          if (req.mode === "navigate") return caches.match("/index.html");
          return cached || Response.error();
        });
    })
  );
});