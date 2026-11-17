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
function errs() {
  const qe = S.err.map((id) => S.qcm.find((q) => q.id === id)).filter(Boolean),
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
    cfl = [
      ["s", "Sûr(e)"],
      ["h", "Hésitant(e)"],
      ["a", "Au hasard"],
    ]
      .map(([k, l]) => {
        const c = S.cf[k];
        return c
          ? '<span class="tag">' +
              l +
              " : " +
              Math.round((c.ok / c.n) * 100) +
              " % réussi (" +
              c.n +
              ")</span>"
          : "";
      })
      .join("");
  return (
    '<h2 class="ti">Erreurs</h2><div class="hero"><div><div class="fl">' +
    qe.length +
    '</div><small>QCM à revoir</small></div><div><b style="font-size:1.5rem">' +
    S.fsq.length +
    '</b><br><small>faux sûrs</small></div><div><b style="font-size:1.5rem">' +
    dc.length +
    "</b><br><small>cartes difficiles</small></div></div>" +
    '<button class="big" style="background:var(--fg);color:var(--bg)" onclick="go(\'veille\')">Fiche « veille d’examen »</button><button class="big" ' +
    (qe.length ? "" : "disabled") +
    ' onclick="errGo()">Réviser mes erreurs (' +
    qe.length +
    ")</button>" +
    (dc.length
      ? '<button class="big" style="background:var(--fg);color:var(--bg)" onclick="go(\'cards\');start(\'cards\',S.cards.filter(c=>c.lap&&!fsAcq(c)))">Réviser mes cartes difficiles (' +
        dc.length +
        ")</button>"
      : "") +
    (wk.length ? '<h3>Chapitres à renforcer</h3><div class="g">' + wk.map(tile).join("") + "</div>" : "") +
    "<h3>Carnet d’erreurs</h3>" +
    (qe
      .map((q) => {
        const m = mof(q),
          cr = S.courses.find((x) => x.ch === q.ch),
          ca = S.ec[q.id];
        return (
          '<details class="c" style="--sc:' +
          m.couleur +
          '"><summary><b>' +
          esc(q.enonce) +
          "</b>" +
          (S.fsq.includes(q.id) ? ' <span class="tag">' + icn("alert") + " faux sûr</span>" : "") +
          (ca ? ' <span class="tag">' + CAUSE[ca][0] + "</span>" : "") +
          "<br><small>" +
          esc(m.nom + " › " + CH(q.ch).titre) +
          '</small></summary><p style="margin:.6em 0 .2em"><b>Bonnes réponses :</b> ' +
          esc(
            q.props
              .filter((p) => p.ok)
              .map((p) => p.t)
              .join(" · "),
          ) +
          "</p>" +
          (q.expl ? '<p class="m" style="margin:.2em 0">' + esc(q.expl) + "</p>" : "") +
          srcBtn(q) +
          " " +
          (cr
            ? '<button class="b" style="margin-top:6px" onclick="go(\'cours\');R={id:\'' +
              cr.id +
              "'};render()\">Revoir le cours</button>"
            : "") +
          "</details>"
        );
      })
      .join("") ||
      ill("shield", "Aucune erreur en attente. Une question réussie sans faute sort du carnet.")) +
    (dc.length
      ? '<h3>Cartes difficiles</h3><div class="c">' +
        dc
          .slice(0, 8)
          .map(
            (c) =>
              '<div class="ln" style="cursor:default;padding-left:0"><span>' +
              esc(c.recto) +
              "</span><i></i><small>" +
              c.lap +
              "× ratée</small></div>",
          )
          .join("") +
        "</div>"
      : "") +
    '<h3>Pourquoi je me trompe</h3><div class="c">' +
    (er.length
      ? er.map(([k, n]) => '<span class="tag">' + CAUSE[k][0] + " : " + n + "</span>").join("") +
        '<p style="margin:.6em 0 0">Cause la plus fréquente, ' +
        CAUSE[er[0][0]][0].toLowerCase() +
        " : " +
        CAUSE[er[0][0]][1] +
        "</p>"
      : "<small>Après une erreur en entraînement, indique sa cause pour obtenir des conseils.</small>") +
    (cfl ? '<div style="margin-top:10px">' + cfl + "</div>" : "") +
    (S.fsu
      ? '<p style="margin:.5em 0 0">' + icn("alert") + " <b>" + S.fsu + "</b> faux sûr(s) au total.</p>"
      : "") +
    "</div>"
  );
}
