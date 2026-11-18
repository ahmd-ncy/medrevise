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
  syncInit();
  render();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
    navigator.serviceWorker.register("sw.js").catch(() => {});
})();
addEventListener("pagehide", () => flushSave());
