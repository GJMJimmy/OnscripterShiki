// OnscripterShiki offline cache service worker.
// Same-origin assets are served cache-first and filled on the fly, so the
// game keeps working offline once its files have been fetched (menu button
// precaches everything; playing online also accumulates the cache).
// Only HTTPS or localhost pages get a service worker.
// 版本号由页面注册时的 ?v= 传入（单一来源：页面里的 <meta name="ons_version">）
var ONS_VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
var ONS_SW_CACHE = "ons_shiki_" + ONS_VERSION;

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        var names = await caches.keys();
        await Promise.all(names
            .filter((n) => n != ONS_SW_CACHE && n.indexOf("ons_shiki_") == 0)
            .map((n) => caches.delete(n)));
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", (event) => {
    var request = event.request;
    if (request.method != "GET") return;
    var url = new URL(request.url);
    if (url.origin != self.location.origin) return;
    if (url.pathname.indexOf("/save/") >= 0) return; // save-sync API, never cached
    // 页面侧预缓存（X-Ons-Precache）自己写 Cache Storage，这里不再重复缓存一遍
    if (request.headers.get("X-Ons-Precache")) return;
    if (request.mode == "navigate") {
        // network-first so page updates still arrive, cache keeps it playable offline
        event.respondWith((async () => {
            var cache = await caches.open(ONS_SW_CACHE);
            try {
                // revalidate: page updates arrive reliably, and offline we fall
                // back to our Cache Storage instead of the browser HTTP cache
                var fresh = await fetch(request, {cache: "no-cache"});
                if (fresh.status == 200) cache.put(request, fresh.clone());
                return fresh;
            } catch (e) {
                var cached = await cache.match(request, {ignoreSearch: true});
                if (cached) return cached;
                throw e;
            }
        })());
        return;
    }
    // asset: cache-first, fill on miss
    event.respondWith((async () => {
        var cached = await caches.match(request);
        if (cached) return cached;
        var fresh = await fetch(request);
        if (fresh.status == 200) {
            var cache = await caches.open(ONS_SW_CACHE);
            cache.put(request, fresh.clone());
        }
        return fresh;
    })());
});
