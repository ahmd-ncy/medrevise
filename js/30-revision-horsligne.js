// ================= Révision du jour (enchaînée) et hors connexion =================

// ---------- Révision du jour : flashcards dues → QCM à revoir → questions 3D, en une seule séance ----------
let MIX = null;
function mixPlan() {
  const cards = cardsToday().all.slice(0, 30),
    ids = new Set(),
    qs = [...qcmDue(), ...S.err.map((id) => S.qcm.find((q) => q.id === id)).filter(Boolean)].filter((q) => !ids.has(q.id) && ids.add(q.id)).slice(0, 15),
    st = (S.atq && S.atq.s) || {},
    // atlas : le modèle où tu as le plus d'erreurs, sinon le dernier utilisé
    weak = {};
  Object.entries(st).forEach(([k, o]) => {
    const m = k.split("|")[0];
    weak[m] = (weak[m] || 0) + (o.k || 0);
  });
  const hist = (S.atq && S.atq.hist) || [],
    model = Object.keys(weak).sort((a, b) => weak[b] - weak[a])[0] || (hist.length ? hist[hist.length - 1].m : null),
    steps = [];
  if (cards.length) steps.push({ k: "cards", n: cards.length, list: cards, l: "Flashcards" });
  if (qs.length) steps.push({ k: "qcm", n: qs.length, list: qs, l: "QCM à revoir" });
  if (typeof atlasOk == "function" && atlasOk() && model) steps.push({ k: "atlas", n: 10, m: model, l: "Questions 3D" });
  return steps;
}
// carte de l'accueil
function mixCard() {
  const P = mixPlan();
  if (!P.length) return "";
  const tot = P.reduce((t, s) => t + s.n, 0),
    min = Math.max(5, Math.round(P.reduce((t, s) => t + s.n * (s.k == "cards" ? 0.25 : s.k == "qcm" ? 1.2 : 0.4), 0)));
  return (
    '<button class="rs mixc" style="--sc:var(--c4)" onclick="mixStart()">' + icn("target") +
    '<span style="flex:1"><small>Révision du jour · environ ' + min + " min</small><br><b>" +
    P.map((s) => s.n + " " + { cards: "flashcards", qcm: "QCM à revoir", atlas: "questions 3D" }[s.k]).join(" · ") +
    "</b><br><small>" + tot + " éléments enchaînés, sans rien choisir</small></span>" + icn("chev") + "</button>"
  );
}
function mixStart() {
  const P = mixPlan();
  if (!P.length) return toast("Rien à réviser pour aujourd’hui ✔");
  MIX = { steps: P, i: 0 };
  mixStep();
}
function mixStep() {
  const s = MIX && MIX.steps[MIX.i];
  if (!s) return mixDone();
  if (s.k == "atlas") {
    MIX.live = true;
    ATL.auto = "mix";
    return atlasGo(s.m);
  }
  MIX.live = true;
  go(s.k);
  R.n = 0;
  start(s.k, s.list, { mode: "train" });
}
// texte ajouté à l'écran de fin d'une étape
function mixNext() {
  if (!MIX || !MIX.live) return "";
  MIX.live = false;
  const nx = MIX.steps[MIX.i + 1];
  return (
    '<div class="mixn"><small>Révision du jour · étape ' + (MIX.i + 1) + " / " + MIX.steps.length + " terminée</small>" +
    (nx
      ? '<button class="b p" onclick="MIX.i++;mixStep()">Étape suivante : ' + esc(nx.l) + " (" + nx.n + ") ›</button>"
      : '<button class="b p" onclick="mixDone()">Terminer la révision du jour</button>') +
    "</div>"
  );
}
function mixDone() {
  MIX = null;
  toast("Révision du jour terminée ✔ Bravo !");
  go("home");
}

// ---------- hors connexion : livrets (PDF), images des cartes et atlas téléchargés à l'avance ----------
let OFFK = null; // clés déjà présentes dans la base locale de l'appareil
async function offKeys(force) {
  if (OFFK && !force) return OFFK;
  try {
    OFFK = new Set(await idbKeys());
  } catch (e) {
    OFFK = new Set();
  }
  return OFFK;
}
// fichiers nécessaires à un chapitre : PDF des livrets et images des cartes à trous
function offItems(ch) {
  return [
    ...S.courses.filter((x) => x.ch === ch && x.pdf).map((x) => x.id),
    ...S.cards.filter((x) => x.ch === ch && x.oc).map((x) => "im:" + x.id),
  ];
}
function offState(ch) {
  const it = offItems(ch);
  if (!it.length) return "none";
  if (!OFFK) return "?";
  return it.every((k) => OFFK.has(k)) ? "ok" : "no";
}
function offBtn(ch) {
  const s = offState(ch);
  if (s == "none") return "";
  return (
    '<button class="offb ' + s + '" onclick="event.stopPropagation();offChap(\'' + ch + '\')" title="' +
    (s == "ok" ? "Disponible hors connexion" : "Télécharger pour réviser hors connexion") + '" aria-label="' +
    (s == "ok" ? "Disponible hors connexion" : "Télécharger pour hors connexion") + '">' +
    (s == "ok"
      ? '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>') +
    "</button>"
  );
}
// bibliothèques utiles hors connexion (le service worker les garde)
function offLibs(atlas) {
  const L = ["vendor/pdf.min.js", "vendor/pdf.worker.min.js"].concat(atlas ? ["vendor/three-atlas.js"] : []);
  return Promise.all(L.map((u) => fetch(u).catch(() => null)));
}
async function offChap(ch, quiet) {
  if (!navigator.onLine) return toast("Pas de connexion : impossible de télécharger maintenant.");
  const it = offItems(ch),
    keys = await offKeys(true),
    miss = it.filter((k) => !keys.has(k));
  if (!miss.length) {
    if (!quiet) toast("Ce chapitre est déjà disponible hors connexion ✔");
    return 0;
  }
  let ok = 0;
  for (const k of miss) {
    if (!quiet) toast("Téléchargement " + (ok + 1) + " / " + miss.length + "…", 1);
    try {
      if ((await pdfGet(k)) != null) ok++;
    } catch (e) {}
  }
  await offLibs();
  await offKeys(true);
  if (!quiet) toast(ok == miss.length ? "Chapitre disponible hors connexion ✔" : ok + " fichier(s) sur " + miss.length + " : les autres ne sont pas dans ton compte.");
  if (tab == "cours" && $("lst")) $("lst").innerHTML = lst();
  return ok;
}
async function offAll() {
  if (!navigator.onLine) return toast("Pas de connexion : impossible de télécharger maintenant.");
  const chs = S.chap.filter((c) => offItems(c.id).length);
  let n = 0;
  for (let i = 0; i < chs.length; i++) {
    toast("Chapitre " + (i + 1) + " / " + chs.length + " : " + esc(chs[i].titre) + "…", 1);
    n += await offChap(chs[i].id, true);
  }
  if (typeof atlasOk == "function" && atlasOk()) await atlasOffAll(true);
  toast("Tout est disponible hors connexion ✔ (" + n + " fichier" + (n > 1 ? "s" : "") + " téléchargé" + (n > 1 ? "s" : "") + ")");
  if (tab == "cours" && $("lst")) $("lst").innerHTML = lst();
}
// barre « hors connexion » en haut de la page Cours
function offBar() {
  if (!S.chap.some((c) => offItems(c.id).length)) return "";
  if (!OFFK) offKeys().then(() => tab == "cours" && !R.id && $("lst") && ($("lst").innerHTML = lst(), $("offbar") && ($("offbar").outerHTML = offBar())));
  const chs = S.chap.filter((c) => offItems(c.id).length),
    ok = OFFK ? chs.filter((c) => offState(c.id) == "ok").length : 0;
  return (
    '<div id="offbar" class="offbar"><span><b>Hors connexion</b><small>' + (OFFK ? ok + " / " + chs.length + " chapitres disponibles sans internet" : "…") +
    '</small></span><button class="b" onclick="offAll()">Tout télécharger</button></div>'
  );
}
// atlas : les modèles sont gardés dans le cache de l'appareil
async function atlasOffState() {
  const out = {};
  try {
    const ca = await caches.open(ATL.cache);
    for (const m of ATL.models) out[m.id] = !!((await ca.match("/atlas/" + m.id + ".glb")) || (await ca.match("/atlas/" + m.id + "-hd.glb")));
  } catch (e) {}
  return out;
}
async function atlasOffAll(quiet) {
  if (!navigator.onLine) return toast("Pas de connexion : impossible de télécharger maintenant.");
  let n = 0;
  for (const m of ATL.models) {
    if (ATL.files && !atlasHas(m.id)) continue;
    if (!quiet) toast("Atlas « " + esc(m.titre) + " »…", 1);
    try {
      await atlasFile(m.id);
      n++;
    } catch (e) {}
  }
  await offLibs(true);
  if (!quiet) toast(n + " atlas disponible" + (n > 1 ? "s" : "") + " hors connexion ✔");
  atlasOffPaint();
}
async function atlasOffPaint() {
  const box = $("atoff");
  if (!box) return;
  const st = await atlasOffState(),
    ok = ATL.models.filter((m) => st[m.id]).length;
  box.innerHTML =
    '<span><b>Hors connexion</b><small>' + (ok ? ATL.models.filter((m) => st[m.id]).map((m) => m.titre).join(", ") + " : disponible" + (ok > 1 ? "s" : "") + " sans internet" : "Aucun atlas téléchargé sur cet appareil") +
    "</small></span>" + (ok < ATL.models.length ? '<button class="b" onclick="atlasOffAll()">Tout télécharger</button>' : '<span class="offok">✓</span>');
}
