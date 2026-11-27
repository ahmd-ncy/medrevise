// L'état est conservé dans IndexedDB (clé « __etat ») : BOOT contient sa dernière version texte.
// 99-demarrage.js le lit avant le premier load(). L'ancien stockage (localStorage) est repris une fois.
let BOOT = null,
  SVT = 0;
function load() {
  try {
    S = JSON.parse(BOOT ?? localStorage.getItem(K));
  } catch (e) {}
  if (!S || !S.mat) S = seed();
  if (S.ver !== 3) {
    const D = seed(),
      ids = ["a1", "p1", "p2", "b1"];
    S.qcm = S.qcm.filter((x) => !ids.includes(x.ch)).concat(D.qcm);
    S.courses = S.courses.filter((x) => !ids.includes(x.ch)).concat(D.courses);
    S.mat.forEach((m) => {
      const d = D.mat.find((x) => x.id === m.id);
      if (d) m.ico = d.ico;
    });
    S.ver = 3;
  }
  S.err = S.err || [];
  fsMigrate();
  // Style « Signature » (celui de l'écran de connexion) appliqué par défaut, une fois
  if (S.lookV !== 2) {
    Object.assign(S, { mode: "dark", pal: "signature", bg: "w", bgd: "p", fx: "aurora", font: "inter", rad: "r", mono: 0, theme: "signature" });
    S.lookV = 2;
  }
  S.jm = S.jm || {};
  S.pal = { sauge: "foret", sable: "aurore", papier: "aurore" }[S.pal] || S.pal;
  S.cs = S.cs || {};
  S.act = S.act || {};
  S.ec = S.ec || {};
  S.fsq = S.fsq || [];
  S.cf = S.cf || {};
  S.er = S.er || {};
  S.rc = S.rc || {};
  S.mat.forEach((m) => {
    const i = OLDC.indexOf(m.couleur);
    if (i >= 0) m.couleur = COL[i < 6 ? i : i < 11 ? i - 6 : i - 11];
  });
  S.qcm.forEach((q) => q.props.forEach((p) => (p.ok = p.ok === null ? null : !!p.ok)));
}
function save() {
  BOOT = JSON.stringify(S);
  clearTimeout(SVT);
  SVT = setTimeout(flushSave, 300);
  if (typeof syncSoon == "function") syncSoon();
}
// Écrit l'état dans IndexedDB (appelé 300 ms après la dernière modification, et quand l'app passe en arrière-plan).
async function flushSave() {
  clearTimeout(SVT);
  SVT = 0;
  if (BOOT == null) return;
  try {
    await pdfOp("put", "__etat", BOOT);
    try {
      localStorage.removeItem(K);
    } catch (e) {}
  } catch (e) {
    try {
      localStorage.setItem(K, BOOT);
    } catch (x) {
      if (!flushSave.w) ask("Stockage plein sur cet appareil : connecte-toi pour sauvegarder dans ton compte.", () => {}, "OK");
      flushSave.w = 1;
    }
  }
}
// Flamme : jours bouclés d'affilée. Un jour protégé par un gel garde la série sans l'allonger.
function flame() {
  const g = (S.gel && S.gel.used) || [],
    has = (d) => S.days.includes(d) || g.includes(d);
  let o = S.days.includes(day()) ? 0 : -1,
    n = 0;
  while (has(day(o))) {
    if (S.days.includes(day(o))) n++;
    o--;
  }
  return n;
}
function go(t) {
  if (R.run)
    return ask("Quitter la session en cours ? Ta progression sera perdue.", () => {
      clearInterval(IV);
      R = {};
      go(t);
    });
  clearInterval(IV);
  tab = t;
  R = t === "add" ? { add: "qcm" } : {};
  render();
  scrollTo(0, 0);
  const a = $("app");
  a.classList.remove("in");
  void a.offsetWidth;
  a.classList.add("in");
}
const ANS = () => [...new Set(S.qcm.map((q) => q.an).filter(Boolean))].sort(),
  san = (x) => {
    R.an = x === "" ? "" : ANS()[+x];
    render();
  };
const pick = (k) =>
  S[k].filter(
    (x) =>
      (k != "qcm" || !R.an || x.an === R.an) &&
      (k != "cards" || R.due === false || !x.due || x.due <= day()) &&
      (!R.f ||
        (R.f == "err"
          ? S.err.includes(x.id)
          : R.f == "due"
            ? x.due && x.due <= day()
          : R.f[0] == "m"
            ? mof(x).id == R.f.slice(2)
              : x.ch == R.f.slice(2))),
  );
const fsel = () =>
  '<select id="f" aria-label="Filtre" onchange="R.f=this.value;render()"><option value="">Tout</option>' +
  S.mat
    .map(
      (m) =>
        '<optgroup label="' +
        esc(m.nom) +
        '"><option value="m:' +
        m.id +
        '">Toute l’UE</option>' +
        S.chap
          .filter((c) => c.mid === m.id)
          .map((c) => '<option value="c:' + c.id + '">' + esc(c.titre) + "</option>")
          .join("") +
        "</optgroup>",
    )
    .join("") +
  "</select>";
let AU = "",
  AC = "";
const NOCH = "Cette UE n’a pas encore de chapitre : crée-le d’abord (onglet Chapitre).";
const chOpts = (u) =>
  S.chap
    .filter((c) => c.mid === u)
    .map(
      (c) =>
        '<option value="' + c.id + '"' + (c.id === AC ? " selected" : "") + ">" + esc(c.titre) + "</option>",
    )
    .join("") || '<option value="">Aucun chapitre dans cette UE</option>';
function chsel() {
  if (!S.mat.some((m) => m.id === AU)) AU = (S.mat[0] || {}).id || "";
  return (
    '<select id="ue" aria-label="UE" onchange="AU=this.value;AC=\'\';$(\'ch\').innerHTML=chOpts(AU);fillSl()">' +
    S.mat
      .map(
        (m) =>
          '<option value="' + m.id + '"' + (m.id === AU ? " selected" : "") + ">" + esc(m.nom) + "</option>",
      )
      .join("") +
    '</select><label class="f">Chapitre</label><select id="ch" onchange="AC=this.value;fillSl()">' +
    chOpts(AU) +
    "</select>"
  );
}
const BAR = {
    a: ["1 · 0,5 · 0", [1, 0.5]],
    b: ["1 · 0,7 · 0,1 · 0", [1, 0.7, 0.1]],
    c: ["1 · 0,5 · 0,2 · 0", [1, 0.5, 0.2]],
    d: ["Tout ou rien", [1]],
  },
  pf = (x) => String(x).replace(".", ","),
  sb = (x) => {
    S.bar = x;
    save();
    render();
  },
  sd = (x) => {
    R.due = x == "1";
    render();
  };
function ask(m, fn, ok) {
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><p>' +
    esc(m) +
    '</p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big ko2" id="my">' +
    (ok || "Quitter") +
    "</button></div></div>";
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("my").onclick = () => {
    d.remove();
    fn();
  };
  $("mn").focus();
}
// Réglages, rangés par thème, avec une explication sous chaque champ.
function settings() {
  const P = PL(),
    ex = S.exam && S.exam > day(),
    num = (lab, val, set, help, o) =>
      '<label class="f">' +
      lab +
      '</label><input type="number" value="' +
      val +
      '"' +
      (o || "") +
      ' onchange="' +
      set +
      ';save();render()">' +
      (help ? '<small class="hl">' + help + "</small>" : ""),
    grp = (id, t, body) => '<div class="c rg" id="' + id + '"><b>' + t + "</b>" + body + "</div>";
  return (
    grp(
      "rg_obj",
      "Concours et objectifs",
      '<label class="f">Date du concours</label><input type="date" value="' +
        (S.exam || "") +
        '" onchange="S.exam=this.value;save();render()"><small class="hl">Sert au compte à rebours et à calculer combien de nouveaux chapitres commencer par semaine.</small>' +
        num("Nombre de QCM pour l’objectif « QCM du jour »", S.goal || 20, "S.goal=Math.max(1,+this.value||20)", "Un objectif atteignable tous les jours vaut mieux qu’un gros objectif raté : 20 à 40 est un bon départ.", ' min="1"'),
    ) +
    grp(
      "rg_plan",
      "Planning et méthode des J " + helpBtn("j"),
      num("Temps de travail par jour (minutes)", P.cap, "S.pcap=Math.max(0,+this.value||0)", "Le temps que tu peux vraiment consacrer à tes chapitres chaque jour, en dehors des cours. Exemple : 3 h = 180.", ' min="0" step="15"') +
        num("Durée d’un rappel (minutes)", P.tr, "S.ptr=Math.max(1,+this.value||20)", "Le temps moyen pour revoir un chapitre déjà vu : relire sa fiche et faire quelques QCM. En général 15 à 30 min.", ' min="1"') +
        num("Durée d’un nouveau chapitre (minutes)", P.tn, "S.ptn=Math.max(1,+this.value||60)", "La première étude complète d’un chapitre (J0) : lecture du livret, fiche, premières questions. En général 45 à 90 min.", ' min="1"') +
        (ex
          ? num("Marge de révision avant le concours (jours)", P.buf, "S.pbuf=Math.max(0,+this.value||0)", "Pendant ces derniers jours, aucun nouveau chapitre n’est proposé : seulement des rappels. 14 jours est un bon réglage.", ' min="0"')
          : num("Nouveaux chapitres par jour", P.nd, "S.pnd=Math.max(0,+this.value||0)", "Utilisé tant que la date du concours n’est pas indiquée. 0,5 = un chapitre tous les deux jours.", ' min="0" max="10" step="0.5"')) +
        '<label class="f">Jours des rappels après J0</label><input type="text" value="' +
        JS().join(", ") +
        '" onchange="setJs(this.value)"><small class="hl">Les jours où tu revois un chapitre, séparés par des virgules. Par défaut 1, 3, 7, 14, 30 : ensuite, un rappel tous les 30 jours.</small>' +
        num("Lecture minimale pour valider un rappel (minutes)", S.jrl ?? 10, "S.jrl=Math.max(1,+this.value||10)", "Seulement pour un chapitre qui n’a ni QCM ni cartes : son rappel se valide après ce temps de lecture du livret.", ' min="1"'),
    ) +
    grp(
      "rg_fc",
      "Flashcards " + helpBtn("fsrs"),
      num("Mémorisation visée (%)", Math.round(fRet() * 100), "S.ret=Math.min(.97,Math.max(.7,(+this.value||90)/100))", "La probabilité de te souvenir d’une carte le jour où elle revient. 90 % est un bon réglage ; plus haut, les cartes reviennent plus souvent.", ' min="70" max="97"') +
        num("Nouvelles flashcards par jour", S.ncd ?? 20, "S.ncd=Math.max(0,+this.value||0)", "Les nouvelles cartes arrivent progressivement pour ne pas te noyer. 20 par jour représente environ 10 minutes.", ' min="0"'),
    ) +
    grp(
      "rg_qcm",
      "QCM et barème",
      '<label class="f">Barème : points pour 1 faute puis 2 fautes</label><div class="r" style="margin:0;flex-wrap:nowrap"><input type="number" step="0.1" min="0" max="1" value="' +
        (S.bt || [1, 0.5, 0.2])[1] +
        '" onchange="S.bt=[1,+this.value,(S.bt||[1,.5,.2])[2]];save()"><input type="number" step="0.1" min="0" max="1" value="' +
        (S.bt || [1, 0.5, 0.2])[2] +
        '" onchange="S.bt=[1,(S.bt||[1,.5,.2])[1],+this.value];save()"></div><small class="hl">0 faute = 1 point, 3 fautes ou plus = 0. Une proposition fausse cochée ou une juste oubliée compte comme une faute. Barème de Nancy : 0,5 et 0,2.</small>' +
        num("Seuil d’alerte par UE (/20)", S.seuil ?? 7, "S.seuil=+this.value", "Une UE dont ta note estimée passe sous ce seuil est signalée dans ton calendrier et tes notes.", ' min="0" max="20"'),
    ) +
    grp(
      "rg_fo",
      "Mode concentration",
      '<label class="f">Minutes de travail, puis minutes de pause</label><div class="r" style="margin:0;flex-wrap:nowrap"><input type="number" min="1" value="' +
        (S.fw || 25) +
        '" onchange="S.fw=Math.max(1,+this.value||25);save()"><input type="number" min="1" value="' +
        (S.fb || 5) +
        '" onchange="S.fb=Math.max(1,+this.value||5);save()"></div><small class="hl">Le minuteur du mode concentration (bouton cible pendant une séance ou une lecture). 25 et 5 : la méthode Pomodoro.</small>',
    )
  );
}
let IV;
onbeforeunload = (e) => {
  if (R.run) {
    e.preventDefault();
    e.returnValue = "";
  }
};
const ICO = (m) => icn(m.ic || OLDI[m.ico] || guessIc(m.nom)),
  fmt = (t) => Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
const chips = (a, cur, fn) =>
  '<div class="chips">' +
  a
    .map(
      (x) =>
        '<button class="chip' +
        (String(cur) === String(x[0]) ? " on" : "") +
        '"' +
        (x[2] ? ' style="--sc:' + x[2] + '"' : "") +
        ' onclick="' +
        fn +
        "('" +
        x[0] +
        "')\">" +
        x[1] +
        "</button>",
    )
    .join("") +
  "</div>";
const PAL = [
    ["ocean", "Océan"],
    ["foret", "Forêt"],
    ["aurore", "Aurore"],
    ["ardoise", "Ardoise"],
    ["lavande", "Lavande"],
  ],
  spal = (x) => {
    S.pal = x;
    save();
    render();
  },
  smode = (x) => {
    S.mode = x;
    save();
    render();
  },
  sbg = (x) => {
    S.bg = x;
    save();
    render();
  },
  sbgd = (x) => {
    S.bgd = x;
    save();
    render();
  },
  sfx = (x) => {
    S.fx = x;
    save();
    render();
  },
  sbm = (x) => {
    S.bm = x != "0";
    save();
    render();
  },
  saqm = (x) => {
    S.atqmix = x != "0";
    save();
    render();
  },
  scf = (x) => {
    R.cf = +x;
    render();
  },
  sc = (x) => {
    R.conf = x;
    render();
  },
  sec = (x) => {
    if (R.ec === x) return;
    if (R.ec) S.er[R.ec] = Math.max(0, (S.er[R.ec] || 1) - 1);
    R.ec = x;
    S.er[x] = (S.er[x] || 0) + 1;
    S.ec[R.q[R.i].id] = x;
    save();
    render();
  },
  sf = (x) => {
    R.f = x;
    render();
  },
  sn = (x) => {
    R.n = +x;
    render();
  },
  sv = (x) => {
    R.tv = +x;
    render();
  },
  cm = (x) => {
    R.mode = x;
    R.tm = x == "exam" ? "t" : "n";
    R.tv = 20;
    render();
  },
  ct = (x) => {
    R.tm = x;
    R.tv = x == "q" ? 30 : 10;
    render();
  },
  qs = (f) => {
    go("qcm");
    R.f = f;
    render();
  };
const lab = (f) =>
  f == "atl" ? "Anatomie 3D" : !f ? "Tout" : f == "err" ? "Carnet d'erreurs" : f == "due" ? "QCM à revoir" : f[0] == "m" ? M(f.slice(2)).nom : CH(f.slice(2)).titre;
function scope() {
  const k = tab == "qcm" ? "qcm" : "cards",
    cnt = (f) => {
      const o = R.f;
      R.f = f;
      const l = pick(k),
        n = l.length;
      R.f = o;
      return n;
    },
    cur = R.f || "",
    row = (f, label, col, ue) =>
      '<button class="sr' +
      (cur === f || (ue && cur.startsWith("c:") && CH(cur.slice(2)).mid === ue) ? " on" : "") +
      '" style="--sc:' +
      (col || "var(--ac)") +
      '" onclick="' +
      (ue ? "R.ue='" + ue + "';sf('" + f + "')" : "sf('" + f + "')") +
      '"><span class="sd"></span><span style="flex:1">' +
      label +
      "</span><small>" +
      cnt(f) +
      "</small>" +
      (ue ? '<span class="cv">›</span>' : "") +
      "</button>";
  if (R.ue && S.mat.some((m) => m.id === R.ue)) {
    const m = M(R.ue);
    return (
      '<div class="sl"><button class="sr" onclick="R.ue=\'\';render()"><span class="cv">‹</span><span style="flex:1">Toutes les UE</span></button>' +
      row("m:" + m.id, "Toute l’UE · " + esc(m.nom), m.couleur) +
      S.chap
        .filter((c) => c.mid === m.id)
        .map((c) => row("c:" + c.id, esc(c.titre), m.couleur))
        .join("") +
      "</div>"
    );
  }
  return (
    '<div class="sl">' +
    row("", "Tout mélangé") +
    (k == "qcm"
      ? row("due", "À revoir aujourd’hui (répétition espacée)", "var(--wn)") + row("err", "Carnet d’erreurs", "var(--ko)")
      : "") +    (k == "qcm" && typeof atlasQcmCount == "function" && atlasOk() && atlasQcmCount()
      ? '<button class="sr' + (cur === "atl" ? " on" : "") + '" style="--sc:#2a9d8f" onclick="sf(\'atl\')"><span class="sd"></span><span style="flex:1">Anatomie 3D (d’après tes atlas)</span><small>' + atlasQcmCount() + "</small></button>"
      : "") +
    S.mat.map((m) => row("m:" + m.id, ICO(m) + " " + esc(m.nom), m.couleur, m.id)).join("") +
    "</div>"
  );
}
