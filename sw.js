/* Service worker do Nossas Viagens: abre offline (útil em aeroporto sem sinal).
   Ao mudar o index.html, aumente a VERSAO para forçar a atualização no celular.
   O dados/salas-vip.json é buscado na rede primeiro, então a base nova chega sem mexer aqui. */
const VERSAO = "nv-v2";
const ARQUIVOS = ["./", "index.html", "dados/salas-vip.json", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // links externos seguem direto
  if (url.pathname.endsWith("/dados/salas-vip.json")) {                  // rede primeiro
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => {     // cache primeiro, atualiza em segundo plano
    const rede = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return r; })
      .catch(() => hit || caches.match("index.html"));
    return hit || rede;
  }));
});
