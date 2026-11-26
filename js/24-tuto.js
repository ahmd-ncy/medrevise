// ================= Visite guidée =================
// Se lance seule à la première ouverture (S.tuto absent), et depuis Profil → Aide.
// Chaque étape ouvre un onglet, met en lumière un élément (sel) et l'explique.
const TU = { on: 0, i: 0, asked: 0 };
const TSTEPS = [
  {
    tab: "home",
    t: "Bienvenue sur MedRevise",
    x: "Ton espace pour réviser la médecine : cours, QCM, flashcards et un planning qui organise tes journées. Cette visite prend une minute.<br><br>Le contenu affiché pour l’instant est une <b>démo</b> (marquée « EXEMPLE ») : explore-la librement, tu pourras la vider à la fin.",
  },
  {
    tab: "home",
    sel: ".flm",
    t: "Ta flamme",
    x: "Elle compte tes jours de travail d’affilée. L’anneau se remplit avec tes objectifs du jour : quand ils sont tous faits, la journée est bouclée et la flamme gagne un jour.",
  },
  {
    tab: "home",
    sel: "#hobj",
    t: "Tes objectifs du jour",
    x: "Jusqu’à trois objectifs tirés de ton planning. Touche un objectif pour aller directement au bon endroit.",
  },
  {
    tab: "home",
    sel: ".tls",
    t: "Au programme aujourd’hui",
    x: "Tes cartes à réviser, tes QCM à revoir et tes erreurs à corriger. En dessous, les chapitres prévus aujourd’hui avec la méthode des J.",
  },
  {
    tab: "home",
    sel: "#jj",
    t: "La méthode des J",
    x: "Chaque chapitre est revu à J1, J3, J7, J14 puis J30 après sa première étude. L’app te dit lesquels revoir chaque jour. Le bouton <b>?</b> à côté du titre l’explique en détail.",
  },
  {
    tab: "cours",
    sel: '.tabs [data-t="cours"]',
    t: "Cours",
    x: "Tes livrets rangés par UE et par chapitre. Tu peux lire tes PDF, surligner, prendre des notes, créer des flashcards depuis le texte, et ouvrir une fiche de synthèse par chapitre.",
  },
  {
    tab: "cards",
    sel: '.subtabs [data-t="cards"]',
    t: "Flashcards",
    x: "Dans l’onglet <b>Réviser</b>. Après chaque carte, dis si tu la savais : <b>À revoir</b>, <b>Difficile</b>, <b>Bien</b> ou <b>Facile</b>. L’app calcule le meilleur moment pour te la reposer.",
  },
  {
    tab: "qcm",
    sel: '.subtabs [data-t="qcm"]',
    t: "QCM",
    x: "Entraînement avec correction immédiate, examen blanc chronométré noté sur 20, ou mode vrai ou faux. Le barème est celui de Nancy, modifiable dans les réglages.",
  },
  {
    tab: "err",
    sel: '.subtabs [data-t="err"]',
    t: "Erreurs",
    x: "Chaque QCM raté arrive ici, rangé par UE et par chapitre, jusqu’à ce que tu le réussisses. Tu y trouves aussi tes cartes difficiles et les raisons de tes erreurs.",
  },
  {
    tab: "plan",
    sel: '.tabs [data-t="plan"]',
    t: "Planning",
    x: "Indique ton temps de travail par jour : le planning répartit tes rappels et tes nouveaux chapitres sur les jours à venir, et s’adapte à la date de ton concours.",
  },
  {
    tab: "add",
    sel: ".hadd",
    t: "Ajouter ton contenu",
    x: "Dans l’ordre : une <b>UE</b>, puis ses <b>chapitres</b>, puis tes <b>livrets</b> (PDF). Pour les QCM et les flashcards, le plus rapide est <b>Import depuis Claude</b> : Claude les prépare à partir de ton cours.",
  },
  {
    tab: "home",
    sel: ".av",
    t: "Ton profil",
    x: "Ta progression, ton calendrier, tes réglages (date du concours…), l’apparence, la sauvegarde et l’aide. Tu peux y relancer cette visite à tout moment.",
  },
  { tab: "home", end: 1, t: "À toi de jouer !", x: "" },
];
function tutoStart(force) {
  if (TU.on || (R.run && !force)) return;
  TU.on = 1;
  TU.i = 0;
  tutoShow();
  addEventListener("resize", tutoPos);
}
function tutoClose() {
  TU.on = 0;
  S.tuto = 1;
  save();
  const o = $("tuto");
  if (o) o.remove();
  removeEventListener("resize", tutoPos);
  go("home");
}
function tutoNav(k) {
  TU.i = Math.max(0, Math.min(TSTEPS.length - 1, TU.i + k));
  tutoShow(k);
}
function tutoShow(dir) {
  const st = TSTEPS[TU.i];
  if (tab !== st.tab || (st.tab == "prof" && R.ps)) {
    tab = st.tab;
    R = {};
    render();
  }
  // étape sans élément visible (ex. pas encore de chapitre) : on passe à la suivante
  if (st.sel && !document.querySelector(st.sel)) return tutoNav(dir < 0 ? -1 : 1);
  let o = $("tuto");
  if (!o) {
    o = document.createElement("div");
    o.id = "tuto";
    document.body.appendChild(o);
  }
  const n = TSTEPS.length,
    demo = !userContent(),
    end = st.end
      ? '<p>Commence par ajouter une UE et un chapitre dans <b>Ajouter</b>, puis importe tes QCM avec <b>Import depuis Claude</b>. Les boutons <b>?</b> t’expliquent chaque outil.</p>' +
        (demo
          ? '<div class="tbt"><button class="b" onclick="tutoClose()">Explorer la démo d’abord</button><button class="b p" onclick="tutoEmpty()">Vider la démo et commencer</button></div><small>Tu pourras aussi la vider plus tard : Profil → Données et sauvegarde → Réinitialiser.</small>'
          : '<div class="tbt"><button class="b p" onclick="tutoClose()">Terminer</button></div>')
      : "";
  o.innerHTML =
    '<div class="tsp" id="tsp"></div><div class="tcd" id="tcd" role="dialog" aria-modal="true" aria-labelledby="tct"><div class="r" style="margin:0;align-items:center"><small style="flex:1">' +
    (TU.i + 1) +
    " / " +
    n +
    '</small><button class="lnk" onclick="tutoClose()">Passer la visite</button></div><h3 id="tct">' +
    st.t +
    "</h3>" +
    (st.x ? "<p>" + st.x + "</p>" : "") +
    end +
    (st.end
      ? ""
      : '<div class="tbt">' +
        (TU.i ? '<button class="b" onclick="tutoNav(-1)">Précédent</button>' : "") +
        '<button class="b p" onclick="tutoNav(1)">Suivant</button></div>') +
    "</div>";
  const el = st.sel && document.querySelector(st.sel);
  if (el && !el.closest("header")) el.scrollIntoView({ block: "center" });
  else scrollTo(0, 0);
  setTimeout(tutoPos, 60);
  const b = o.querySelector(".tbt .b.p");
  if (b) b.focus();
}
function tutoPos() {
  const st = TSTEPS[TU.i],
    sp = $("tsp"),
    cd = $("tcd");
  if (!sp || !cd) return;
  const el = st.sel && document.querySelector(st.sel),
    W = innerWidth,
    H = innerHeight,
    cw = Math.min(380, W - 24);
  cd.style.width = cw + "px";
  if (!el) {
    sp.style.display = "none";
    $("tuto").classList.add("dim");
    cd.style.left = (W - cw) / 2 + "px";
    cd.style.top = Math.max(16, (H - cd.offsetHeight) / 2) + "px";
    return;
  }
  $("tuto").classList.remove("dim");
  const r = el.getBoundingClientRect(),
    p = 6;
  Object.assign(sp.style, {
    display: "block",
    left: r.left - p + "px",
    top: r.top - p + "px",
    width: r.width + 2 * p + "px",
    height: r.height + 2 * p + "px",
  });
  const ch = cd.offsetHeight,
    below = r.bottom + p + 12,
    top = below + ch < H - 8 ? below : Math.max(8, r.top - p - 12 - ch);
  cd.style.top = top + "px";
  cd.style.left = Math.max(12, Math.min(W - cw - 12, r.left + r.width / 2 - cw / 2)) + "px";
}
function tutoEmpty() {
  ask(
    "Vider la démo ? Tous les cours, QCM et cartes d’exemple seront supprimés pour repartir d’une application vide.",
    () => {
      TU.on = 0;
      const o = $("tuto");
      if (o) o.remove();
      resetAll(0);
      S.tuto = 1;
      save();
      go("add");
      R = { add: "mat" };
      render();
    },
    "Vider la démo",
  );
}
// Lancement automatique à la première visite de l'accueil.
function tutoAuto() {
  if (S.tuto || TU.on || TU.asked || tab !== "home" || $("md") || (typeof syGate == "function" && syGate())) return;
  TU.asked = 1;
  setTimeout(() => {
    if (!S.tuto && tab === "home" && !$("md")) tutoStart();
  }, 800);
}
