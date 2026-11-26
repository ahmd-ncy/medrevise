// Service worker de MedRevise (généré par build.py à partir de sw.template.js : ne pas modifier sw.js à la main).
// Garde une copie de l'application pour qu'elle s'ouvre hors connexion.
// Fichiers de l'app : réseau d'abord (toujours la dernière version en ligne), copie locale si hors connexion.
const VERSION = "medrevise-5f3c1f8";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.5f3c1f8.min.css",
  "app.5f3c1f8.min.js",
  "vendor/supabase.js",
  "fonts/inter-latin-500-normal.woff2",
  "fonts/inter-latin-600-normal.woff2",
  "fonts/inter-latin-800-normal.woff2",
  "fonts/source-serif-4-latin-600-normal.woff2",
  "fonts/source-serif-4-latin-700-normal.woff2",
  "icons/apple-touch-icon.png",
  "icons/favicon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
// Ouverture instantanée : les fichiers de l'app viennent de la copie locale de cette version.
// Les mises à jour arrivent par sw.js : à chaque nouvelle version publiée, son numéro change,
// la nouvelle copie se télécharge en arrière-plan, puis l'app se recharge toute seule.
self.addEventListener("fetch", (e) => {
  const req = e.request,
    u = new URL(req.url);
  if (req.method !== "GET") return;
  if (u.origin === location.origin) {
    e.respondWith(
      (async () => {
        const ca = await caches.open(VERSION);
        let r = await ca.match(req, { ignoreSearch: true });
        if (!r && req.mode === "navigate") r = await ca.match("index.html");
        return r || netCache(ca, req);
      })(),
    );
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    // polices : copie locale d'abord
    e.respondWith(
      caches.open(VERSION).then((ca) => ca.match(req).then((r) => r || netCache(ca, req))),
    );
  }
  // le reste (Supabase…) passe directement au réseau
});
function netCache(ca, req) {
  return fetch(req).then((r) => {
    if (r.ok) ca.put(req, r.clone());
    return r;
  });
}
