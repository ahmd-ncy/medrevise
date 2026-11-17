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
function flame() {
  let o = S.days.includes(day()) ? 0 : -1,
    n = 0;
  while (S.days.includes(day(o))) {
    n++;
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
function settings() {
  return (
    '<div class="c"><label class="f">Ton prénom</label><input type="text" value="' +
    esc(S.name || "") +
    '" onchange="S.name=this.value.trim();save();render()"><label class="f">Date du concours</label><input type="date" value="' +
    (S.exam || "") +
    '" onchange="S.exam=this.value;save()"><label class="f">Nombre de QCM pour l’objectif « QCM du jour »</label><input type="number" min="1" value="' +
    (S.goal || 20) +
    '" onchange="S.goal=Math.max(1,+this.value||20);save()"><label class="f">Mode concentration : minutes de travail, puis de pause</label><div class="r" style="margin:0;flex-wrap:nowrap"><input type="number" min="1" value="' +
    (S.fw || 25) +
    '" onchange="S.fw=Math.max(1,+this.value||25);save()"><input type="number" min="1" value="' +
    (S.fb || 5) +
    '" onchange="S.fb=Math.max(1,+this.value||5);save()"></div><label class="f">Mémorisation visée par la répétition espacée (%)</label><input type="number" min="70" max="97" value="' +
    Math.round(fRet() * 100) +
    '" onchange="S.ret=Math.min(.97,Math.max(.7,(+this.value||90)/100));save()"><small>90 % est un bon réglage. Plus haut, tu révises plus souvent pour moins oublier.</small><label class="f">Nouvelles flashcards par jour</label><input type="number" min="0" value="' +
    (S.ncd ?? 20) +
    '" onchange="S.ncd=Math.max(0,+this.value||0);save()"><small>Les rappels de la méthode des J et le temps de travail se règlent dans le Planning.</small><label class="f">Seuil d’alerte par UE (/20)</label><input type="number" min="0" max="20" value="' +
    (S.seuil ?? 7) +
    '" onchange="S.seuil=+this.value;save()"><label class="f">Barème : points pour 1 faute puis 2 fautes (0 faute = 1, 3 fautes ou plus = 0)</label><div class="r" style="margin:0"><input type="number" step="0.1" min="0" max="1" value="' +
    (S.bt || [1, 0.5, 0.2])[1] +
    '" onchange="S.bt=[1,+this.value,(S.bt||[1,.5,.2])[2]];save()"><input type="number" step="0.1" min="0" max="1" value="' +
    (S.bt || [1, 0.5, 0.2])[2] +
    '" onchange="S.bt=[1,(S.bt||[1,.5,.2])[1],+this.value];save()"></div></div>'
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
  !f ? "Tout" : f == "err" ? "Carnet d'erreurs" : f == "due" ? "QCM à revoir" : f[0] == "m" ? M(f.slice(2)).nom : CH(f.slice(2)).titre;
function scope() {
  const k = tab == "qcm" ? "qcm" : "cards",
    cnt = (f) => {
      const o = R.f;
      R.f = f;
      const n = k == "cards" && R.due !== false ? cardsToday(pick(k)).all.length : pick(k).length;
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
      : "") +
    S.mat.map((m) => row("m:" + m.id, ICO(m) + " " + esc(m.nom), m.couleur, m.id)).join("") +
    "</div>"
  );
}
