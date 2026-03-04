const CACHE_NAME = "uae-crisis-aid-v6";
const STATIC_ASSETS = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];
const API_PATHS = ["/api/airlines", "/api/emergency"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

function isApiRequest(request) {
  const url = new URL(request.url);
  return API_PATHS.some((path) => url.pathname.startsWith(path));
}

async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return new Response(JSON.stringify({ error: "Data currently unavailable.", offline: true }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return caches.match("/");
  }
}

async function handleStaticRequest(request) {
  const url = new URL(request.url);
  const isNextStaticAsset = url.pathname.startsWith("/_next/static/");

  if (isNextStaticAsset) {
    try {
      const response = await fetch(request, { cache: "no-store" });
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      throw new Error("Static asset unavailable");
    }
  }

  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleStaticRequest(request));
});
