// Sod Job Tracker — service worker
// Caches the app shell so the app opens instantly and the UI still loads
// with no signal. Firestore/Storage data itself needs a connection to
// sync, but Firestore's own offline cache (enabled in index.html) covers
// short gaps automatically.

const CACHE_NAME = "sod-tracker-shell-v2";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Never intercept Firebase/Firestore/Storage calls — always go to network.
  if (req.url.includes("googleapis.com") || req.url.includes("firebaseio.com") || req.url.includes("gstatic.com")) {
    return;
  }

  // The app page (HTML) uses NETWORK-FIRST so a freshly deployed version
  // shows up right away, with the cached copy as an offline fallback.
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", resClone));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // Other assets (icons, manifest): cache-first, falling back to network.
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok && req.url.startsWith(self.location.origin)) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});
