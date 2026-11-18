let SEL = "";
function mkCard(ch) {
  const sel = (SEL || "").trim().slice(0, 400),
    d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>Nouvelle flashcard</h3><label class="f">Recto (question)</label><textarea id="nr"></textarea><label class="f">Verso (réponse)</label><textarea id="nv">' +
    esc(sel) +
    '</textarea><p id="em" class="m" role="status">' +
    (sel
      ? "Le passage sélectionné a été repris en réponse."
      : "Astuce : sélectionne un passage du texte avant de cliquer, il sera repris ici.") +
    '</p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Créer</button></div></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("nr").focus();
  $("my").onclick = () => {
    const r = $("nr").value.trim(),
      w = $("nv").value.trim();
    if (!r || !w) return ($("em").textContent = "Recto et verso requis.");
    S.cards.push({
      id: uid(),
      ch,
      recto: r,
      verso: w,
      img: "",
      src:
        tab === "cours" && R.id && (S.courses.find((x) => x.id === R.id) || {}).pdf
          ? { c: R.id, p: (S.pp || {})[R.id] || 1 }
          : null,
    });
    save();
    d.remove();
  };
}
const dlab = (d) =>
  new Date(d + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
// ================= Objectifs du jour =================
// Trois objectifs au plus, tirés du planning du jour, dans cet ordre de priorité :
// rappels de la méthode des J, nouveaux chapitres, cartes du jour, QCM, erreurs.
const OBJ = {
  j: {
    l: (n) => "Faire " + (n > 1 ? "tes " + n + " rappels" : "ton rappel") + " du jour (méthode des J)",
    n: () => jPlan(1).days[0].rev.length,
    v: () => S.chap.filter((c) => S.jm[c.id] && (S.jm[c.id].h || []).includes(day())).length,
    go: "jump('jj')",
  },
  s: {
    l: (n) => "Commencer " + (n > 1 ? n + " nouveaux chapitres" : "un nouveau chapitre"),
    n: () => jPlan(1).days[0].neu.length,
    v: () => S.chap.filter((c) => S.jm[c.id] && S.jm[c.id].j0 === day()).length,
    go: "jump('jj')",
  },
  c: {
    l: (n) => "Réviser tes " + n + " flashcard" + (n > 1 ? "s" : "") + " du jour",
    n: () => Math.min(80, cardsToday().all.length),
    v: (d) => d.c,
    go: "go('cards')",
  },
  q: {
    l: (n) => "Répondre à " + n + " QCM",
    n: () => (S.qcm.length ? S.goal || 20 : 0),
    v: (d) => d.q,
    go: "go('qcm')",
  },
  e: {
    l: (n) => "Corriger " + n + " erreur" + (n > 1 ? "s" : "") + " de ton carnet",
    n: () => Math.min(5, S.err.length),
    v: (d) => d.e,
    go: "errGo()",
  },
};
function dd() {
  if (
    !S.dd ||
    S.dd.d !== day() ||
    !S.dd.o ||
    S.dd.v !== 2 ||
    (!S.dd.o.length && S.qcm.length + S.cards.length + S.courses.length > 0)
  ) {
    const keep = S.dd && S.dd.d === day() ? S.dd : {};
    S.dd = {
      v: 2,
      d: day(),
      o: [],
      q: keep.q || 0,
      c: keep.c || 0,
      e: keep.e || 0,
      jd: keep.jd || 0,
      ns: keep.ns || 0,
      nw: keep.nw || 0,
      read: keep.read || 0,
      st: 0,
      cur: 0,
      w: keep.w || {},
    };
    S.dd.o = ["j", "s", "c", "q", "e"]
      .map((k) => [k, OBJ[k].n()])
      .filter((x) => x[1] > 0)
      .slice(0, 3);
    save();
  }
  return S.dd;
}
function bump(k, v) {
  const d = dd();
  d[k] = v === undefined ? (d[k] || 0) + 1 : Math.max(d[k] || 0, v);
  if (d.o.length && d.o.every(([t, n]) => OBJ[t].v(d) >= n) && !S.days.includes(day())) {
    S.days.push(day());
    d.cel = 1;
    gelEarn();
  }
}

// ================= Méthode des J et planning =================
// Chaque chapitre commencé a S.jm[id] = {j0, k, next, last, h}. k = numéro du prochain rappel.
// Les écarts entre rappels (S.js, par défaut J1, J3, J7, J14, J30, puis tous les 30 jours) sont
// ajustés selon ta réussite au chapitre. Le planning répartit les rappels et les nouveaux chapitres
// selon ton temps disponible par jour, et reporte ce qui dépasse.
const JS = () => (S.js && S.js.length ? S.js : [1, 3, 7, 14, 30]),
  jGap = (k) => {
    const a = JS();
    return k < a.length ? a[k] - (k ? a[k - 1] : 0) : 30;
  },
  jLab = (k) => {
    const a = JS();
    return k < a.length ? "J" + a[k] : "J+" + (a[a.length - 1] + 30 * (k - a.length + 1));
  };
const addD = (d, n) => {
    const x = new Date(d + "T12:00");
    x.setDate(x.getDate() + n);
    return x.toLocaleDateString("sv");
  },
  // l'année n'est affichée que si ce n'est pas l'année en cours
  dShort = (d) =>
    new Date(d + "T12:00").toLocaleDateString("fr-FR", d.slice(0, 4) === day().slice(0, 4) ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
// Réglages du planning (minutes).
const PL = () => ({
  cap: S.pcap ?? 180, // temps de travail par jour
  tr: S.ptr ?? 20, // durée d'un rappel
  tn: S.ptn ?? 60, // durée d'un nouveau chapitre (J0)
  buf: S.pbuf ?? 14, // jours avant le concours sans nouveau chapitre
  nd: S.pnd ?? 1, // nouveaux chapitres par jour quand il n'y a pas de date de concours
});
// Réussite du chapitre (null si moins de 5 réponses).
const chRate = (ch) => {
  const t = S.cs[ch];
  return t && t.n >= 5 ? t.ok / t.n : null;
};
// Écart adapté : plus court si le chapitre est fragile, plus long s'il est bien maîtrisé.
function jGapA(ch, k) {
  const p = chRate(ch),
    f = p === null ? 1 : p >= 0.85 ? 1.3 : p < 0.6 ? 0.6 : 1;
  return Math.max(1, Math.round(jGap(k) * f));
}
function setJs(t) {
  const a = [
    ...new Set(
      t
        .split(/[^0-9]+/)
        .map(Number)
        .filter((n) => n > 0),
    ),
  ].sort((x, y) => x - y);
  if (a.length) {
    S.js = a;
    save();
  }
  render();
}
// Démarre un chapitre (J0). Avec une date passée (« déjà vu en cours le… »), le prochain rappel
// est celui qui correspond au temps écoulé, à faire tout de suite.
function jStart(ch, date) {
  if (S.jm[ch] || !S.chap.some((c) => c.id === ch)) return;
  const j0 = date && date < day() ? date : day(),
    el = dBetween(j0, day()),
    a = JS();
  let k = 0,
    next = addD(j0, jGapA(ch, 0));
  if (el >= a[0]) {
    while (k + 1 < a.length && a[k + 1] <= el) k++;
    next = day();
  }
  S.jx = (S.jx || []).filter((x) => x !== ch);
  S.jm[ch] = { j0, k, next, h: [] };
  if (j0 === day()) bump("ns");
  save();
}
function jDone(ch) {
  const j = S.jm[ch];
  if (!j || j.next > day() || (j.h || []).includes(day())) return;
  j.k++;
  j.last = day();
  j.h = (j.h || []).concat(day()).slice(-30);
  j.next = addD(day(), jGapA(ch, j.k));
  bump("jd");
  save();
}
// Preuve de travail sur un chapitre aujourd'hui : un rappel ne se valide que si le travail a été fait.
// - chapitre avec QCM ou cartes : au moins 5 réponses du chapitre aujourd'hui (ou toutes s'il y en a moins) ;
// - chapitre avec seulement un livret : un temps de lecture minimum (S.jrl minutes, 10 par défaut) ;
// - chapitre sans rien à travailler : validation manuelle.
function jProof(ch) {
  const d = dd(),
    nq = S.qcm.filter((x) => x.ch === ch).length,
    nc = S.cards.filter((x) => x.ch === ch).length,
    lv = S.courses.some((x) => x.ch === ch),
    rt = ((d.rt || {})[ch] || 0) / 60,
    ans = (d.w || {})[ch] || 0,
    need = Math.min(5, nq + nc),
    rl = S.jrl ?? 10;
  if (nq + nc) return { kind: "q", ans, need, ok: ans >= need, txt: Math.min(ans, need) + "/" + need + " réponses aujourd’hui" };
  if (lv) return { kind: "r", ok: rt >= rl, txt: Math.min(rl, Math.floor(rt)) + "/" + rl + " min de lecture aujourd’hui" };
  return { kind: "m", ok: false, txt: "rien à vérifier : valide à la main" };
}
function jWork(ch) {
  const d = dd();
  d.w = d.w || {};
  d.w[ch] = (d.w[ch] || 0) + 1;
  const j = S.jm[ch];
  if (!j) return jStart(ch);
  if (j.next <= day() && jProof(ch).ok) jDone(ch);
}
// Appelé toutes les 15 s pendant la lecture d'un livret.
function jRead(ch) {
  const d = dd();
  d.rt = d.rt || {};
  d.rt[ch] = (d.rt[ch] || 0) + 15;
  const j = S.jm[ch];
  if (j && j.next <= day() && jProof(ch).ok) {
    jDone(ch);
    if (tab === "home") render();
  }
}
// Lance le travail du rappel : QCM du chapitre, sinon ses cartes, sinon son livret.
function jGo(ch) {
  const q = S.qcm.filter((x) => x.ch === ch),
    c = S.cards.filter((x) => x.ch === ch),
    lv = S.courses.find((x) => x.ch === ch);
  if (q.length) {
    go("qcm");
    start("qcm", shuf(q).slice(0, 10), { mode: "train" });
  } else if (c.length) {
    go("cards");
    start("cards", shuf(c).slice(0, 20));
  } else if (lv) {
    go("cours");
    R = { id: lv.id };
    render();
  }
}
const jDue = () =>
  S.chap
    .filter((c) => S.jm[c.id] && S.jm[c.id].next <= day())
    .sort((a, b) => (S.jm[a.id].next < S.jm[b.id].next ? -1 : 1));
// Chapitres pas encore commencés et au programme, dans l'ordre d'apprentissage choisi.
function jOrder() {
  // Ordre par défaut : les UE avancent en parallèle (chapitre 1 de chaque UE, puis chapitre 2…),
  // et dans une UE les chapitres suivent leur numéro.
  const o = S.jo || [],
    num = (c) => {
      const n = +((String(c.titre).match(/chap(?:itre)?\.?\s*0*(\d+)/i) || [])[1] || NaN);
      return isNaN(n) ? 1e4 + S.chap.indexOf(c) : n;
    },
    rk = {};
  S.mat.forEach((m) =>
    S.chap
      .filter((c) => c.mid === m.id)
      .sort((a, b) => num(a) - num(b))
      .forEach((c, i) => (rk[c.id] = i)),
  );
  const ix = (c) => {
    const i = o.indexOf(c.id);
    return i < 0 ? 1e6 + (rk[c.id] ?? 999) * 100 + Math.max(0, S.mat.findIndex((m) => m.id === c.mid)) : i;
  };
  return S.chap.filter((c) => !S.jm[c.id] && !(S.jx || []).includes(c.id)).sort((a, b) => ix(a) - ix(b));
}
function jMove(id, k) {
  const o = jOrder().map((c) => c.id),
    i = o.indexOf(id);
  if (i < 0 || i + k < 0 || i + k >= o.length) return;
  [o[i], o[i + k]] = [o[i + k], o[i]];
  S.jo = o;
  save();
  render();
}
const jOut = (id) => {
    S.jx = (S.jx || []).concat(id);
    save();
    render();
  },
  jIn = (id) => {
    S.jx = (S.jx || []).filter((x) => x !== id);
    save();
    render();
  },
  jReset = (id) =>
    ask(
      "Remettre ce chapitre à « pas commencé » ? Ses rappels de la méthode des J seront effacés.",
      () => {
        delete S.jm[id];
        save();
        render();
      },
      "Remettre à zéro",
    );
// Simule les N prochains jours : place les rappels (les plus urgents d'abord) et les nouveaux chapitres
// dans la limite du temps disponible, et reporte le reste au lendemain.
// Date du concours d'une UE : la sienne si elle en a une, sinon la date générale.
const ueExam = (mid) => {
  const m = M(mid),
    e = (m && m.exam) || S.exam;
  return e && e > day() ? e : null;
};
// Simule les N prochains jours : place les rappels (les plus urgents d'abord) et les nouveaux chapitres
// dans la limite du temps disponible, et reporte le reste au lendemain. Les chapitres sont regroupés par
// date de concours (une par UE possible) : chaque groupe a son propre rythme pour être fini à temps.
function jPlan(N) {
  N = N || 14;
  const P = PL(),
    td = day(),
    days = [...Array(N)].map((_, i) => ({ d: day(i), rev: [], neu: [], min: 0 })),
    st = S.chap
      .filter((c) => S.jm[c.id])
      .map((c) => ({ c, k: S.jm[c.id].k, next: S.jm[c.id].next, nom: S.jm[c.id].next })),
    queue = jOrder(),
    gm = {};
  queue.forEach((c) => {
    const e = ueExam(c.mid) || "";
    (gm[e] = gm[e] || { ex: e || null, q: [] }).q.push(c);
  });
  const G = Object.values(gm).sort((a, b) => (a.ex || "9") < (b.ex || "9") ? -1 : 1);
  G.forEach((g) => {
    g.dl = g.ex ? dBetween(td, g.ex) - P.buf : null;
    g.rate = g.ex ? (g.dl > 0 ? g.q.length / g.dl : 0) : P.nd;
    g.qi = 0;
  });
  const rate = G.reduce((a, g) => a + g.rate, 0);
  // ce qui est déjà fait aujourd'hui compte dans la journée
  S.chap.forEach((c) => {
    const j = S.jm[c.id];
    if (!j) return;
    if ((j.h || []).includes(td)) {
      days[0].rev.push({ c, k: j.k - 1, done: 1, late: 0 });
      days[0].min += P.tr;
    }
    if (j.j0 === td) {
      days[0].neu.push({ c, done: 1 });
      days[0].min += P.tn;
    }
  });
  // s’il reste des chapitres, le premier groupe commence dès aujourd’hui
  let done0 = days[0].neu.length,
    pn = 0;
  G.forEach((g, i) => {
    const r0 = g.rate > 0 ? (i ? g.rate : Math.max(1, g.rate)) : 0,
      take = Math.min(done0, r0);
    g.credit = r0 - take;
    done0 -= take;
  });
  for (let i = 0; i < N; i++) {
    const D = days[i],
      cand = st
        .filter((x) => x.next <= D.d)
        .sort(
          (a, b) =>
            a.k - b.k || (a.next < b.next ? -1 : a.next > b.next ? 1 : 0) || (chRate(a.c.id) ?? 1) - (chRate(b.c.id) ?? 1),
        );
    for (const x of cand) {
      // place un rappel s'il reste du temps ; au moins un par jour s'il reste un peu de temps
      if (!(D.min + P.tr <= P.cap || (!D.rev.some((r) => !r.done) && D.min < P.cap))) break;
      D.rev.push({ c: x.c, k: x.k, late: Math.max(0, dBetween(x.nom, D.d)) });
      D.min += P.tr;
      x.k++;
      x.next = x.nom = addD(D.d, jGapA(x.c.id, x.k));
    }
    if (i) G.forEach((g) => (g.credit += g.rate));
    for (;;) {
      if (!(D.min + P.tn <= P.cap || !D.min)) break;
      // le groupe le plus en retard sur son rythme passe en premier (à égalité : le concours le plus proche)
      const g = G.filter((g) => g.credit >= 1 - 1e-9 && g.qi < g.q.length).sort((a, b) => b.credit - a.credit)[0];
      if (!g) break;
      const c = g.q[g.qi++];
      D.neu.push({ c });
      D.min += P.tn;
      g.credit -= 1;
      pn++;
      st.push({ c, k: 0, next: addD(D.d, jGapA(c.id, 0)), nom: addD(D.d, jGapA(c.id, 0)) });
    }
  }
  const back = st.filter((x) => x.next <= days[N - 1].d).length;
  // short : le temps disponible ne suffit pas pour tenir le rythme
  const short = rate > 0 && queue.length > pn && pn < Math.min(queue.length, rate * N) * 0.85 - 0.5,
    dl = G.length ? Math.max(...G.map((g) => g.dl ?? -1)) : null;
  return { days, rate, left: queue.length, dl, back, cap: P.cap, pn, short, groups: G };
}
// Date prévue de la première étude (J0) de chaque chapitre pas encore commencé : on prolonge la
// simulation jusqu'au concours (ou jusqu'à ce que tous les chapitres soient placés, 1 an maximum).
function jStarts() {
  const P = PL(),
    q = jOrder(),
    exs = q.map((c) => ueExam(c.mid)),
    ex = exs.every(Boolean) ? exs.sort()[exs.length - 1] : null;
  if (!q.length) return { at: {}, last: null, miss: 0, ex };
  const N = ex ? Math.min(1100, dBetween(day(), ex) + 1) : Math.min(1100, Math.ceil(q.length / Math.max(0.1, P.nd)) + 21),
    p = jPlan(N),
    at = {};
  p.days.forEach((d) => d.neu.forEach((r) => !r.done && !at[r.c.id] && (at[r.c.id] = d.d)));
  const ds = Object.values(at).sort();
  return { at, last: ds.length ? ds[ds.length - 1] : null, miss: q.filter((c) => !at[c.id]).length, ex };
}
const fmtM = (m) => (m >= 60 ? Math.floor(m / 60) + " h" + (m % 60 ? " " + String(m % 60).padStart(2, "0") : "") : m + " min");
function jBadge(ch) {
  const j = S.jm[ch];
  return j
    ? '<span class="tag"' +
        (j.next <= day() ? ' style="background:var(--wnb);color:var(--wn)"' : "") +
        ">" +
        jLab(j.k) +
        (j.next <= day() ? " à faire" : " le " + dShort(j.next)) +
        "</span>"
    : (S.jx || []).includes(ch)
      ? '<span class="tag">hors programme</span>'
      : "";
}
function jManual(ch) {
  if (jProof(ch).kind !== "m") return; // seulement pour un chapitre sans QCM, cartes ni livret
  jDone(ch);
  render();
}
function jNew(ch) {
  jStart(ch);
  const lv = S.courses.find((x) => x.ch === ch);
  if (lv) {
    go("cours");
    R = { id: lv.id };
  }
  render();
}
// Ligne d'une tâche du planning (rappel ou nouveau chapitre).
function jRow(c, sub, kind, done, ro) {
  const lv = S.courses.find((x) => x.ch === c.id),
    m = M(c.mid);
  return (
    '<div class="jr' +
    (done ? " dn" : "") +
    (ro ? " ro" : "") +
    '" style="--sc:' +
    m.couleur +
    '">' +
    (ro ? "" : '<span class="ck">' + (done ? "✓" : "") + "</span>") +
    '<div style="flex:1;min-width:150px"><b>' +
    esc(c.titre) +
    "</b><br><small>" +
    esc(m.nom) +
    " · " +
    sub +
    "</small>" +
    (kind == "rev" && !done && !ro
      ? (() => {
          const pf = jProof(c.id);
          return (
            '<div class="jpf"><span class="bar"><i style="width:' +
            (pf.kind == "q" ? Math.min(100, (pf.ans / Math.max(1, pf.need)) * 100) : pf.kind == "r" ? Math.min(100, ((((dd().rt || {})[c.id] || 0) / 60) / (S.jrl ?? 10)) * 100) : 0) +
            '%"></i></span><small>' +
            pf.txt +
            "</small></div>"
          );
        })()
      : "") +
    "</div>" +
    (done || ro
      ? ""
      : '<div class="r" style="margin:0">' +
        (kind == "neu"
          ? '<button class="b p" onclick="jNew(\'' + c.id + "')\">" + (lv ? "Commencer" : "Marquer commencé") + "</button>"
          : (() => {
              const pf = jProof(c.id);
              return (
                (lv ? "<button class=\"b\" onclick=\"go('cours');R={id:'" + lv.id + "'};render()\">Livret</button>" : "") +
                (pf.kind == "m"
                  ? '<button class="b p" onclick="jManual(\'' + c.id + "')\">✓ Marquer fait</button>"
                  : '<button class="b p" onclick="jGo(\'' + c.id + "')\">Faire le rappel</button>")
              );
            })()) +
        "</div>") +
    "</div>"
  );
}
// Bloc « Au programme aujourd'hui » de l'accueil.
function jToday() {
  if (!S.chap.length) return "";
  const p = jPlan(14),
    D = p.days[0],
    tot = D.rev.length + D.neu.length;
  return (
    '<div id="jj">' +
    (tot
      ? D.rev
          .map((r) =>
            jRow(
              r.c,
              "rappel " + jLab(r.k) + (r.late > 0 ? " · reporté de " + r.late + " j" : ""),
              "rev",
              r.done,
            ),
          )
          .join("") + D.neu.map((r) => jRow(r.c, "nouveau chapitre (J0)", "neu", r.done)).join("")
      : '<p class="m" style="margin:4px 0">Aucun chapitre au programme aujourd’hui.</p>') +
    (p.back
      ? '<p class="wnl">' +
        icn("alert") +
        " " +
        p.back +
        " rappel" +
        (p.back > 1 ? "s" : "") +
        " ne tiennent pas dans les 14 prochains jours. Augmente ton temps de travail dans le planning ou retire des chapitres du programme.</p>"
      : "") +
    "</div>"
  );
}
// Bandeau des 7 prochains jours (accueil).
function jWeek() {
  const p = jPlan(7),
    mx = Math.max(p.cap, ...p.days.map((d) => d.min));
  return (
    '<div class="wk7">' +
    p.days
      .map(
        (D, i) =>
          '<button class="wd' +
          (i ? "" : " on") +
          '" onclick="go(\'plan\');R.pd=' +
          i +
          ';render()" aria-label="' +
          esc(dlab(D.d)) +
          " : " +
          D.rev.length +
          " rappels, " +
          D.neu.length +
          ' nouveaux chapitres"><small>' +
          (i ? new Date(D.d + "T12:00").toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "") : "auj.") +
          '</small><span class="wb"><i style="height:' +
          Math.min(100, (D.min / mx) * 100) +
          '%"></i></span><b>' +
          (D.rev.length + D.neu.length || "–") +
          "</b></button>",
      )
      .join("") +
    "</div>"
  );
}
// Page Planning : un résumé, puis quatre onglets (jours, en cours, à commencer, hors programme).
const PV = (v) => {
    R.pv = v;
    render();
  },
  PDay = (i) => {
    R.pd = i;
    render();
  };
let PUE = "";
function ueSetExam(id, v) {
  const m = M(id);
  if (!m) return;
  if (v) m.exam = v;
  else delete m.exam;
  save();
  render();
}
function plan() {
  const P = PL(),
    p = jPlan(28),
    ex = S.exam && S.exam > day() ? S.exam : null,
    started = S.chap.filter((c) => S.jm[c.id]),
    q = jOrder(),
    out = S.chap.filter((c) => !S.jm[c.id] && (S.jx || []).includes(c.id)),
    v = R.pv || "jours",
    pd = Math.min(27, R.pd || 0),
    wk = Math.floor(pd / 7),
    fr = (x) => String(+x.toFixed(1)).replace(".", ","),
    ueChips = (l) => {
      const ues = S.mat.filter((m) => l.some((c) => c.mid === m.id));
      return ues.length > 1
        ? '<div class="chips">' +
            [["", "Toutes"]]
              .concat(ues.map((m) => [m.id, esc(m.nom)]))
              .map((x) => '<button class="chip' + (PUE === x[0] ? " on" : "") + '" onclick="PUE=\'' + x[0] + "';render()\">" + x[1] + "</button>")
              .join("") +
            "</div>"
        : "";
    },
    fu = (l) => (PUE ? l.filter((c) => c.mid === PUE) : l);
  const js0 = q.length ? jStarts() : null,
    dY = (d) => new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    gLast = (g) =>
      js0 &&
      g.q
        .map((c) => js0.at[c.id])
        .filter(Boolean)
        .sort()
        .pop(),
    gLine = (g) => {
      const n = g.q.length,
        ues = S.mat.filter((m) => g.q.some((c) => c.mid === m.id)).map((m) => esc(m.nom)).join(", "),
        lst = gLast(g),
        miss = js0 ? g.q.filter((c) => !js0.at[c.id]).length : 0,
        chs = "<b>" + n + "</b> chapitre" + (n > 1 ? "s" : "");
      if (!g.ex) return (ues ? "<b>" + ues + "</b> : " : "") + chs + " à commencer, au rythme de " + fr(P.nd) + " par jour (pas de date de concours).";
      if (g.dl <= 0) return "<b>" + ues + "</b> : dans la marge de révision avant le concours du " + dY(g.ex) + ", plus de nouveaux chapitres.";
      return (
        "<b>" + ues + "</b> : " + chs + " d’ici le concours du " + dY(g.ex) + ", environ <b>" + fr(g.rate * 7) + " par semaine</b>" +
        (miss
          ? ' <span class="wn">· ' + miss + " sans place</span>"
          : lst
            ? " · tout commencé le " + dY(lst) + " (" + dBetween(lst, g.ex) + " jours avant)"
            : "") +
        "."
      );
    };
  let rythme;
  if (!S.chap.length) rythme = "Ajoute tes UE et tes chapitres pour construire ton planning.";
  else if (!q.length) rythme = "Tous tes chapitres sont commencés : il ne reste que les rappels.";
  else rythme = p.groups.map(gLine).join("<br>");
  if (S.chap.length && !p.groups.some((g) => g.ex)) rythme += '<br><small class="m">Indique la date de ton concours (ci-dessous ou dans les réglages) pour que le rythme s’adapte tout seul.</small>';
  const fin = !js0
    ? ""
    : js0.miss
      ? '<p class="wnl">' + icn("alert") + " " + js0.miss + " chapitre" + (js0.miss > 1 ? "s" : "") + " ne trouve" + (js0.miss > 1 ? "nt" : "") + " pas de place avant la marge de révision. Augmente ton temps de travail par jour ou réduis la marge avant le concours.</p>"
      : ' <p style="margin:.4em 0 0"><a href="#" onclick="PV(\'todo\');return false">' + icn("cal") + " Voir la date de chaque chapitre</a></p>";
  // date de concours par UE (S1, S2…)
  const ueDates =
    S.mat.length > 0
      ? '<details class="c ued"' + (R.ued ? " open" : "") + ' ontoggle="R.ued=this.open"><summary><b>' + icn("cal") + " Dates de concours par UE</b> <small class=\"m\">si tes UE n’ont pas toutes le même concours (S1, S2…)</small></summary>" +
        '<div class="uedl">' +
        S.mat
          .map(
            (m) =>
              '<label class="pc" style="--sc:' + m.couleur + '"><span style="flex:1"><b>' + esc(m.nom) + "</b><br><small class=\"m\">" + (m.exam ? "date propre à l’UE" : S.exam ? "date générale" : "aucune date") + '</small></span><input type="date" min="' + day() + '" value="' + (m.exam || "") + '" onchange="ueSetExam(\'' + m.id + "',this.value)\"></label>",
          )
          .join("") +
        '</div><small class="m">Laisse vide pour utiliser la date générale' + (S.exam ? " (" + dY(S.exam) + ")" : "") + ".</small></details>"
      : "";
  const head =
    '<h2 class="ti">' +
    icn("cal") +
    " Planning " +
    helpBtn("plan") +
    '</h2><div class="c"><p style="margin:0">' +
    rythme +
    '</p><p class="m" style="margin:.4em 0 0">' +
    fmtM(P.cap) +
    " de travail par jour · rappels de " +
    fmtM(P.tr) +
    " · nouveaux chapitres de " +
    fmtM(P.tn) +
    "</p>" +
    fin +
    (p.back ? '<p class="wnl">' + icn("alert") + " Surcharge : " + p.back + " rappels ne tiennent pas dans les 4 prochaines semaines.</p>" : "") +
    '<div class="r"><button class="b" onclick="profGo(\'reg\');setTimeout(()=>jump(\'rg_plan\'),80)">' +
    icn("gear") +
    " Réglages du planning</button></div></div>" +
    ueDates +
    '<div class="seg">' +
    [
      ["jours", "Jours"],
      ["cours", "En cours (" + started.length + ")"],
      ["todo", "À commencer (" + q.length + ")"],
    ]
      .concat(out.length ? [["hors", "Hors programme (" + out.length + ")"]] : [])
      .map((x) => '<button class="' + (v == x[0] ? "on" : "") + '" onclick="PV(\'' + x[0] + "')\">" + x[1] + "</button>")
      .join("") +
    "</div>";
  let body = "";
  if (v == "jours") {
    const days = p.days.slice(wk * 7, wk * 7 + 7),
      D = p.days[pd],
      mx = Math.max(P.cap, ...days.map((d) => d.min)),
      wl = ["Ces 7 jours", "Semaine suivante", "Dans 2 semaines", "Dans 3 semaines"][wk];
    body =
      '<div class="wnav"><button class="b" ' +
      (wk ? "" : "disabled ") +
      'onclick="PDay(' +
      (wk - 1) * 7 +
      ')" aria-label="Semaine précédente">‹</button><b>' +
      wl +
      '</b><button class="b" ' +
      (wk < 3 ? "" : "disabled ") +
      'onclick="PDay(' +
      (wk + 1) * 7 +
      ')" aria-label="Semaine suivante">›</button></div><div class="wk7 wkl">' +
      days
        .map((d, j) => {
          const i = wk * 7 + j,
            dt = new Date(d.d + "T12:00"),
            n = d.rev.length + d.neu.length;
          return (
            '<button class="wd' +
            (i == pd ? " on" : "") +
            (d.min > P.cap ? " over" : "") +
            '" onclick="PDay(' +
            i +
            ')"><small>' +
            (i ? dt.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "") : "auj.") +
            "</small><b>" +
            dt.getDate() +
            '</b><span class="wb"><i style="height:' +
            Math.min(100, (d.min / mx) * 100) +
            '%"></i></span><small>' +
            (n || "–") +
            "</small></button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="c"><div class="r" style="margin:0 0 6px;align-items:center"><b class="cap" style="flex:1">' +
      (pd ? dlab(D.d) : "Aujourd’hui") +
      "</b><small>≈ " +
      fmtM(D.min) +
      " sur " +
      fmtM(P.cap) +
      '</small></div><span class="bar" style="--sc:' +
      (D.min > P.cap ? "var(--ko)" : "var(--ac)") +
      '"><i style="width:' +
      Math.min(100, (D.min / Math.max(1, P.cap)) * 100) +
      '%"></i></span>' +
      (D.rev.length
        ? '<div class="lb">Rappels (' + D.rev.length + ")</div>" +
          D.rev.map((r) => jRow(r.c, "rappel " + jLab(r.k) + (r.late > 0 ? " · reporté de " + r.late + " j" : ""), "rev", r.done, pd > 0)).join("")
        : "") +
      (D.neu.length
        ? '<div class="lb">Nouveaux chapitres (' + D.neu.length + ")</div>" + D.neu.map((r) => jRow(r.c, "première étude (J0)", "neu", r.done, pd > 0)).join("")
        : "") +
      (D.rev.length + D.neu.length ? "" : '<p class="m">Rien de prévu ce jour-là.</p>') +
      "</div>";
  } else if (v == "cours") {
    const l = fu(started.slice().sort((a, b) => (S.jm[a.id].next < S.jm[b.id].next ? -1 : 1)));
    body =
      ueChips(started) +
      (l.length
        ? '<div class="c">' +
          l
            .map((c) => {
              const j = S.jm[c.id],
                pr = chRate(c.id),
                tot = JS().length;
              return (
                '<div class="pc" style="--sc:' +
                M(c.mid).couleur +
                '"><div style="flex:1;min-width:150px"><b>' +
                esc(c.titre) +
                "</b><br><small>" +
                esc(M(c.mid).nom) +
                " · J0 le " +
                dShort(j.j0) +
                (pr === null ? "" : " · " + Math.round(pr * 100) + " % de réussite") +
                '</small><div class="jpf"><span class="bar"><i style="width:' +
                Math.min(100, (j.k / tot) * 100) +
                '%"></i></span><small>' +
                Math.min(j.k, tot) +
                "/" +
                tot +
                " rappels faits</small></div></div>" +
                jBadge(c.id) +
                "<button class=\"b sm\" onclick=\"jReset('" +
                c.id +
                "')\" title=\"Remettre à zéro\">↺</button></div>"
              );
            })
            .join("") +
          "</div>"
        : '<p class="m">Aucun chapitre commencé' + (PUE ? " dans cette UE" : "") + ". Un chapitre démarre quand tu ouvres son livret ou réponds à ses questions.</p>");
  } else if (v == "todo") {
    const l = fu(q);
    body =
      '<p class="m" style="margin-top:0">Le planning les propose dans cet ordre, avec la date prévue pour commencer chacun. Change l’ordre avec les flèches. Si tu as déjà vu un chapitre en cours, indique la date : ses rappels reprennent à partir de là.</p>' +
      ueChips(q) +
      (l.length
        ? '<div class="c">' +
          l
            .map((c) => {
              const i = q.indexOf(c);
              return (
                '<div class="pc" style="--sc:' +
                M(c.mid).couleur +
                '"><span class="pno">' +
                (i + 1) +
                '</span><div style="flex:1;min-width:130px"><b>' +
                esc(c.titre) +
                "</b><br><small>" +
                esc(M(c.mid).nom) +
                "</small>" +
                (js0 && js0.at[c.id]
                  ? '<br><span class="tag pstd">' + (js0.at[c.id] === day() ? "à commencer aujourd’hui" : "à commencer le " + dShort(js0.at[c.id])) + "</span>"
                  : '<br><span class="tag pstd" style="background:var(--wnb);color:var(--wn)">pas de place avant le concours</span>') +
                '</div><label class="dv"><small>Déjà vu le</small><input type="date" max="' +
                day() +
                '" onchange="if(this.value){jStart(\'' +
                c.id +
                "',this.value);render()}\"></label><button class=\"b sm\" aria-label=\"Monter\" " +
                (i ? "" : "disabled ") +
                "onclick=\"jMove('" +
                c.id +
                "',-1)\">↑</button><button class=\"b sm\" aria-label=\"Descendre\" " +
                (i < q.length - 1 ? "" : "disabled ") +
                "onclick=\"jMove('" +
                c.id +
                "',1)\">↓</button><button class=\"b sm\" onclick=\"jOut('" +
                c.id +
                "')\" title=\"Retirer du programme\">✕</button></div>"
              );
            })
            .join("") +
          "</div>"
        : '<p class="m">Aucun chapitre en attente.</p>');
  } else
    body =
      '<p class="m" style="margin-top:0">Ces chapitres ne sont pas proposés par le planning.</p><div class="c">' +
      out
        .map(
          (c) =>
            '<div class="pc" style="--sc:' +
            M(c.mid).couleur +
            '"><div style="flex:1"><b>' +
            esc(c.titre) +
            "</b><br><small>" +
            esc(M(c.mid).nom) +
            "</small></div><button class=\"b\" onclick=\"jIn('" +
            c.id +
            "')\">Remettre au programme</button></div>",
        )
        .join("") +
      "</div>";
  return head + body;
}
function veille() {
  const qe = S.err.map((id) => S.qcm.find((q) => q.id === id)).filter(Boolean),
    dc = S.cards.filter((c) => c.lap && !fsAcq(c)).sort((a, b) => b.lap - a.lap),
    wk = S.chap
      .map((c) => {
        const t = S.cs[c.id];
        return { c, p: t && t.n >= 3 ? t.ok / t.n : null, age: 0 };
      })
      .filter((x) => x.p !== null && x.p < 0.6)
      .sort((a, b) => a.p - b.p),
    ar = S.courses
      .map((c) => {
        const L = c.texte.split("\n"),
          i = L.findIndex((l) => /^# .*retenir/i.test(l));
        if (i < 0) return "";
        const o = [];
        for (let j = i + 1; j < L.length && !L[j].startsWith("# "); j++) o.push(L[j]);
        return (
          '<div class="c" style="border-left:6px solid ' +
          mof(c).couleur +
          '"><b>' +
          esc(c.titre) +
          '</b><div class="rd" style="font-size:16px">' +
          md(o.join("\n")) +
          "</div></div>"
        );
      })
      .join("");
  return (
    '<button class="b" onclick="go(\'err\')">← Erreurs</button><h2 class="ti" style="margin-top:10px">Veille d’examen</h2><p class="m">Un condensé de ce qui compte pour toi : tes points « à retenir », tes erreurs en attente et tes cartes les plus difficiles. Pas de nouveau contenu la veille.</p>' +
    "<h3>À retenir</h3>" +
    (ar ||
      '<p class="m">Ajoute une partie « # À retenir » dans tes cours en texte : elle apparaîtra ici.</p>') +
    (wk.length ? '<h3>Chapitres fragiles</h3><div class="g">' + wk.map(tile).join("") + "</div>" : "") +
    hlAll() +
    "<h3>Mes erreurs (" +
    qe.length +
    ")</h3>" +
    (qe
      .map(
        (q) =>
          '<div class="c rv"><b>' +
          esc(q.enonce) +
          "</b><br><small>Bonnes réponses : " +
          esc(
            q.props
              .filter((p) => p.ok)
              .map((p) => p.t)
              .join(" · "),
          ) +
          "</small>" +
          (q.expl ? "<br><small>" + esc(q.expl) + "</small>" : "") +
          "</div>",
      )
      .join("") || '<p class="m">Aucune erreur en attente.</p>') +
    "<h3>Cartes difficiles (" +
    dc.length +
    ")</h3>" +
    (dc
      .map(
        (c) => '<div class="c rv g"><b>' + esc(c.recto) + "</b><br><small>" + esc(c.verso) + "</small></div>",
      )
      .join("") || '<p class="m">Aucune carte difficile.</p>') +
    '<button class="big" ' +
    (qe.length ? "" : "disabled") +
    ' onclick="errGo()">Dernier passage sur mes erreurs</button>'
  );
}
