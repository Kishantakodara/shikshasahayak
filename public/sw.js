// ============================================================
// SHIKSHA SAHAYAK OS SERVICE WORKER: shiksha-sw-v1
// STRATEGY: Stale-While-Revalidate (Assets), Cache-First (PDFs/Static JSON), Network-First (APIs)
// ============================================================

const CACHE_NAME_STATIC = "shiksha-static-v1";
const CACHE_NAME_DYNAMIC = "shiksha-dynamic-v1";
const CACHE_NAME_MATERIALS = "shiksha-materials-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  "/logo.webp",
  "/favicon-32x32.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
  "/icon-maskable-192x192.png",
  "/icon-maskable-512x512.png",
  "/subjects_data.json",
  "/subject_codes.json",
];

// Install Event: Pre-cache static shell & offline fallback
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear obsolete caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            key !== CACHE_NAME_STATIC &&
            key !== CACHE_NAME_DYNAMIC &&
            key !== CACHE_NAME_MATERIALS
          ) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Smart Routing
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and development/localhost servers
  if (event.request.method !== "GET") return;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.port === "3000" || url.port === "5173" || url.pathname.startsWith("/@")) {
    return;
  }

  // 1. Static JSON files (subjects_data, subject_codes) -> Cache First
  if (url.pathname.endsWith(".json") && !url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME_STATIC).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Study Material PDFs / Downloads -> Cache First
  if (url.pathname.includes("/materials/doc_") || url.pathname.endsWith(".pdf")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME_MATERIALS).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. API Requests -> Network First, Fallback to Cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME_DYNAMIC).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 4. HTML Navigation Requests -> Network First, Fallback to /index.html, then /offline.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html").then((cachedIndex) => {
          if (cachedIndex) return cachedIndex;
          return caches.match("/").then((cachedRoot) => {
            if (cachedRoot) return cachedRoot;
            return caches.match(event.request).then((cached) => {
              return cached || caches.match("/offline.html");
            });
          });
        });
      })
    );
    return;
  }

  // 5. Default Static Assets -> Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME_STATIC).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => null);

      return cached || fetchPromise;
    })
  );
});

// Push Notification Listener
self.addEventListener("push", (event) => {
  let data = { title: "ShikshaSahayak Alert", body: "New GTU notes & PYQs are available!", url: "/student" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/logo.png",
    badge: "/favicon-32x32.png",
    data: { url: data.url || "/student" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Listener
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/student";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
