const prow = (i, e, p) =>
  '<div class="r prw" style="margin:0;flex-wrap:nowrap;align-items:center"><b>' +
  "ABCDEFGH"[i] +
  '</b><input type="text" id="' +
  e +
  "p" +
  i +
  '" value="' +
  esc((p || {}).t || "") +
  '"><input type="checkbox" id="' +
  e +
  "k" +
  i +
  '" ' +
  ((p || {}).ok ? "checked " : "") +
  'aria-label="Juste" style="width:22px;height:22px"></div>';
function plus(e) {
  const c = $(e + "rows"),
    n = c.querySelectorAll(".prw").length;
  if (n < 8) c.insertAdjacentHTML("beforeend", prow(n, e));
}
const CAUSE = {
  i: [
    "Je ne savais pas",
    "le cours n’est pas assez appris : privilégie les flashcards et une relecture ciblée.",
  ],
  c: ["Confusion", "fais des fiches comparatives et des sessions « Tout mélangé »."],
  p: ["Piège d’énoncé", "relis chaque proposition lentement : un mot comme « toujours » change tout."],
  a: ["Inattention", "entraîne-toi avec un chrono et relis chaque proposition avant de valider."],
};
function errGo() {
  go("qcm");
  R.f = "err";
  R.n = 0;
  start("qcm");
}
// Corrige les erreurs d'un chapitre (ou toutes).
function errGoCh(ch) {
  go("qcm");
  start("qcm", S.err.map((id) => S.qcm.find((q) => q.id === id)).filter((q) => q && (!ch || q.ch === ch)), { mode: "train" });
}
const ERF = (x) => {
  R.ef = x;
  render();
};
// Page Erreurs : un résumé, les actions principales, puis des sections repliables.
function errs() {
  const qe = S.err.map((id) => S.qcm.find((q) => q.id === id)).filter(Boolean),
    fs = qe.filter((q) => S.fsq.includes(q.id)),
    dc = S.cards.filter((c) => c.lap && !fsAcq(c)).sort((a, b) => b.lap - a.lap),
    er = Object.entries(S.er)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1]),
    wk = S.chap
      .map((c) => {
        const t = S.cs[c.id];
        return { c, p: t && t.n >= 3 ? t.ok / t.n : null, age: 0 };
      })
      .filter((x) => x.p !== null && x.p < 0.6)
      .sort((a, b) => a.p - b.p),
    f = R.ef || "",
    shown = f == "fs" ? fs : f && CAUSE[f] ? qe.filter((q) => S.ec[q.id] == f) : qe,
    sec = (id, title, n, body, open, col) =>
      '<details class="sec" id="' +
      id +
      '" style="--sc:' +
      (col || "var(--c5)") +
      '"' +
      (open ? " open" : "") +
      '><summary><span class="pm"></span><span style="flex:1"><b>' +
      title +
      "</b></span>" +
      (n !== null ? '<span class="cnt">' + n + "</span>" : "") +
      '</summary><div class="sbody">' +
      body +
      "</div></details>",
    errItem = (q) =>
      '<details class="ei"><summary><span style="flex:1">' +
      esc(q.enonce) +
      (S.fsq.includes(q.id) ? ' <span class="tag tw">faux sûr</span>' : "") +
      (S.ec[q.id] ? ' <span class="tag">' + CAUSE[S.ec[q.id]][0] + "</span>" : "") +
      '</span></summary><p style="margin:.4em 0 .2em"><b>Bonnes réponses :</b> ' +
      esc(
        q.props
          .filter((p) => p.ok)
          .map((p) => p.t)
          .join(" · "),
      ) +
      "</p>" +
      (q.expl ? '<p class="m" style="margin:.2em 0">' + esc(q.expl) + "</p>" : "") +
      '<div class="r" style="margin:6px 0 0">' +
      srcBtn(q) +
      "</div></details>";
  // carnet groupé par UE puis par chapitre
  const byUe = S.mat
    .map((m) => {
      const chs = S.chap
        .filter((c) => c.mid === m.id)
        .map((c) => ({ c, l: shown.filter((q) => q.ch === c.id) }))
        .filter((x) => x.l.length);
      return { m, chs, n: chs.reduce((a, x) => a + x.l.length, 0) };
    })
    .filter((x) => x.n);
  const carnet =
    (qe.length
      ? '<div class="chips">' +
        [["", "Toutes (" + qe.length + ")"]]
          .concat(fs.length ? [["fs", "Faux sûrs (" + fs.length + ")"]] : [])
          .concat(
            Object.keys(CAUSE)
              .filter((k) => qe.some((q) => S.ec[q.id] == k))
              .map((k) => [k, CAUSE[k][0] + " (" + qe.filter((q) => S.ec[q.id] == k).length + ")"]),
          )
          .map((x) => '<button class="chip' + (f === x[0] ? " on" : "") + '" onclick="ERF(\'' + x[0] + "')\">" + x[1] + "</button>")
          .join("") +
        "</div>"
      : "") +
    (byUe.length
      ? byUe
          .map(
            ({ m, chs, n }) =>
              '<details class="ue" style="--sc:' +
              m.couleur +
              '"' +
              (byUe.length == 1 ? " open" : "") +
              '><summary class="uh"><span class="pm"></span><span style="flex:1"><h3 style="font-size:1.1rem">' +
              ICO(m) +
              " " +
              esc(m.nom) +
              "</h3></span><small>" +
              n +
              " erreur" +
              (n > 1 ? "s" : "") +
              "</small></summary>" +
              chs
                .map(
                  ({ c, l }) =>
                    '<div class="ech"><div class="r" style="margin:0 0 6px;align-items:center"><b style="flex:1">' +
                    esc(c.titre) +
                    " <small>· " +
                    l.length +
                    "</small></b><button class=\"b\" onclick=\"errGoCh('" +
                    c.id +
                    "')\">Corriger ce chapitre</button></div>" +
                    l.map(errItem).join("") +
                    "</div>",
                )
                .join("") +
              "</details>",
          )
          .join("")
      : ill("shield", qe.length ? "Aucune erreur pour ce filtre." : "Aucune erreur en attente. Une question réussie sans faute sort du carnet."));
  return (
    '<h2 class="ti">Erreurs ' +
    helpBtn("err") +
    "</h2>" +
    '<div class="tls">' +
    '<button class="tl" style="--sc:var(--c5)" onclick="jump(\'s_car\')"><b>' +
    qe.length +
    "</b><small>QCM à corriger</small></button>" +
    '<button class="tl" style="--sc:var(--wn)" ' +
    (fs.length ? "" : "disabled ") +
    "onclick=\"R.ef='fs';render();setTimeout(()=>jump('s_car'),50)\"><b>" +
    fs.length +
    "</b><small>faux sûrs</small></button>" +
    '<button class="tl" style="--sc:var(--c3)" onclick="$(\'s_cd\').open=true;jump(\'s_cd\')"><b>' +
    dc.length +
    "</b><small>cartes difficiles</small></button></div>" +
    '<div class="r2" style="margin-bottom:6px"><button class="big" ' +
    (qe.length ? "" : "disabled ") +
    'onclick="errGo()">Corriger mes erreurs</button><button class="big" style="background:var(--fg);color:var(--bg)" onclick="go(\'veille\')">Veille d’examen</button></div>' +
    sec("s_car", "Carnet d’erreurs", qe.length, carnet, 1) +
    sec(
      "s_cd",
      "Cartes difficiles",
      dc.length,
      dc.length
        ? dc
            .slice(0, 30)
            .map(
              (c) =>
                '<div class="ln" style="cursor:default;padding-left:0"><span>' +
                esc(c.recto) +
                "</span><i></i><small>" +
                c.lap +
                "× oubliée</small></div>",
            )
            .join("") +
          '<button class="big" style="margin-top:10px" onclick="go(\'cards\');start(\'cards\',S.cards.filter(c=>c.lap&&!fsAcq(c)))">Réviser ces cartes</button>'
        : '<p class="m">Aucune carte difficile : les cartes oubliées plusieurs fois et pas encore acquises apparaîtront ici.</p>',
      0,
      "var(--c3)",
    ) +
    sec(
      "s_ch",
      "Chapitres à renforcer",
      wk.length,
      wk.length
        ? '<p class="m" style="margin-top:0">Réussis à moins de 60 % en QCM.</p><div class="g">' + wk.map(tile).join("") + "</div>"
        : '<p class="m">Aucun chapitre sous 60 % de réussite.</p>',
      0,
      "var(--c4)",
    ) +
    sec(
      "s_pq",
      "Pourquoi je me trompe",
      null,
      (er.length
        ? er.map(([k, n]) => '<span class="tag">' + CAUSE[k][0] + " : " + n + "</span>").join("") +
          '<p style="margin:.6em 0 0">Ta cause la plus fréquente est « ' +
          CAUSE[er[0][0]][0].toLowerCase() +
          " » : " +
          CAUSE[er[0][0]][1] +
          "</p>"
        : '<p class="m" style="margin-top:0">Après une erreur en entraînement, indique sa cause (je ne savais pas, confusion, piège, inattention) pour obtenir des conseils ici.</p>') +
      (() => {
        const l = [
          ["s", "Sûr(e)"],
          ["h", "Hésitant(e)"],
          ["a", "Au hasard"],
        ].filter(([k]) => S.cf[k]);
        return l.length
          ? '<div class="lb">Selon ta certitude</div>' +
              l
                .map(([k, lb]) => {
                  const c = S.cf[k],
                    p = c.ok / c.n;
                  return (
                    '<div class="ln" style="cursor:default;padding-left:0"><span>' +
                    lb +
                    "</span><i></i><small>" +
                    Math.round(p * 100) +
                    " % réussi sur " +
                    c.n +
                    "</small></div>"
                  );
                })
                .join("") +
              (S.fsu ? '<p class="m">' + S.fsu + " faux sûr(s) au total depuis le début.</p>" : "")
          : "";
      })(),
      0,
      "var(--mut)",
    )
  );
}
