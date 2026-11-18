// ================= Adresses des pages =================
// Chaque page a sa propre adresse (medrevise.fr/cours, /planning, /profil/reglages, /admin/invitations…) :
// on peut la mettre en favori, la partager, et les boutons Précédent / Suivant du navigateur fonctionnent.
// GitHub Pages ne connaît que index.html : 404.html (copie de index.html) sert toutes les autres adresses.
const RT_TAB = { home: "", cours: "cours", cards: "cartes", qcm: "qcm", err: "erreurs", plan: "planning", add: "ajouter", prof: "profil" },
  RT_SEC = { moi: "mon-profil", compte: "compte", progres: "progression", cal: "calendrier", reg: "reglages", app: "apparence", don: "donnees", aide: "aide" },
  RT_NOM = { home: "Accueil", cours: "Cours", cards: "Flashcards", qcm: "QCM", err: "Erreurs", plan: "Planning", add: "Ajouter", prof: "Profil" },
  RT_INV = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
let RT_LAST = null;
// Adresse correspondant à l'écran affiché
function routeOf() {
  const t = tab == "data" ? "prof" : tab;
  if (t == "prof") {
    const ps = tab == "data" ? "don" : R.ps;
    if (ps == "admin") return "/admin" + (R.adm ? "/membre/" + encodeURIComponent(R.adm) : R.at == "inv" ? "/invitations" : "");
    return "/profil" + (RT_SEC[ps] ? "/" + RT_SEC[ps] : "");
  }
  if (t == "cours" && R.id && S.courses.some((c) => c.id === R.id)) return "/cours/" + encodeURIComponent(R.id);
  return "/" + (RT_TAB[t] ?? "");
}
function routeTitle() {
  const t = tab == "data" ? "prof" : tab;
  let n = RT_NOM[t] || "";
  if (t == "prof" && R.ps == "admin") n = "Administration";
  else if (t == "prof" && R.ps) n = ((PSEC.find((x) => x[0] == R.ps) || [])[1]) || n;
  else if (t == "cours" && R.id) n = ((S.courses.find((c) => c.id === R.id) || {}).titre) || n;
  return (t == "home" ? "" : n + " · ") + "MedRevise";
}
// Appelée après chaque affichage : met l'adresse et le titre de l'onglet à jour.
// Plusieurs affichages d'affilée (ex. Profil puis Administration) ne créent qu'une entrée d'historique.
let RT_Q = false;
function routeSync() {
  if (RT_Q) return;
  RT_Q = true;
  queueMicrotask(() => {
    RT_Q = false;
    if (typeof syGate == "function" && syGate()) return; // écran de connexion : on garde l'adresse demandée
    const p = routeOf();
    document.title = routeTitle();
    if (p !== location.pathname)
      try {
        history.pushState(null, "", p);
      } catch (e) {}
    RT_LAST = p;
  });
}
// Lit l'adresse et ouvre la page correspondante (au démarrage et avec Précédent / Suivant).
function routeIn() {
  const seg = location.pathname.split("/").filter(Boolean).map((x) => {
      try {
        return decodeURIComponent(x);
      } catch (e) {
        return x;
      }
    }),
    T = RT_INV(RT_TAB),
    P = RT_INV(RT_SEC);
  R = {};
  if (seg[0] == "admin") {
    tab = "prof";
    R.ps = "admin";
    if (seg[1] == "invitations") R.at = "inv";
    if (seg[1] == "membre" && seg[2]) R.adm = seg[2];
  } else if (seg[0] == "profil") {
    tab = "prof";
    if (P[seg[1]]) R.ps = P[seg[1]];
  } else if (seg[0] && T[seg[0]]) {
    tab = T[seg[0]];
    if (tab == "add") R.add = "qcm";
    if (tab == "cours" && seg[1] && S.courses.some((c) => c.id === seg[1])) R.id = seg[1];
  } else tab = "home";
  RT_LAST = location.pathname;
}
addEventListener("popstate", () => {
  if (R.run) {
    // session en cours : on reste sur la page et on remet l'adresse
    history.pushState(null, "", RT_LAST || "/");
    return go(tab);
  }
  clearInterval(IV);
  routeIn();
  render();
  scrollTo(0, 0);
});
