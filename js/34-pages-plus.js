// ================= Cours (bibliothèque), réglages de session, accueil de l'atlas =================
const plx = (n, a, b) => n + " " + (n > 1 ? b : a);

// ---------- Cours : la bibliothèque ----------
function ueProg(mid, cc) {
  const st = cc.filter((c) => S.jm && S.jm[c.id]).length;
  return '<i class="uep"><b style="width:' + (cc.length ? Math.round((st / cc.length) * 100) : 0) + '%"></b></i>' + st + "/" + cc.length + " commencés";
}
function coursHero() {
  const lc = S.courses.find((x) => x.id === S.lc),
    nl = S.courses.length,
    mins = S.courses.reduce((a, x) => a + (x.pdf && !x.texte ? 10 : Math.max(1, Math.round((x.texte || "").split(/\s+/).length / 200))), 0),
    st = S.chap.filter((c) => S.jm && S.jm[c.id]).length,
    m = lc ? mof(lc) : null,
    ch = lc ? CH(lc.ch) : null;
  return (
    '<div class="lib"><div class="libt"><span class="libk">' + icn("book") + " Ta bibliothèque</span><h1>Cours</h1>" +
    '<div class="libn"><span><b>' + S.chap.length + "</b>chapitres</span><span><b>" + nl + "</b>livrets</span><span><b>" + (mins >= 60 ? Math.round(mins / 60) + " h" : mins + " min") + "</b>de lecture</span><span><b>" + st + "</b>commencés</span></div>" +
    (typeof offBar == "function" ? offBar() : "") +
    "</div>" +
    (lc
      ? '<button class="libb" style="--sc:' + m.couleur + '" onclick="R={id:\'' + lc.id + "'};render();scrollTo(0,0)\">" +
        '<span class="libbc"><small>' + esc(m.nom) + "</small><b>" + esc(lc.titre) + "</b><em>" + esc(ch ? ch.titre : "") + "</em></span>" +
        '<span class="libbt">' + icn("play") + " Reprendre la lecture</span></button>"
      : '<div class="libb libb0"><span class="libbc"><small>MedRevise</small><b>Ouvre un livret pour commencer</b></span></div>') +
    "</div>"
  );
}
function coursShelf() {
  const rec = (S.lcs || [S.lc]).map((id) => S.courses.find((x) => x.id === id)).filter(Boolean).slice(1, 9);
  let D = null;
  try {
    D = S.chap.length ? jPlan(1).days[0] : null;
  } catch (e) {}
  const today = D ? D.rev.concat(D.neu).filter((r) => !r.done).slice(0, 6) : [];
  return (
    (today.length
      ? '<h3 class="libh">À travailler aujourd’hui <small>' + today.length + '</small></h3><div class="libtd">' +
        today
          .map((r) => {
            const c = r.c,
              m = M(c.mid),
              lv = S.courses.find((x) => x.ch === c.id);
            return (
              '<button style="--sc:' + m.couleur + '" onclick="' + (lv ? "R={id:'" + lv.id + "'};render();scrollTo(0,0)" : "openSyn('" + c.id + "')") + '"><small>' + (r.k !== undefined && D.rev.includes(r) ? "Rappel " + jLab(r.k) : "Nouveau · J0") + "</small><b>" + esc(c.titre) + "</b><em>" + esc(m.nom) + "</em></button>"
            );
          })
          .join("") +
        "</div>"
      : "") +
    (rec.length
      ? '<h3 class="libh">Lus récemment</h3><div class="libsh">' +
        rec
          .map((x) => {
            const m = mof(x);
            return '<button class="libsp" style="--sc:' + m.couleur + '" onclick="R={id:\'' + x.id + "'};render();scrollTo(0,0)\"><i>" + ICO(m) + "</i><b>" + esc(x.titre) + "</b><small>" + esc(m.nom) + "</small></button>";
          })
          .join("") +
        "</div>"
      : "")
  );
}

// ---------- Réglages d'une session (QCM et flashcards) ----------
const segc = (a, cur, fn) =>
  '<div class="segc">' + a.map((x) => '<button class="' + (String(cur) === String(x[0]) ? "on" : "") + '" onclick="' + fn + "('" + x[0] + "')\">" + x[1] + "</button>").join("") + "</div>";
const tgl = (on, fn) => '<button class="tgl' + (on ? " on" : "") + '" role="switch" aria-checked="' + !!on + '" onclick="' + fn + "('" + (on ? 0 : 1) + "')\"><i></i></button>";
const crow = (ic, t, ctl, note) => '<div class="xrw' + (ctl.includes("segc") ? " xs" : "") + '"><span class="xrwi">' + icn(ic) + '</span><div class="xrwt"><b>' + t + "</b>" + (note ? "<small>" + note + "</small>" : "") + "</div>" + ctl + "</div>";
function subjTiles(k) {
  const cnt = (f) => {
      const o = R.f;
      R.f = f;
      const n = pick(k).length;
      R.f = o;
      return n;
    },
    cur = R.f || "",
    tile = (f, ic, t, sub, col, n, ue) =>
      '<button class="stl' + (cur === f || (ue && cur.startsWith("c:") && CH(cur.slice(2)).mid === ue) ? " on" : "") + '" style="--sc:' + col + '" onclick="' + (ue ? "R.ue='" + ue + "';" : "R.ue='';") + "sf('" + f + "')\">" +
      '<span class="stli">' + ic + "</span><b>" + t + "</b><small>" + sub + '</small><em>' + n + "</em></button>";
  let h =
    '<div class="stg">' +
    tile("", icn("shuffle"), "Tout mélangé", "Toutes les UE", "var(--ac)", cnt("")) +
    (k == "qcm"
      ? tile("due", icn("clock"), "À revoir", "Répétition espacée", "#e9a23b", cnt("due")) + tile("err", icn("alert"), "Mes erreurs", "Carnet d’erreurs", "#e5484d", cnt("err"))
      : "") +
    (k == "qcm" && typeof atlasQcmCount == "function" && atlasOk() && atlasQcmCount() ? tile("atl", icn("heart"), "Anatomie 3D", "D’après tes atlas", "#2a9d8f", atlasQcmCount()) : "") +
    S.mat.map((m) => tile("m:" + m.id, ICO(m), esc(m.nom), plx(S.chap.filter((c) => c.mid === m.id).length, "chapitre", "chapitres"), m.couleur, cnt("m:" + m.id), m.id)).join("") +
    "</div>";
  const ue = R.ue && S.mat.find((m) => m.id === R.ue);
  if (ue && (cur === "m:" + ue.id || cur.startsWith("c:")))
    h +=
      '<div class="stch" style="--sc:' + ue.couleur + '"><small>Affiner : un chapitre de ' + esc(ue.nom) + "</small><div>" +
      '<button class="' + (cur === "m:" + ue.id ? "on" : "") + '" onclick="sf(\'m:' + ue.id + '\')">Toute l’UE</button>' +
      S.chap
        .filter((c) => c.mid === ue.id)
        .map((c) => '<button class="' + (cur === "c:" + c.id ? "on" : "") + '" onclick="sf(\'c:' + c.id + "')\">" + esc(c.titre) + " <i>" + cnt("c:" + c.id) + "</i></button>")
        .join("") +
      "</div></div>";
  return h;
}
function intro2(k) {
  const q = k == "qcm",
    c = R.f == "atl" && q && typeof atlasQcmCount == "function" ? atlasQcmCount() : pick(k).length,
    ex = R.mode == "exam",
    vf = R.mode == "vf",
    tm = ex ? "t" : R.tm || "n",
    n = R.n ?? 10,
    nn = n ? Math.min(n, c) : c,
    md = q ? { train: "Entraînement", exam: "Examen blanc", vf: "Vrai ou faux" }[R.mode || "train"] : R.due === false ? "Toutes les cartes" : "Cartes à réviser";
  let rows =
    crow(q ? "exam" : "cards", "Nombre de " + (q ? "questions" : "cartes"), segc([[5, "5"], [10, "10"], [20, "20"], [0, "Tout"]], n, "sn"));
  if (q && ANS().length)
    rows += crow("file", "Annales", '<select class="csel" onchange="san(this.value)">' + [["", "Toutes"]].concat(ANS().map((a, i) => [i, esc(a)])).map((x) => '<option value="' + x[0] + '"' + (String(R.an ? ANS().indexOf(R.an) : "") === String(x[0]) ? " selected" : "") + ">" + x[1] + "</option>").join("") + "</select>");
  if (q && !vf) {
    rows +=
      crow("grad", "Notation", segc([[1, "Barème"], [0, "Tout ou rien"]], S.bm === false ? 0 : 1, "sbm"),
        S.bm === false ? "1 point seulement sans aucune faute." : "Barème " + (S.bt || [1, 0.5, 0.2]).map(pf).join(" · ") + " · 0 selon le nombre de fautes.") +
      crow("target", "Niveau de confiance", tgl(R.cf, "scf"), "Indique ta certitude : l’app repère les « faux sûrs ».") +
      (ex ? "" : crow("clock", "Chronomètre", segc([["n", "Aucun"], ["q", "Par question"], ["t", "Total"]], tm, "ct")));
    if (tm == "q") rows += crow("clock", "Temps par question", segc([[15, "15 s"], [30, "30 s"], [45, "45 s"], [60, "60 s"]], R.tv, "sv"));
    if (tm == "t") rows += crow("clock", "Temps total", segc([[5, "5"], [10, "10"], [20, "20"], [30, "30"], [60, "60 min"]], R.tv, "sv"));
  }
  if (q && typeof atlasQcmCount == "function" && atlasOk() && atlasQcmCount())
    rows += crow("heart", "QCM d’anatomie 3D", tgl(S.atqmix !== false, "saqm"), "Environ 1 question sur 5 tirée de tes atlas dans « Tout mélangé ».");
  if (!q)
    rows += crow("clock", "Cartes", segc([["1", "À réviser"], ["0", "Toutes"]], R.due === false ? "0" : "1", "sd"),
      R.due === false ? "Toutes les cartes du sujet, nouvelles ou déjà vues." : "À revoir aujourd’hui + " + (S.ncd ?? 20) + " nouvelles par jour.");
  const note = ex ? "Pas de correction pendant l’épreuve : note /20 et correction à la fin." : vf ? "Chaque proposition est jugée seule. Ces sessions ne comptent pas dans ta courbe de notes." : "";
  return (
    '<h2 class="ti">' + (q ? "QCM" : "Flashcards") + "</h2>" + (R.done || "") +
    '<div class="cfg"><div class="cfgh"><b>1</b><span>Choisis ton sujet</span></div>' + subjTiles(k) +
    '<div class="cfgh"><b>2</b><span>Règle ta session</span></div><div class="cgrp">' + rows + "</div>" + (note ? '<p class="cnote">' + note + "</p>" : "") +
    '<div class="cgo"><div><small>' + esc(md) + "</small><b>" + plx(nn, q ? "question" : "carte", q ? "questions" : "cartes") + " · " + esc(R.f ? lab(R.f) : "Tout mélangé") + "</b></div>" +
    '<button class="big" ' + (c ? "" : "disabled ") + "onclick=\"start('" + k + "')\">" + icn("play") + " C’est parti</button></div></div>"
  );
}

// ---------- Atlas : l'accueil ----------
function atlasHero() {
  const rec = atlasLS("mr_atlas_rec", []).map((id) => ATL.models.find((m) => m.id == id)).filter(Boolean),
    last = rec[0],
    feat = last || ATL.models.find((m) => m.id == "coeur") || ATL.models[0],
    np = typeof ATL_PMODS == "object" ? Object.keys(ATL_PMODS).length : 0,
    nm = ATL.models.length;
  setTimeout(atlasDay, 0);
  return (
    '<div class="ath"><div class="atht"><span class="athk">Laboratoire d’anatomie</span><h1>Atlas 3D</h1>' +
    "<p>Tourne, écarte, coupe et interroge chaque structure, comme si tu l’avais devant toi.</p>" +
    '<div class="athn"><span><b>' + nm + "</b>atlas</span>" + (np ? "<span><b>" + np + "</b>pathologies</span>" : "") + '<span><b id="athns">…</b>structures</span></div>' +
    '<div class="atgs"><input id="atgsq" type="search" placeholder="Chercher une structure (nerf médian, mitrale…)" oninput="atlasSearchAll(this.value)" autocomplete="off"><div id="atgsr" hidden></div></div>' +
    "</div>" +
    (feat
      ? '<button class="athv" onclick="atlasGo(\'' + feat.id + "')\"><span class=\"athr\"><i></i><i></i><span class=\"athim\">" + atlasThumb(feat.id) + "</span></span>" +
        "<small>" + (last ? "Continuer" : "Commencer par") + "</small><b>" + esc(feat.titre) + "</b></button>"
      : "") +
    '<div class="athd" id="athday"></div></div>'
  );
}
async function atlasDay() {
  if (!ATL.noms) {
    try {
      ATL.noms = await (await fetch("vendor/atlas-noms.json")).json();
    } catch (e) {
      ATL.noms = {};
    }
  }
  const box = $("athday"),
    ns = $("athns");
  const ids = ATL.models.map((m) => m.id).filter((id) => (ATL.noms[id] || []).length);
  if (ns) ns.textContent = new Set(ids.flatMap((id) => ATL.noms[id])).size.toLocaleString("fr-FR");
  if (!box || !ids.length) return;
  let h = 0;
  for (const ch of day()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const id = ids[h % ids.length],
    l = ATL.noms[id].filter((t) => t.length > 6 && t.length < 40),
    t = l[(h >>> 7) % Math.max(1, l.length)] || ATL.noms[id][0],
    m = ATL.models.find((x) => x.id == id);
  box.innerHTML =
    '<small>' + icn("star") + " Structure du jour</small><b>" + esc(t) + "</b><span>Atlas " + esc(m.titre) + "</span>" +
    '<button class="b" onclick="atlasGo(\'' + id + "'," + JSON.stringify(t).replace(/"/g, "&quot;") + ')">La voir en 3D →</button>';
}
