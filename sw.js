// Service worker de MedRevise (généré par build.py à partir de sw.template.js : ne pas modifier sw.js à la main).
// Garde une copie de l'application pour qu'elle s'ouvre hors connexion.
// Fichiers de l'app : réseau d'abord (toujours la dernière version en ligne), copie locale si hors connexion.
const VERSION = "medrevise-330dde131b";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/00-config.js",
  "js/00-version.js",
  "js/01-icones.js",
  "js/02-etat.js",
  "js/03-demo.js",
  "js/04-base.js",
  "js/05-rendu.js",
  "js/06-fsrs.js",
  "js/07-cartes-trous-schemas.js",
  "js/08-synthese-lecteur.js",
  "js/09-accueil-profil.js",
  "js/10-cours.js",
  "js/11-sessions.js",
  "js/12-gerer.js",
  "js/13-calendrier-stats.js",
  "js/14-erreurs.js",
  "js/15-graphes.js",
  "js/16-apparence.js",
  "js/17-objectifs-methode-j.js",
  "js/18-ia-pdf.js",
  "js/19-ajout.js",
  "js/20-donnees.js",
  "js/21-import-json.js",
  "js/22-sync.js",
  "js/23-aide.js",
  "js/24-tuto.js",
  "js/99-demarrage.js",
  "vendor/pdf.min.js",
  "vendor/pdf.worker.min.js",
  "vendor/supabase.js",
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
