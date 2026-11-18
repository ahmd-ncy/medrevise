function render() {
  document.body.dataset.t = tab;
  applyLook();
  // accès sur invitation : écran de connexion tant qu'il n'y a pas de compte membre
  if (typeof syGate == "function" && syGate()) {
    $("top").innerHTML = "";
    $("app").innerHTML = gate();
    return;
  }
  const TB = [
      ["home", "Accueil", "var(--c1)", "home"],
      ["cours", "Cours", "var(--c2)", "book"],
      ["cards", "Cartes", "var(--c3)", "cards"],
      ["qcm", "QCM", "var(--c4)", "check"],
      ["err", "Erreurs", "var(--c5)", "errors"],
      ["plan", "Planning", "var(--c2)", "cal"],
      ["add", "Ajouter", "var(--c6)", "plus"],
    ],
    pn =
      { prof: "Profil", data: "Données", veille: "Veille d’examen", syn: "Fiche de synthèse" }[tab] ||
      (TB.find((t) => t[0] === tab) || [])[1] ||
      "";
  $("top").innerHTML =
    '<div class="bn0"><div class="hd"><button class="logo" onclick="go(\'home\')" aria-label="MedRevise, accueil"><span class="lm">' +
    LOGO +
    "</span><span>MedRevise<small>" +
    esc(pn) +
    '</small></span></button>' +
    (typeof syBadge == "function" ? syBadge() : "") +
    '<span class="fch" title="Jours d’affilée">' +
    icn("flame") +
    " " +
    flame() +
    '</span><button class="av' +
    (tab == "prof" || tab == "data" ? " on" : "") +
    '" onclick="go(\'prof\')" aria-label="Profil">' +
    (S.photo ? avatar(S.name) : S.name ? esc(S.name[0].toUpperCase()) : icn("user")) +
    '</button></div></div><div class="tabs">' +
    TB.map(
      (t) =>
        '<button data-t="' +
        t[0] +
        '" style="--c:' +
        t[2] +
        '" class="' +
        (tab === t[0] ||
        (tab == "veille" && t[0] == "err") ||
        (tab == "syn" && t[0] == "cours")
          ? "on"
          : "") +
        '" onclick="go(\'' +
        t[0] +
        "')\">" +
        icn(t[3]) +
        "<span>" +
        t[1] +
        "</span></button>",
    ).join("") +
    "</div>";
  $("app").innerHTML = {
    home,
    plan,
    prof,
    data: () => ((R.ps = "don"), prof()),
    veille,
    syn,
    err: errs,
    cours: () => (R.id ? course() : list()),
    cards: () => (R.run ? card() : intro("cards")),
    qcm: () => (R.run ? (R.k == "vf" ? vfq() : qcm()) : intro("qcm")),
    add,
  }[tab]();
  if ($("tm")) upd();
  if (tab === "cours" && R.id) pdfInit();
  if ($("oci")) ocLoad();
  $("app").classList.toggle("wide", tab === "cours" && !!R.id);
  if (!(tab === "cours" && R.id)) document.body.classList.remove("pf");
  if (tab === "cours" && !R.id && R.sq) pdfSearchSoon();
  if (typeof tutoAuto == "function") tutoAuto();
}
function resetDlg() {
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>Réinitialiser l’application</h3><p class="m" style="font-weight:500">Supprime toutes les UE, chapitres, livrets, PDF, QCM, cartes, erreurs, compteurs et statistiques. L’apparence et ton prénom sont conservés. Cette action est définitive.</p><button class="big ko2" id="r1">Tout effacer (application vide)</button><button class="big" id="r2">Tout effacer et charger la démo</button><button class="big" style="background:var(--mut)" id="mn">Annuler</button></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("r1").onclick = () => {
    d.remove();
    resetAll(0);
  };
  $("r2").onclick = () => {
    d.remove();
    resetAll(1);
  };
}
function resetAll(demo) {
  const kp = {};
  ["pal", "mode", "bg", "bgd", "fx", "name", "lname", "fil", "fac", "bio", "photo", "font", "rad", "tsz", "mono", "acc", "anim", "theme", "tuto", "gel"].forEach((k) => {
    if (S[k] !== undefined) kp[k] = S[k];
  });
  S = seed();
  if (!demo) {
    S.mat = [];
    S.chap = [];
    S.courses = [];
    S.cards = [];
    S.qcm = [];
  }
  Object.assign(S, kp);
  BOOT = JSON.stringify(S);
  load();
  PD = null;
  PTX = {};
  DB()
    .then((d) => d.transaction("pdf", "readwrite").objectStore("pdf").clear())
    .catch(() => {})
    .then(() => {
      save();
      if (typeof syncWipeFiles == "function") syncWipeFiles();
    });
  clearInterval(IV);
  R = {};
  tab = "home";
  CM = 0;
  CD = "";
  render();
  scrollTo(0, 0);
}
let FO = { on: 0, ph: 0, left: 0, run: 0, iv: 0 };
function foTog() {
  FO.on = !FO.on;
  document.body.classList.toggle("fo", !!FO.on);
  clearInterval(FO.iv);
  if (FO.on) {
    FO.ph = 0;
    FO.left = (S.fw || 25) * 60;
    FO.run = 1;
    FO.iv = setInterval(foTick, 1000);
  }
  foDraw();
}
function foTick() {
  if (!FO.run) return;
  if (--FO.left <= 0) {
    FO.ph = 1 - FO.ph;
    FO.left = (FO.ph ? S.fb || 5 : S.fw || 25) * 60;
  }
  foDraw();
}
function foDraw() {
  let e = $("fob");
  if (!FO.on) {
    e && e.remove();
    return;
  }
  if (!e) {
    e = document.createElement("div");
    e.id = "fob";
    e.className = "fob";
    document.body.appendChild(e);
  }
  e.innerHTML =
    "<span>" +
    (FO.ph ? "Pause" : "Travail") +
    " · <b>" +
    fmt(FO.left) +
    '</b></span><button class="b" onclick="FO.run=!FO.run;foDraw()" aria-label="' +
    (FO.run ? "Mettre le minuteur en pause" : "Reprendre le minuteur") +
    '">' +
    (FO.run ? "❚❚" : "▶") +
    '</button><button class="b" onclick="foTog()">Quitter</button>';
}
