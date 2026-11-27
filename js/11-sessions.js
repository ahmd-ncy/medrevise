function intro(k) {
  const c = R.f == "atl" && k == "qcm" && typeof atlasQcmCount == "function" ? atlasQcmCount() : pick(k).length,
    q = k == "qcm",
    ex = R.mode == "exam",
    tm = ex ? "t" : R.tm || "n";
  let h =
    '<h2 class="ti">' +
    (q ? "QCM" : "Flashcards " + helpBtn("fsrs")) +
    "</h2>" +
    (R.done || "") +
    '<div class="c"><div class="lb">Sujet <small>(' +
    (k == "cards" ? c + " carte" + (c > 1 ? "s" : "") : c + " disponible" + (c > 1 ? "s" : "")) +
    ")</small></div>" +
    scope() +
    (q && ANS().length
      ? '<div class="lb">Annales</div>' +
        chips(
          [["", "Toutes les questions"]].concat(ANS().map((a, i) => [i, esc(a)])),
          R.an ? ANS().indexOf(R.an) : "",
          "san",
        )
      : "") +
    '<div class="lb">Nombre de ' +
    (q ? "questions" : "cartes") +
    "</div>" +
    chips(
      [
        [5, "5"],
        [10, "10"],
        [20, "20"],
        [0, "Tout"],
      ],
      R.n ?? 10,
      "sn",
    );
  if (q) {
    h +=
      '<div class="lb">Mode</div>' +
      chips(
        [
          ["train", "" + icn("grad") + " Entraînement"],
          ["exam", "" + icn("exam") + " Examen blanc"],
          ["vf", "Vrai ou faux"],
        ],
        R.mode || "train",
        "cm",
      ) +
      '<div class="lb">Notation</div>' +
      chips(
        [
          [1, "Avec barème"],
          [0, "Sans barème (tout ou rien)"],
        ],
        S.bm === false ? 0 : 1,
        "sbm",
      ) +
      (S.bm === false
        ? "<small>Tout ou rien : 1 point seulement sans aucune faute.</small>"
        : "<small>Nancy (à vérifier) : " +
          (S.bt || [1, 0.5, 0.2]).map(pf).join(" · ") +
          " · 0. Une proposition fausse ou oubliée = une faute. Modifiable dans le profil.</small>") +
      '<div class="lb">Niveau de confiance</div>' +
      chips(
        [
          [0, "Non"],
          [1, "Oui, à chaque question"],
        ],
        R.cf ? 1 : 0,
        "scf",
      ) +
      "<small>Tu indiques ta certitude avant de valider : l’application repère les « faux sûrs ».</small>" +
      (typeof atlasQcmCount == "function" && atlasOk() && atlasQcmCount()
        ? '<div class="lb">QCM d’anatomie 3D</div>' +
          chips(
            [
              [1, "Mélangés au sujet « Tout »"],
              [0, "Non"],
            ],
            S.atqmix === false ? 0 : 1,
            "saqm",
          ) +
          "<small>Questions fabriquées à partir des fiches des atlas que tu as ouverts (innervation, action, vascularisation…), environ 1 sur 5.</small>"
        : "");
    if (!ex)
      h +=
        '<div class="lb">Chronomètre</div>' +
        chips(
          [
            ["n", "Aucun"],
            ["q", "" + icn("clock") + " Par question"],
            ["t", "" + icn("clock") + " Temps total"],
          ],
          tm,
          "ct",
        );
    if (tm == "q")
      h += chips(
        [
          [15, "15 s"],
          [30, "30 s"],
          [45, "45 s"],
          [60, "60 s"],
        ],
        R.tv,
        "sv",
      );
    if (tm == "t")
      h += chips(
        [
          [5, "5 min"],
          [10, "10 min"],
          [20, "20 min"],
          [30, "30 min"],
          [60, "60 min"],
        ],
        R.tv,
        "sv",
      );
    if (ex) h += "<small>Pas de correction pendant l'épreuve : note /20 et correction à la fin.</small>";
    if (R.mode == "vf")
      h +=
        "<small>Chaque proposition est jugée seule, vraie ou fausse. Le barème, la confiance et le chronomètre ne s’appliquent pas. Ces sessions ne comptent pas dans ta courbe de notes.</small>";
  }
  if (!q)
    h +=
      '<div class="lb">Cartes</div>' +
      chips(
        [
          ["1", "" + icn("clock") + " À réviser"],
          ["0", "" + icn("cards") + " Toutes"],
        ],
        R.due === false ? "0" : "1",
        "sd",
      ) +
      "<small>" +
      (R.due === false
        ? "Toutes les cartes du sujet choisi, nouvelles ou déjà vues."
        : "Les cartes à revoir aujourd’hui, plus les nouvelles cartes au rythme de " +
          (S.ncd ?? 20) +
          " par jour (réglable dans Profil → Réglages). Choisis « Toutes » pour voir toutes les cartes.") +
      "</small>";
  return (
    h +
    '<button class="big" ' +
    (c ? "" : "disabled") +
    " onclick=\"start('" +
    k +
    "')\">C'est parti</button></div>"
  );
}
const shuf = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function start(k, list, o) {
  o = o || {};
  let a = (list || (k == "cards" && R.due !== false ? cardsToday(pick(k)).all : pick(k)))
    .slice()
    .sort(() => Math.random() - 0.5);
  const n = R.n ?? 10,
    q = k == "qcm",
    mode = q ? o.mode || R.mode || "train" : "train",
    tm = mode == "exam" ? "t" : q ? o.tm || R.tm || "n" : "n";
  if (!list && n) {
    if (R.f) a = a.slice(0, n);
    else {
      const g = S.mat.map((m) => a.filter((x) => mof(x).id === m.id));
      a = [];
      for (let i = 0; a.length < n && g.some((x) => x[i]); i++)
        g.forEach((x) => x[i] && a.length < n && a.push(x[i]));
    }
  }
  // QCM d'anatomie 3D : seuls (sujet « Anatomie 3D ») ou mélangés au sujet « Tout mélangé »
  if (q && !list && typeof atlasQcmGen == "function" && atlasOk()) {
    if (R.f == "atl") a = atlasQcmGen(n || 20);
    else if (!R.f && S.atqmix !== false) a = a.concat(atlasQcmGen(Math.max(1, Math.round((n || a.length) * 0.2))));
  }
  a = shuf(a);
  if (q) a = a.map((x) => ({ ...x, props: shuf(x.props).map((p, i) => ({ ...p, l: "ABCDEFGH"[i] })) }));
  const vf = q && mode == "vf" && !list;
  if (vf)
    a = shuf(
      a.flatMap((x) =>
        x.props
          .filter((p) => p.ok !== null)
          .map((p) => ({ id: x.id, ch: x.ch, enonce: x.enonce, t: p.t, ok: p.ok, expl: x.expl })),
      ),
    ).slice(0, n ? n * 2 : 40);
  R = {
    cf: q && !vf && R.cf ? 1 : 0,
    f: R.f,
    k: vf ? "vf" : k,
    mode,
    tm: vf ? "n" : tm,
    tv: R.tv || (tm == "q" ? 30 : 10),
    q: a,
    i: 0,
    s: 0,
    sel: [],
    v: false,
    run: true,
    ans: [],
    t0: Date.now(),
    tq: Date.now(),
    defi: o.defi,
  };
  tab = k;
  tick();
  render();
  scrollTo(0, 0);
}
function upd() {
  const q = R.tm == "q",
    lim = q ? R.tv * 1000 : R.tv * 60000,
    left = lim - (Date.now() - (q ? R.tq : R.t0)),
    e = $("tm");
  if (e) {
    e.textContent = fmt(Math.max(0, Math.ceil(left / 1000)));
    $("tb").style.width = Math.max(0, (left / lim) * 100) + "%";
  }
  return left;
}
function tick() {
  clearInterval(IV);
  if (R.tm == "n") return;
  IV = setInterval(() => {
    if (!R.run) return clearInterval(IV);
    if (upd() <= 0) {
      if (R.tm == "t") {
        fin();
        render();
      } else if (!R.v) chk();
    }
  }, 250);
}
function quit() {
  ask("Quitter la session ? Ta progression sera perdue.", () => {
    clearInterval(IV);
    if (typeof MIX != "undefined") MIX = null;
    R = { f: R.f, n: R.n };
    render();
  });
}
const sbar = () =>
  '<div class="sb"><button class="x" aria-label="Quitter" onclick="quit()">✕</button><div class="pg"><i style="width:' +
  (R.i / R.q.length) * 100 +
  '%"></i></div><b>' +
  (R.i + 1) +
  "/" +
  R.q.length +
  '</b><button class="x" aria-label="Mode concentration" onclick="foTog()">' +
  icn("focus") +
  "</button></div>" +
  (R.tm != "n"
    ? '<div class="tmr">' + icn("clock") + '<span id="tm"></span><div class="bar"><i id="tb"></i></div></div>'
    : "");
// Note d'une carte : 1 À revoir, 2 Difficile, 3 Bien, 4 Facile.
function rate(g) {
  const it = R.q[R.i],
    cd = S.cards.find((x) => x.id === it.id);
  if (cd) {
    if (!cd.fs && !cd.due) dd().nw = (dd().nw || 0) + 1;
    if (g === 1) cd.lap = (cd.lap || 0) + 1;
    fsRate(cd, g);
    jWork(cd.ch);
  }
  S.fc++;
  S.act[day()] = (S.act[day()] || 0) + 1;
  bump("c");
  if (g > 1) R.s++;
  else if (!it.rq && R.q.length < 400) R.q.push({ ...it, rq: 1 }); // une carte oubliée revient une fois en fin de séance
  S.lcard = R.q[R.i].id;
  R.i++;
  R.v = false;
  R.seen = 0;
  R.rv = [];
  if (R.i >= R.q.length) fin();
  else save();
  render();
}
const flip = () => {
  R.v = !R.v;
  R.seen = 1;
  document.querySelector(".flip").classList.toggle("on", R.v);
  document.querySelectorAll(".r4 .big").forEach((b) => (b.disabled = false));
};
function card() {
  const c = R.q[R.i],
    m = mof(c),
    h = "<small>" + ICO(m) + " " + esc(m.nom + " › " + CH(c.ch).titre) + "</small>",
    d = R.seen ? "" : "disabled ";
  if (c.oc) return ocCard(c, m, d);
  return (
    sbar() +
    '<div class="flip' +
    (R.v ? " on" : "") +
    '" style="--sc:' +
    m.couleur +
    '" role="button" tabindex="0" aria-label="Retourner la carte" onclick="flip()" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();flip()}"><div class="fi"><div class="fc">' +
    h +
    '<div><div class="fq">' +
    esc(c.recto) +
    "</div>" +
    im(c.img) +
    '</div><small>Question · touche pour retourner</small></div><div class="fc back">' +
    h +
    '<div class="fq">' +
    esc(c.verso) +
    '</div><small>Réponse · touche pour revoir la question</small></div></div></div>' +
    rateBtns(c, d) +
    (srcBtn(c) ? '<div class="r">' + srcBtn(c) + "</div>" : "")
  );
}
function qcm() {
  const q = R.q[R.i],
    m = mof(q),
    ex = R.mode == "exam",
    last = R.i == R.q.length - 1;
  const pr = q.props
    .map((p, j) => {
      const on = R.sel.includes(j);
      let cl = on ? " sel" : "",
        ic = "";
      if (R.v) {
        if (p.ok === true) {
          cl = on ? " ok" : " miss";
          ic = on ? "✔" : "" + icn("alert") + " à cocher";
        } else if (on) {
          cl = " ko";
          ic = "✘";
        } else cl = "";
      }
      return (
        '<label class="pr' +
        cl +
        '"><input type="checkbox" ' +
        (on ? "checked " : "") +
        (R.v ? "disabled " : "") +
        'onchange="tog(' +
        j +
        ')"><i class="lt">' +
        esc(p.l) +
        "</i><span>" +
        esc(p.t) +
        "</span><em>" +
        ic +
        "</em></label>"
      );
    })
    .join("");
  const res = R.v
    ? '<div class="bn ' +
      (R.g === null ? "" : R.g ? "good" : R.pt > 0 ? "part" : "bad") +
      '"><b>' +
      (R.g === null
        ? "Correction non vérifiée"
        : R.g
          ? "✔ Bravo, 1 point !"
          : R.pt > 0
            ? "◐ Partiel : " + pf(R.pt) + " point"
            : "✘ 0 point, regarde la correction") +
      "</b>" +
      (R.fsu
        ? "<p><b>" + icn("alert") + " Faux sûr :</b> tu étais sûr(e) de toi. Notion à revoir en priorité.</p>"
        : "") +
      (q.expl ? "<p>" + esc(q.expl) + "</p>" : "") +
      "</div>"
    : "";
  return (
    sbar() +
    '<div class="c" style="border-top:8px solid ' +
    m.couleur +
    '"><small>' +
    ICO(m) +
    " " +
    esc(m.nom + " › " + CH(q.ch).titre) +
    (q.ai ? " · IA, non vérifié" : "") +
    '</small><h3 style="margin-top:6px">' +
    esc(q.enonce) +
    "</h3><small>Coche toutes les propositions exactes (une ou plusieurs).</small>" +
    im(q.img) +
    pr +
    "</div>" +
    res +
    (R.v
      ? '<div class="r" style="margin:0 0 4px;align-items:center">' +
        srcBtn(q) +
        '<button class="b aib" onclick="aiQcm()">Expliquer avec l’IA</button>' +
        aiTag(q) +
        "</div>"
      : "") +
    (R.v && R.g === false
      ? '<div class="lb">Pourquoi cette erreur ? <small>(facultatif)</small></div>' +
        chips(
          [
            ["i", "Je ne savais pas"],
            ["c", "Confusion"],
            ["p", "Piège d’énoncé"],
            ["a", "Inattention"],
          ],
          R.ec || "",
          "sec",
        )
      : "") +
    (!R.v && R.cf
      ? '<div class="lb">Ta certitude</div>' +
        chips(
          [
            ["s", "Sûr(e)"],
            ["h", "Hésitant(e)"],
            ["a", "Au hasard"],
          ],
          R.conf,
          "sc",
        )
      : "") +
    (R.v
      ? '<button class="big" onclick="nextQ()">' + (last ? "Terminer" : "Suivant") + "</button>"
      : '<button class="big" ' +
        (R.sel.length && (!R.cf || R.conf) ? "" : "disabled") +
        ' onclick="chk()">' +
        (ex ? (last ? "Terminer" : "Valider et suivant") : "Valider") +
        "</button>")
  );
}
function tog(j) {
  const i = R.sel.indexOf(j);
  i < 0 ? R.sel.push(j) : R.sel.splice(i, 1);
  render();
}
function chk() {
  if (R.v) return;
  const q = R.q[R.i],
    unk = q.props.some((p) => p.ok === null),
    f = q.props.filter((p, j) => p.ok !== null && p.ok !== R.sel.includes(j)).length,
    pt = unk ? null : (S.bm === false ? [1] : S.bt || [1, 0.5, 0.2])[f] || 0,
    id = mof(q).id,
    m = S.ms[id] || (S.ms[id] = { ok: 0, n: 0 });
  R.g = pt === null ? null : f == 0;
  R.pt = pt;
  R.fsu = 0;
  if (R.cf && R.conf) {
    const k = S.cf[R.conf] || (S.cf[R.conf] = { ok: 0, n: 0 });
    k.n++;
    if (f == 0) k.ok++;
    if (R.conf == "s" && f > 0) {
      R.fsu = 1;
      S.fsu = (S.fsu || 0) + 1;
      if (!S.fsq.includes(q.id)) S.fsq.push(q.id);
    }
  }
  S.act[day()] = (S.act[day()] || 0) + 1;
  R.ans.push({ q, g: R.g, pt, conf: R.conf, fsu: R.fsu, dt: Date.now() - R.tq });
  // QCM d'anatomie générés : on retient seulement les erreurs (pour les reproposer), sans toucher aux statistiques des UE
  if (q.gen) {
    S.atq = S.atq || {};
    S.atq.g = S.atq.g || {};
    S.atq.g[q.gk] = f == 0 ? 0 : (S.atq.g[q.gk] || 0) + 1;
    R.s += pt || 0;
    if (R.mode == "exam") return nextQ();
    R.v = true;
    save();
    return render();
  }
  if (pt !== null) {
    const oq = S.qcm.find((x) => x.id === q.id);
    if (oq) fsRate(oq, qGrade(f, pt, R.conf));
    R.s += pt;
    m.n++;
    m.ok += pt;
    const cs = S.cs[q.ch] || (S.cs[q.ch] = { ok: 0, n: 0 });
    cs.n++;
    cs.ok += pt;
    cs.d = day();
    S.rc[id] = (S.rc[id] || []).concat(pt).slice(-40);
    if (f == 0) {
      S.se++;
      S.seb = Math.max(S.seb, S.se);
      if (S.err.includes(q.id)) bump("e");
      S.err = S.err.filter((x) => x !== q.id);
      S.fsq = S.fsq.filter((x) => x !== q.id);
    } else {
      S.se = 0;
      if (!S.err.includes(q.id)) S.err.push(q.id);
    }
  }
  {
    const d = dd();
    d.cur = pt !== null && f == 0 ? (d.cur || 0) + 1 : 0;
    bump("q");
    bump("st", d.cur);
    jWork(q.ch);
  }
  if (R.mode == "exam") return nextQ();
  R.v = true;
  save();
  render();
}
function nextQ() {
  R.i++;
  R.v = false;
  R.sel = [];
  R.conf = "";
  R.ec = "";
  R.tq = Date.now();
  if (R.i >= R.q.length) fin();
  render();
  scrollTo(0, 0);
}
function bilan() {
  if (!R.ans.length) return "";
  const by = {};
  R.ans.forEach((a) => {
    const o = by[a.q.ch] || (by[a.q.ch] = { p: 0, n: 0 });
    o.p += a.pt || 0;
    o.n++;
  });
  const tot = R.ans.reduce((x, a) => x + (a.dt || 0), 0),
    sl = R.ans.slice().sort((a, b) => (b.dt || 0) - (a.dt || 0))[0];
  return (
    '<h3>Bilan par chapitre</h3><div style="text-align:left">' +
    Object.keys(by)
      .map((c) => {
        const o = by[c],
          p = o.p / o.n;
        return (
          "<div>" +
          esc(mof({ ch: c }).nom + " › " + CH(c).titre) +
          " <small>" +
          pf(+o.p.toFixed(2)) +
          " / " +
          o.n +
          '</small><div class="bar" style="--sc:' +
          (p >= 0.75 ? "var(--ok)" : p >= 0.5 ? "var(--wn)" : "var(--ko)") +
          '"><i style="width:' +
          p * 100 +
          '%"></i></div></div>'
        );
      })
      .join("") +
    '<p style="margin:.6em 0 0"><small>Temps moyen par question : ' +
    Math.round(tot / R.ans.length / 1000) +
    " s" +
    (sl && sl.dt
      ? " · la plus longue : " + Math.round(sl.dt / 1000) + " s (« " + esc(sl.q.enonce.slice(0, 50)) + "… »)"
      : "") +
    "</small></p></div>"
  );
}
function vfq() {
  const x = R.q[R.i],
    m = mof(x),
    a = R.va;
  return (
    sbar() +
    '<div class="c" style="border-top:8px solid ' +
    m.couleur +
    '"><small>' +
    ICO(m) +
    " " +
    esc(m.nom + " › " + CH(x.ch).titre) +
    '</small><p style="margin:.5em 0"><small>' +
    esc(x.enonce) +
    "</small></p><h3>" +
    esc(x.t) +
    "</h3></div>" +
    (a === undefined
      ? '<div class="r2"><button class="big ok2" onclick="vfa(true)">Vrai</button><button class="big ko2" onclick="vfa(false)">Faux</button></div>'
      : '<div class="bn ' +
        (a === x.ok ? "good" : "bad") +
        '"><b>' +
        (a === x.ok ? "✔ Exact" : "✘ Raté") +
        " : cette proposition est " +
        (x.ok ? "vraie" : "fausse") +
        ".</b>" +
        (x.expl ? "<p>" + esc(x.expl) + "</p>" : "") +
        '</div><button class="big" onclick="vfn()">' +
        (R.i == R.q.length - 1 ? "Terminer" : "Suivant") +
        "</button>")
  );
}
function vfa(v) {
  const x = R.q[R.i],
    ok = v === x.ok,
    d = dd();
  R.va = v;
  if (ok) R.s++;
  d.cur = ok ? (d.cur || 0) + 1 : 0;
  bump("st", d.cur);
  S.act[day()] = (S.act[day()] || 0) + 1;
  jWork(x.ch);
  save();
  render();
}
function vfn() {
  R.i++;
  R.va = undefined;
  if (R.i >= R.q.length) fin();
  render();
  scrollTo(0, 0);
}
function fin() {
  clearInterval(IV);
  const n = R.q.length,
    q = R.k == "qcm",
    s = +((R.s / n) * 20).toFixed(1),
    ex = R.mode == "exam";
  let h =
    '<div class="c res">' +
    ((q ? s : (R.s / n) * 20) >= 15 ? ill("trophy") : "") +
    '<div class="ring">' +
    (q ? s : R.s) +
    "<small>/" +
    (q ? 20 : n) +
    "</small></div><h2>" +
    ((q ? s : (R.s / n) * 20) >= 15
      ? "Excellent !"
      : (q ? s : (R.s / n) * 20) >= 10
        ? "Bien joué"
        : "Continue, ça vient") +
    "</h2><p>" +
    (q
      ? pf(+R.s.toFixed(2)) + " point(s) sur " + n
      : R.s + (R.k == "vf" ? " bonne(s) réponse(s) sur " : " carte(s) sue(s) sur ") + n) +
    (ex ? " · examen blanc" : "") +
    "</p>";
  if (q) {
    S.hist.push({ d: day(), t: Date.now(), s, n });
    S.lq = { lab: R.defi ? "Défi du jour" : lab(R.f), f: R.f || "", s, n };
    if (n >= 3) {
      if (s >= 15) {
        S.s15++;
        S.s15b = Math.max(S.s15b, S.s15);
      } else S.s15 = 0;
    }
    if (n >= 5 && s >= 12) bump("note", 1);
    if (!R.f && !R.defi && n >= 5) bump("mix", 1);
  }
  if (R.cf)
    h +=
      "<p>" +
      icn("alert") +
      " Faux sûrs : " +
      R.ans.filter((a) => a.fsu).length +
      " · Réussites « au hasard » : " +
      R.ans.filter((a) => a.conf == "a" && a.g).length +
      "</p>";
  if (ex)
    h +=
      bilan() +
      "<h3>Correction</h3>" +
      R.ans
        .map(
          (a) =>
            '<div class="c rv ' +
            (a.g ? "g" : "") +
            '"><b>' +
            (a.g ? "✔ " : a.pt > 0 ? "◐ " : "✘ ") +
            esc(a.q.enonce) +
            "</b> <small>(" +
            pf(a.pt ?? 0) +
            " pt)</small><br><small>Bonnes réponses : " +
            esc(
              a.q.props
                .filter((p) => p.ok)
                .map((p) => p.l + ". " + p.t)
                .join(" · "),
            ) +
            "</small></div>",
        )
        .join("");
  if (dd().cel === 1) {
    h += "<p>" + icn("flame") + " Journée bouclée : " + flame() + " jour(s) d’affilée</p>";
    dd().cel = 2;
  }
  if (typeof mixNext == "function") h += mixNext();
  save();
  R = { f: R.f, n: R.n, done: h + "</div>" };
}
// Boutons de notation d'une carte, avec le délai avant la prochaine révision.
function rateBtns(c, d) {
  const cd = S.cards.find((x) => x.id === c.id) || c;
  return (
    '<div class="r4">' +
    [
      [1, "À revoir", "ko2"],
      [2, "Difficile", "wn2"],
      [3, "Bien", "ok2"],
      [4, "Facile", "ez2"],
    ]
      .map(
        ([g, l, cl]) =>
          '<button class="big ' +
          cl +
          '" ' +
          d +
          'onclick="rate(' +
          g +
          ')">' +
          l +
          "<small>" +
          ivLab(fsNext(cd.fs, g).iv) +
          "</small></button>",
      )
      .join("") +
    "</div>"
  );
}
