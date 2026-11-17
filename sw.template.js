// Service worker de MedRevise (généré par build.py à partir de sw.template.js : ne pas modifier sw.js à la main).
// Garde une copie de l'application pour qu'elle s'ouvre hors connexion.
// Fichiers de l'app : réseau d'abord (toujours la dernière version en ligne), copie locale si hors connexion.
const VERSION = "medrevise-__VERSION__";
const FILES = [
  __FILES__
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request,
    u = new URL(req.url);
  if (req.method !== "GET") return;
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok) {
            const c = r.clone();
            caches.open(VERSION).then((ca) => ca.put(req, c));
          }
          return r;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))),
    );
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    // polices : copie locale d'abord
    e.respondWith(
      caches.match(req).then(
        (r) =>
          r ||
          fetch(req).then((n) => {
            const c = n.clone();
            caches.open(VERSION).then((ca) => ca.put(req, c));
            return n;
          }),
      ),
    );
  }
  // le reste (Supabase…) passe directement au réseau
});
