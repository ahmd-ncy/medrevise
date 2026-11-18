window.matchMedia &&
  matchMedia("(prefers-color-scheme: dark)").addEventListener &&
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyLook);
onkeydown = (e) => {
  if (tab === "cours" && R.id && $("pgc") && !$("md") && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
    if (e.key === "Escape" && document.body.classList.contains("pf")) pfs();
    if (e.key === "ArrowRight") pdfGo(1, 1);
    if (e.key === "ArrowLeft") pdfGo(-1, 1);
  }
  // Flashcards au clavier : espace pour retourner, 1 à 4 pour noter.
  if (tab === "cards" && R.run && !$("md") && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
    const c = R.q && R.q[R.i];
    if (e.key === " " && c && !c.oc) {
      e.preventDefault();
      flip();
    } else if (/^[1-4]$/.test(e.key) && R.seen) rate(+e.key);
  }
};
// Démarrage : lit l'état enregistré (IndexedDB), affiche l'app, puis lance la synchronisation.
(async () => {
  try {
    BOOT = (await pdfOp("get", "__etat")) ?? null;
  } catch (e) {}
  load();
  routeIn();
  syncInit();
  render();
  // Mise à jour automatique : quand une nouvelle version est publiée, elle s'installe et l'app se recharge.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker
      .register("sw.js", { updateViaCache: "none" })
      .then((reg) => {
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) reg.update().catch(() => {});
        });
      })
      .catch(() => {});
    let done = 0;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!had || done || R.run || $("md")) return;
      done = 1;
      flushSave().then(() => location.reload());
    });
  }
})();
addEventListener("pagehide", () => flushSave());
// Force la recherche d'une nouvelle version (Profil → Aide).
async function appRefresh() {
  toast("Recherche d’une mise à jour…");
  try {
    await flushSave();
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    if (reg) await reg.update();
    const ks = window.caches ? await caches.keys() : [];
    await Promise.all(ks.map((k) => caches.delete(k)));
  } catch (e) {}
  location.reload();
}
