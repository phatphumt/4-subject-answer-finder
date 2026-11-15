/* Answer Finder service worker.
   Precaches the app shell so the site works offline (file:// is not covered,
   but localhost and GitHub Pages are). */

var CACHE_NAME = "answer-finder-v1";

var PRECACHE = [
  "./",
  "./index.html",
  "./answer-sheet.html",
  "./styles.css",
  "./app.js",
  "./answer-sheet.js",
  "./to-top.js",
  "./pwa.js",
  "./data.js",
  "./manifest.webmanifest",
  "./vendor/tailwind.js",
  "./fonts/anuphan-thai.woff2",
  "./fonts/anuphan-latin.woff2",
  "./fonts/anuphan-latin-ext.woff2",
  "./fonts/anuphan-vietnamese.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key !== CACHE_NAME;
        }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try {
    url = new URL(request.url);
  } catch (error) {
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Past-paper PDFs are large: leave them to the network.
  if (url.pathname.indexOf("/papers/") !== -1) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, copy);
        });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for the app shell.
  event.respondWith(
    caches.match(request).then(function (hit) {
      var network = fetch(request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        return hit;
      });

      return hit || network;
    })
  );
});
