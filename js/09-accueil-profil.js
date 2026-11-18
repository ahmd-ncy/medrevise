function stats() {
  const n = S.hist.reduce((a, h) => a + h.n, 0);
  return { n, moy: S.hist.length ? (S.hist.reduce((a, h) => a + h.s, 0) / S.hist.length).toFixed(1) : "–" };
}
// ================= Accueil =================
function home() {
  gelTick();
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
    (jr !== null && jr >= 0 ? '<span class="pill">' + (jr > 0 ? "J-" + jr + " avant le concours" : "Jour J, courage !") + "</span> " : "") +
    (S.gel && S.gel.has
      ? '<span class="pill gel" title="Gel de flamme disponible">❄ Gel dispo</span>' + helpBtn("gel")
      : '<span class="pill gel off" title="Pas de gel disponible">❄ 0</span>' + helpBtn("gel")) +
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
      ? '<button class="rs acc" style="--sc:var(--wn)" onclick="profGo(\'compte\')">' +
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
        " " +
        helpBtn("obj") +
        '</h3><div class="c" id="hobj">' +
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
    '<h3>Au programme <small style="text-transform:none;letter-spacing:0">· méthode des J</small> ' +
    helpBtn("j") +
    "</h3>" +
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
// ================= Profil : un menu de sections =================
const profGo = (sec) => {
  go("prof");
  R.ps = sec;
  render();
  scrollTo(0, 0);
};
const FIL = ["PASS", "LAS 1", "LAS 2", "LAS 3", "DFGSM 2", "DFGSM 3", "Autre"];
const PSEC = [
  ["moi", "Mon profil", "user", () => [S.name && S.name + (S.lname ? " " + S.lname : ""), S.fil].filter(Boolean).join(" · ") || "Prénom, photo, filière"],
  ["compte", "Compte et synchronisation", "cloud", () => (SY.user ? SYL[SY.st] + (SY.role == "admin" ? " · invitations" : "") : "Non connecté")],
  ["progres", "Ma progression", "chart", () => {
    const st = stats();
    return st.n + " QCM répondus · moyenne " + st.moy + "/20";
  }],
  ["cal", "Calendrier et notes", "cal", () => S.days.length + " journée" + (S.days.length > 1 ? "s" : "") + " bouclée" + (S.days.length > 1 ? "s" : "") + ", notes par UE"],
  ["reg", "Réglages", "gear", () => "Concours, objectifs, barème, cartes par jour"],
  ["app", "Apparence", "spark", () => "Couleurs, mode sombre, effets"],
  ["don", "Données et sauvegarde", "file", () => "Exporter, restaurer, réinitialiser"],
  ["aide", "Aide", "book", () => "Visite guidée et explications"],
  ["admin", "Administration", "shield", () => "Membres, profils, invitations et accès", () => SY.role == "admin"],
];
// Photo de profil : recadrée au centre en carré de 256 px.
function setPhoto(inp) {
  if (!inp) {
    delete S.photo;
    save();
    return render();
  }
  const f = inp.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    const i = new Image();
    i.onload = () => {
      const k = Math.min(i.width, i.height),
        cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      cv.getContext("2d").drawImage(i, (i.width - k) / 2, (i.height - k) / 2, k, k, 0, 0, 256, 256);
      S.photo = cv.toDataURL("image/jpeg", 0.82);
      save();
      render();
    };
    i.src = fr.result;
  };
  fr.readAsDataURL(f);
}
const avatar = (nm) =>
  S.photo && /^data:image\//.test(S.photo) ? '<img src="' + esc(S.photo) + '" alt="Photo de profil">' : esc((nm || "?")[0].toUpperCase());
function prof() {
  const st = stats(),
    nm = S.name || "Étudiant·e",
    head =
      '<div class="pf"><label class="av2 ph" title="Changer la photo de profil">' +
      avatar(nm) +
      '<input type="file" accept="image/*" hidden onchange="setPhoto(this)"><span class="phe">' +
      icn("edit") +
      '</span></label><div style="flex:1;min-width:0"><h2 style="margin:0">' +
      esc(nm) +
      "</h2><small>" +
      icn("flame") +
      " " +
      flame() +
      " jour" +
      (flame() > 1 ? "s" : "") +
      " d’affilée · " +
      st.n +
      " QCM · " +
      S.fc +
      " cartes</small>" +
      (S.photo ? '<br><button class="lnk" onclick="setPhoto(null)">Retirer la photo</button>' : "") +
      "</div></div>";
  if (!R.ps)
    return (
      head +
      '<div class="pmenu">' +
      PSEC.filter((x) => !x[4] || x[4]()).map(
        ([k, t, ic, sub]) =>
          '<button class="pmi" onclick="R.ps=\'' +
          k +
          '\';render();scrollTo(0,0)"><span class="pmic">' +
          icn(ic) +
          '</span><span style="flex:1"><b>' +
          t +
          "</b><br><small>" +
          esc(sub()) +
          '</small></span><span class="cv">›</span></button>',
      ).join("") +
      "</div>"
    );
  const sec = PSEC.find((x) => x[0] == R.ps) || PSEC[0],
    tl = [
      [st.n, "QCM répondus"],
      [S.hist.length, "sessions"],
      [st.moy, "moyenne /20"],
      [S.fc, "cartes révisées"],
      [icn("flame") + " " + flame(), "jours d’affilée"],
      [S.days.length, "journées bouclées"],
      [fmtH(Object.values(S.tm || {}).reduce((a, b) => a + b, 0)), "temps de travail"],
    ];
  let body = "";
  if (sec[0] == "moi") {
    const f = (lab, k, ph, mx) =>
      '<label class="f">' +
      lab +
      '</label><input type="text" maxlength="' +
      (mx || 40) +
      '" placeholder="' +
      (ph || "") +
      '" value="' +
      esc(S[k] || "") +
      '" onchange="S.' +
      k +
      '=this.value.trim();save()">';
    body =
      '<div class="c" style="text-align:center"><label class="av2 ph big" title="Changer la photo">' +
      avatar(nm) +
      '<input type="file" accept="image/*" hidden onchange="setPhoto(this)"><span class="phe">' +
      icn("edit") +
      '</span></label><div class="r" style="justify-content:center"><label class="b" style="cursor:pointer">Choisir une photo<input type="file" accept="image/*" hidden onchange="setPhoto(this)"></label>' +
      (S.photo ? '<button class="b" onclick="setPhoto(null)">Retirer</button>' : "") +
      '</div></div><div class="c">' +
      f("Prénom", "name", "Ton prénom") +
      f("Nom (facultatif)", "lname", "") +
      '<label class="f">Filière</label><select onchange="S.fil=this.value;save()"><option value="">Non précisée</option>' +
      FIL.map((x) => '<option' + (S.fil === x ? " selected" : "") + ">" + x + "</option>").join("") +
      "</select>" +
      f("Faculté", "fac", "Nancy") +
      f("Mon objectif", "bio", "Ex. : passer en médecine du premier coup", 120) +
      (SY.user && SY.role && SY.role != "admin"
        ? '<small class="hl">Ton prénom, ta photo, ta filière et un résumé de ta progression (nombre de QCM, moyenne, flamme) sont visibles par l’administrateur de l’app. Tes cours, tes notes et tes réponses ne le sont pas.</small>'
        : "") +
      "</div>";
  } else if (sec[0] == "compte") {
    body = '<div id="sybox">' + syBox() + "</div>";
    setTimeout(syInvLoad, 0);
  } else if (sec[0] == "progres")
    body =
      '<h3>Chiffres clés</h3><div class="g">' +
      tl.map((t) => '<div class="k"><b>' + t[0] + "</b><small>" + t[1] + "</small></div>").join("") +
      '</div><h3>Courbe de mes notes</h3><div class="c" id="chbox">' +
      chart() +
      "</div>" +
      radar() +
      "<h3>Maîtrise par chapitre</h3>" +
      carte()
        .replace("<h3>Maîtrise par UE</h3>", "")
        .replace("<h3>Priorités</h3>", '<div class="lb" style="margin:0 0 6px">Priorités</div>') +
      memo() +
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
      "</div>";
  else if (sec[0] == "cal") body = insight();
  else if (sec[0] == "reg") body = settings();
  else if (sec[0] == "app") body = appearance();
  else if (sec[0] == "don")
    body =
      data().replace(/^<h2>[^<]*<\/h2>/, "") +
      '<h3>Recommencer à zéro</h3><div class="c"><p class="m" style="margin-top:0">Efface tout ton contenu pour repartir d’une application vide, ou avec le contenu de démonstration.</p><button class="big ko2" onclick="resetDlg()">Réinitialiser l’application</button></div>';
  else if (sec[0] == "admin") body = SY.role == "admin" ? admin() : "";
  else if (sec[0] == "aide")
    body =
      '<div class="c"><b>Visite guidée</b><p class="m" style="margin:.3em 0 .6em">Refais le tour de l’application, écran par écran.</p><button class="b p" onclick="tutoStart(1)">Lancer la visite guidée</button></div><h3>Explications</h3><div class="pmenu">' +
      Object.keys(HELP)
        .filter((k) => k != "inv" || SY.role == "admin")
        .map(
          (k) =>
            '<button class="pmi" onclick="helpShow(\'' +
            k +
            '\')"><span class="pmic" style="font:800 16px Inter,sans-serif">?</span><span style="flex:1"><b>' +
            HELP[k][0] +
            '</b></span><span class="cv">›</span></button>',
        )
        .join("") +
      "</div>";
  return (
    '<button class="b" onclick="go(\'prof\')">← Profil</button><h2 class="ti" style="margin-top:12px">' +
    icn(sec[2]) +
    " " +
    sec[1] +
    "</h2>" +
    body
  );
}
