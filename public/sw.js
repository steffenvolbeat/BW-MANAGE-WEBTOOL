/**
 * FEATURE R: PWA SERVICE WORKER – OFFLINE-FIRST + BACKGROUND SYNC
 *
 * Strategien:
 *  - Statische Assets: Cache-First (CACHE_NAME versioniert)
 *  - Seiten: Network-First mit Fallback auf Cache → Offline-Shell
 *  - API /api/sync: Background Sync mit IndexedDB-Queue
 *  - Andere APIs: Network-First, kein Caching (sensible Daten)
 *
 * CRDT-Prinzip: Write-Ahead-Log in IDB → Replay on Reconnect
 * Sicherheit: Kein Caching von Auth/PII-Daten. Sessions werden niemals gecached.
 */

const CACHE_VERSION = "v9";
const STATIC_CACHE = `bw-manage-static-${CACHE_VERSION}`;
const PAGE_CACHE = `bw-manage-pages-${CACHE_VERSION}`;
const SYNC_TAG = "bw-manage-sync";
const IDB_DB = "bw-manage-offline";
const IDB_STORE = "sync-queue";

const PRECACHE_ASSETS = ["/", "/dashboard", "/offline"];

const NEVER_CACHE = [
  "/api/auth",
  "/api/vault",
  "/api/privacy",
  "/api/security",
  "/api/identity",
  "/api/tee",
];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: Alte Caches bereinigen ────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((p) => url.pathname.startsWith(p))) return;

  // Manifest immer nativ holen – niemals cachen (verhindert Syntax-Fehler durch gecachtes HTML)
  if (url.pathname === "/manifest.json") return;

  // Background Sync für /api/sync POST
  if (url.pathname === "/api/sync" && request.method === "POST") {
    event.respondWith(syncWithFallback(request.clone()));
    return;
  }

  // Andere APIs: Network-Only
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Nur GET-Requests cachen – POST/PUT/DELETE etc. niemals
  if (request.method !== "GET") return;

  // Statische Bundles: Cache-First
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/static/")) {
    event.respondWith(cacheFirst(STATIC_CACHE, request));
    return;
  }

  // Seiten: Network-First → Cache-Fallback
  event.respondWith(networkFirstWithCache(PAGE_CACHE, request));
});

// ─── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayOfflineQueue());
  }
});

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "BW-Manage", {
      body: data.body || "Sie haben eine neue Benachrichtigung.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: data.tag || "bw-manage",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data ? event.notification.data.url : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url === target && "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});

// ─── Strategien ───────────────────────────────────────────────────────────────

function cacheFirst(cacheName, request) {
  if (request.method !== "GET") return fetch(request);
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        // clone() muss synchron VOR return erfolgen, da danach der Body bereits gelesen wird
        var responseToCache = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, responseToCache));
      }
      return response;
    }).catch(() => new Response("Offline", { status: 503 }));
  });
}

function networkFirstWithCache(cacheName, request) {
  if (request.method !== "GET") return fetch(request);
  return fetch(request).then((response) => {
    if (response.ok) {
      // clone() muss synchron VOR return erfolgen, da danach der Body bereits gelesen wird
      var responseToCache = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, responseToCache));
    }
    return response;
  }).catch(() =>
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return caches.match("/offline").then(
        (shell) => shell || new Response("<h1>Offline</h1>", { headers: { "Content-Type": "text/html" } })
      );
    })
  );
}

function networkOnly(request) {
  return fetch(request).catch(() =>
    new Response(JSON.stringify({ error: "Offline", offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  );
}

function syncWithFallback(request) {
  return fetch(request).catch(() =>
    request.clone().text().then((body) => {
      return enqueueOffline({ url: request.url, method: "POST", body, timestamp: Date.now() }).then(() => {
        try { self.registration.sync.register(SYNC_TAG); } catch (_) {}
        return new Response(
          JSON.stringify({ queued: true, message: "Offline gespeichert – wird synchronisiert sobald online" }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      });
    })
  );
}

// ─── IndexedDB Queue ─────────────────────────────────────────────────────────

function openIDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = function(e) {
      e.target.result.createObjectStore(IDB_STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function(e) { reject(e.target.error); };
  });
}

function enqueueOffline(entry) {
  return openIDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).add(entry);
      tx.oncomplete = resolve;
      tx.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function replayOfflineQueue() {
  return openIDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(IDB_STORE, "readonly");
      var req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = function(e) { resolve({ db: db, entries: e.result }); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }).then(function(result) {
    var db = result.db;
    var entries = result.entries;
    return entries.reduce(function(chain, entry) {
      return chain.then(function() {
        return fetch(entry.url, {
          method: entry.method,
          headers: { "Content-Type": "application/json" },
          body: entry.body,
        }).then(function(response) {
          if (response.ok || response.status < 500) {
            return new Promise(function(resolve, reject) {
              var tx = db.transaction(IDB_STORE, "readwrite");
              var req = tx.objectStore(IDB_STORE).delete(entry.id);
              req.onsuccess = resolve;
              req.onerror = function(e) { reject(e.target.error); };
            });
          }
        }).catch(function() {});
      });
    }, Promise.resolve());
  });
}
