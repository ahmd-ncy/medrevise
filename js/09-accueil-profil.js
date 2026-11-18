function stats() {
  const n = S.hist.reduce((a, h) => a + h.n, 0);
  return { n, moy: S.hist.length ? (S.hist.reduce((a, h) => a + h.s, 0) / S.hist.length).toFixed(1) : "–" };
}
// ================= Accueil =================
function home() {
  const fl = flame(),
    d = dd(),
    nd = d.o.filter(([t, n]) => OBJ[t].v(d) >= n).length,
    all = d.o.length > 0 && nd === d.o.length,
    jr = S.exam ? Math.ceil((new Date(S.exam) - new Date(day())) / 864e5) : null,
    hr = new Date().getHours(),
    hi = (hr >= 18 || hr < 5 ? "Bonsoir" : "Bonjour") + (S.name ? ", " + esc(S.name) : ""),
    empty = !S.chap.length && !S.qcm.length && !S.cards.length,
    ct = cardsToday(),
    qd = qcmDue().length,
    P = PL(),
    D = S.chap.length ? jPlan(14).days[0] : null,
    lc = S.courses.find((x) => x.id === S.lc),
    pc = d.o.length ? nd / d.o.length : 0,
    C = 2 * Math.PI * 44,
    tile = (n, l, ic, fn, col) =>
      '<button class="tl" style="--sc:' +
      col +
      '" onclick="' +
      fn +
      '" ' +
      (n ? "" : "disabled") +
      ">" +
      icn(ic) +
      "<b>" +
      n +
      "</b><small>" +
      l +
      "</small></button>";
  const hero =
    '<div class="hero2"><div style="flex:1;min-width:0"><small class="hdate">' +
    dlab(day()) +
    "</small><h2>" +
    hi +
    "</h2><p>" +
    (empty
      ? "Bienvenue ! Ajoute tes premiers cours pour que je prépare tes journées."
      : all
        ? "Journée bouclée, ta flamme est sauvée. Tout ce que tu fais en plus est du bonus."
        : d.o.length
          ? "Encore " + (d.o.length - nd) + " objectif" + (d.o.length - nd > 1 ? "s" : "") + " pour garder ta flamme."
          : "Rien d’obligatoire aujourd’hui.") +
    "</p>" +
    (jr !== null && jr >= 0 ? '<span class="pill">' + (jr > 0 ? "J-" + jr + " avant le concours" : "Jour J, courage !") + "</span>" : "") +
    '</div><div class="flm" title="Jours d’affilée"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="rg0"/><circle cx="50" cy="50" r="44" class="rg1" stroke-dasharray="' +
    C.toFixed(1) +
    '" stroke-dashoffset="' +
    (C * (1 - pc)).toFixed(1) +
    '"/></svg><span>' +
    icn("flame") +
    "<b>" +
    fl +
    "</b><small>jour" +
    (fl > 1 ? "s" : "") +
    "</small></span></div></div>";
  const acc =
    SY.sb && !SY.user
      ? '<button class="rs acc" style="--sc:var(--wn)" onclick="go(\'prof\');setTimeout(()=>jump(\'cpt\'),80)">' +
        icn("cloud") +
        "<span><b>Sauvegarde ton travail</b><br><small>Connecte-toi pour tout retrouver sur ton iPhone et ton PC.</small></span></button>"
      : "";
  if (empty)
    return (
      hero +
      acc +
      '<div class="c" style="text-align:center">' +
      ill("plus", "Crée une UE et un chapitre, puis ajoute tes livrets, QCM et flashcards, à la main ou par import JSON.") +
      '<div class="r" style="justify-content:center"><button class="b p" onclick="go(\'add\');R={add:\'mat\'};render()">Ajouter une UE</button><button class="b" onclick="go(\'add\');R={add:\'json\'};render()">Importer un JSON</button></div></div>'
    );
  return (
    hero +
    acc +
    (d.o.length
      ? '<h3>Objectifs du jour · ' +
        nd +
        "/" +
        d.o.length +
        '</h3><div class="c">' +
        d.o
          .map(([t, n]) => {
            const v = Math.min(n, OBJ[t].v(d) || 0),
              ok = v >= n;
            return (
              '<button class="ob' +
              (ok ? " ok" : "") +
              '" onclick="' +
              OBJ[t].go +
              '"><span class="ck">' +
              (ok ? "✓" : "") +
              '</span><span style="flex:1">' +
              OBJ[t].l(n) +
              '<span class="bar"><i style="width:' +
              (n ? (v / n) * 100 : 0) +
              '%"></i></span></span><b>' +
              v +
              "/" +
              n +
              "</b></button>"
            );
          })
          .join("") +
        (all ? ill("flame", "Journée bouclée !") : "") +
        "</div>"
      : "") +
    "<h3>Au programme</h3>" +
    '<div class="tls">' +
    tile(ct.all.length, "carte" + (ct.all.length > 1 ? "s" : "") + " du jour", "cards", "go('cards');R.f='';R.due=true;render()", "var(--c3)") +
    tile(qd, "QCM à revoir", "check", "qs('due')", "var(--c4)") +
    tile(S.err.length, "erreur" + (S.err.length > 1 ? "s" : "") + " à corriger", "errors", "errGo()", "var(--c5)") +
    "</div>" +
    (D
      ? '<div class="c">' +
        jToday() +
        '<div class="r" style="align-items:center;margin-top:10px"><small style="flex:1">≈ ' +
        fmtM(D.min) +
        " de chapitres prévus sur " +
        fmtM(P.cap) +
        ' disponibles</small><button class="b" onclick="go(\'plan\')">' +
        icn("cal") +
        " Planning</button></div></div>" +
        "<h3>Cette semaine</h3>" +
        jWeek()
      : "") +
    (lc
      ? '<h3>Reprendre</h3><button class="rs" style="--sc:' +
        mof(lc).couleur +
        "\" onclick=\"go('cours');R={id:'" +
        lc.id +
        "'};render()\">" +
        icn("book") +
        "<span><small>Dernier livret</small><br>" +
        esc(lc.titre) +
        "</span></button>"
      : "")
  );
}
const jump = (id) => $(id).scrollIntoView({ behavior: "smooth" });
function prof() {
  const st = stats(),
    nm = S.name || "Étudiant·e",
    J = (id, l) => '<button class="chip" onclick="jump(\'' + id + "')\">" + l + "</button>",
    tl = [
      [st.n, "QCM répondus"],
      [S.hist.length, "sessions"],
      [st.moy, "moyenne /20"],
      [S.fc, "cartes révisées"],
      ["" + icn("flame") + " " + flame(), "jours d’affilée"],
      [S.days.length, "journées bouclées"],
      [fmtH(Object.values(S.tm || {}).reduce((a, b) => a + b, 0)), "temps de travail"],
    ];
  return (
    '<div class="pf"><div class="av2">' +
    esc(nm[0].toUpperCase()) +
    '</div><div style="flex:1"><h2 style="margin:0">' +
    esc(nm) +
    "</h2><small>" +
    st.n +
    " QCM répondus · " +
    S.fc +
    " cartes révisées</small></div></div>" +
    '<div class="chips">' +
    J("cpt", "Compte") +
    J("p1", "Chiffres") +
    J("p2", "Progression") +
    J("p3", "Notes") +
    J("p4", "Apparence") +
    J("p5", "Réglages") +
    "</div>" +
    '<h3 id="cpt">Compte et synchronisation</h3><div id="sybox">' +
    syBox() +
    "</div>" +
    (setTimeout(syInvLoad, 0), "") +
    '<h3 id="p1">Chiffres clés</h3><div class="g">' +
    tl.map((t) => '<div class="k"><b>' + t[0] + "</b><small>" + t[1] + "</small></div>").join("") +
    "</div>" +
    '<h3 id="p2">Progression</h3><div class="c" id="chbox">' +
    chart() +
    "</div>" +
    radar() +
    '<h3>Maîtrise par chapitre</h3>' +
    carte()
      .replace("<h3>Maîtrise par UE</h3>", "")
      .replace("<h3>Priorités</h3>", '<div class="lb" style="margin:0 0 6px">Priorités</div>') +
    memo() +
    '<h3 id="p3">Notes et calendrier</h3>' +
    insight() +
    '<h3>Contenu</h3><div class="c">' +
    [
      [S.mat.length, "UE"],
      [S.chap.length, "chapitres"],
      [S.courses.length, "livrets"],
      [S.qcm.length, "QCM"],
      [S.cards.length, "flashcards"],
    ]
      .map((t) => '<span class="tag"><b>' + t[0] + "</b> " + t[1] + "</span>")
      .join("") +
    "</div>" +
    '<h3 id="p4">Apparence</h3>' +
    appearance() +
    '<h3 id="p5">Réglages</h3>' +
    settings() +
    '<h3>Données</h3><button class="big" onclick="go(\'data\')">Données et sauvegarde</button><h3>Développement</h3><div class="c"><p class="m" style="margin-top:0">Pour tes tests : remet l’application à zéro, vide ou avec un contenu de démonstration.</p><button class="big ko2" onclick="resetDlg()">Réinitialiser l’application</button></div>'
  );
}
