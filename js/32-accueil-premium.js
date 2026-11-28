// ================= Accueil « widgets » : moins de texte, plus de visuel =================
if (typeof IC == "object" && !IC.play) IC.play = '<path class="df" d="M8 5.5v13l10.5-6.5z"/>';
function homeV2() {
  gelTick();
  const fl = flame(),
    d = dd(),
    o = d.o.slice(0, 3),
    nd = d.o.filter(([t, n]) => OBJ[t].v(d) >= n).length,
    all = d.o.length > 0 && nd === d.o.length,
    jr = S.exam ? Math.ceil((new Date(S.exam) - new Date(day())) / 864e5) : null,
    hr = new Date().getHours(),
    hi = (hr >= 18 || hr < 5 ? "Bonsoir" : hr < 12 ? "Bonjour" : "Bon après-midi") + (S.name ? ", " + esc(S.name) : ""),
    empty = !S.chap.length && !S.qcm.length && !S.cards.length,
    ct = cardsToday(),
    qd = qcmDue().length,
    D = S.chap.length ? jPlan(14).days[0] : null,
    P = PL(),
    lc = S.courses.find((x) => x.id === S.lc),
    mix = typeof mixPlan == "function" ? mixPlan() : [],
    i = { v: 0 },
    st = (x) => ' style="--i:' + i.v++ + (x ? ";" + x : "") + '"';
  const top =
    '<div class="hwtop"><div class="hwtt"><small class="hwdate">' + dlab(day()) + '</small><h1 class="hwhi">' + hi + "</h1>" +
    '<p class="m">' +
    (empty
      ? "Bienvenue ! Ajoute tes premiers cours pour que je prépare tes journées."
      : all
        ? "Journée bouclée, ta flamme est sauvée 🎉"
        : d.o.length
          ? "Encore " + (d.o.length - nd) + " objectif" + (d.o.length - nd > 1 ? "s" : "") + " pour garder ta flamme."
          : "Rien d’obligatoire aujourd’hui.") +
    "</p></div>" +
    '<button class="hwfl" onclick="helpShow(\'gel\')" title="Jours d’affilée' + (S.gel && S.gel.has ? " · gel disponible" : "") + '"><span class="hwfi">' + icn("flame") + "</span><b>" + fl + "</b><small>jour" + (fl > 1 ? "s" : "") + "</small>" +
    (S.gel && S.gel.has ? '<em title="Gel de flamme disponible">❄</em>' : "") + "</button></div>";
  const acc =
    SY.sb && !SY.user
      ? '<button class="hwacc" onclick="profGo(\'compte\')">' + icn("cloud") + "<span><b>Sauvegarde ton travail</b><small>Connecte-toi pour tout retrouver sur ton iPhone et ton PC.</small></span>" + icn("chev") + "</button>"
      : "";
  if (empty)
    return (
      '<div class="hw">' + top + acc +
      '<div class="hwg"><button class="hwm hw2"' + st() + " onclick=\"go('add');R={add:'mat'};render()\"><span class=\"hwmk\">Pour commencer</span><b>Ajoute ta première UE</b><small>Puis tes chapitres, livrets, QCM et flashcards, à la main ou par import JSON.</small><span class=\"hwplay\">" + icn("plus") + "</span></button>" +
      "<button class=\"hws\"" + st("--k:#30b0c7") + " onclick=\"go('add');R={add:'json'};render()\"><span class=\"hwsi\">" + icn("file") + "</span><b>JSON</b><small>Importer un fichier</small></button>" +
      "<button class=\"hws\"" + st("--k:#bf5af2") + " onclick=\"tutoStart(1)\"><span class=\"hwsi\">" + icn("spark") + "</span><b>Visite</b><small>Découvrir l’app</small></button></div></div>"
    );
  // anneaux des objectifs
  const R0 = 46,
    W = 11,
    COL = ["#ff375f", "#30d158", "#0a84ff"],
    rings = o
      .map(([t, n], k) => {
        const v = Math.min(OBJ[t].v(d) || 0, n),
          p = n ? v / n : 0,
          r = R0 - k * (W + 3),
          C = 2 * Math.PI * r;
        return (
          '<circle cx="56" cy="56" r="' + r + '" fill="none" stroke="' + COL[k] + '" stroke-opacity=".2" stroke-width="' + W + '"/>' +
          '<circle cx="56" cy="56" r="' + r + '" fill="none" stroke="' + COL[k] + '" stroke-width="' + W + '" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + C * (1 - p) + '" transform="rotate(-90 56 56)" class="prra"/>'
        );
      })
      .join("");
  const ringW = o.length
    ? '<div class="hwr hw2"' + st() + '><svg viewBox="0 0 112 112" class="hwrs" aria-hidden="true">' + rings + '</svg><div class="hwrl"><span class="hwmk">Objectifs du jour · ' + nd + "/" + d.o.length + " " + helpBtn("obj") + "</span>" +
      o
        .map(([t, n], k) => {
          const v = Math.min(OBJ[t].v(d) || 0, n);
          return '<button onclick="' + OBJ[t].go + '"><i style="background:' + COL[k] + '"></i><span>' + esc(OBJ[t].l(n)) + "</span><b>" + (v >= n ? "✓" : v + "/" + n) + "</b></button>";
        })
        .join("") +
      "</div></div>"
    : "";
  // révision du jour
  const mixN = mix.reduce((t, s) => t + s.n, 0),
    mixMin = Math.max(5, Math.round(mix.reduce((t, s) => t + s.n * (s.k == "cards" ? 0.25 : s.k == "qcm" ? 1.2 : 0.4), 0))),
    mixW = mixN
      ? '<button class="hwm hw2"' + st() + ' onclick="mixStart()"><span class="hwmk">Révision du jour · ' + mixMin + " min</span><b>" +
        mix.map((s) => s.n + " " + { cards: "flashcard" + (s.n > 1 ? "s" : ""), qcm: "QCM", atlas: "question" + (s.n > 1 ? "s" : "") + " 3D" }[s.k]).join(" · ") +
        "</b><small>" + mixN + " éléments enchaînés, sans rien choisir</small><span class=\"hwplay\">" + icn("play") + "</span></button>"
      : '<div class="hwm hw2 done"' + st() + '><span class="hwmk">Révision du jour</span><b>Tout est à jour ✓</b><small>Rien à revoir pour l’instant. Profites-en pour avancer un chapitre.</small></div>';
  const small = (n, l, ic, fn, k) =>
    '<button class="hws"' + st("--k:" + k) + ' onclick="' + fn + '"' + (n ? "" : " disabled") + '><span class="hwsi">' + icn(ic) + "</span><b>" + n + "</b><small>" + l + "</small></button>";
  const tiles =
    small(ct.all.length, "carte" + (ct.all.length > 1 ? "s" : "") + " du jour", "cards", "go('cards');R.f='';R.due=true;render()", "#ff9f0a") +
    small(qd, "QCM à revoir", "check", "qs('due')", "#bf5af2") +
    small(S.err.length, "erreur" + (S.err.length > 1 ? "s" : "") + " à corriger", "errors", "errGo()", "#ff375f") +
    (jr !== null && jr >= 0
      ? '<button class="hws hwj"' + st("--k:#0a84ff") + ' onclick="profGo(\'reg\')"><span class="hwsi">' + icn("cal") + "</span><b>" + (jr > 0 ? "J-" + jr : "Jour J") + "</b><small>avant le concours</small></button>"
      : '<button class="hws"' + st("--k:#0a84ff") + ' onclick="profGo(\'reg\')"><span class="hwsi">' + icn("cal") + "</span><b>Concours</b><small>Ajoute la date</small></button>");
  const resume = lc
    ? '<button class="hwres hw2"' + st("--k:" + mof(lc).couleur) + " onclick=\"go('cours');R={id:'" + lc.id + "'};render()\"><span class=\"hwbk\">" + icn("book") +
      "</span><span class=\"hwrt\"><span class=\"hwmk\">Reprendre</span><b>" + esc(lc.titre) + "</b><small>" + esc(mof(lc).nom || "") + "</small></span><span class=\"hwgo\">" + icn("chev") + "</span></button>"
    : "";
  return (
    '<div class="hw">' + top + acc +
    '<div class="hwg">' + mixW + ringW + tiles + resume + "</div>" +
    (D
      ? '<div class="hwsec"><h3>Au programme aujourd’hui ' + helpBtn("j") + '</h3><button class="lnk" onclick="go(\'plan\')">Planning ›</button></div><div class="c hwplan">' + jToday() +
        '<small class="m">≈ ' + fmtM(D.min) + " de chapitres prévus sur " + fmtM(P.cap) + " disponibles</small></div>" +
        '<div class="hwsec"><h3>Cette semaine</h3></div>' + jWeek()
      : "") +
    "</div>"
  );
}
