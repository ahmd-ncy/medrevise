// ================= En-têtes en widgets des pages Cours, Flashcards, QCM, Erreurs, Planning =================
function pageTop(t) {
  const W = (n, l, ic, k, fn) =>
      "<" + (fn ? 'button onclick="' + fn + '"' : "div") + ' class="hws" style="--k:' + k + '"><span class="hwsi">' + icn(ic) + "</span><b>" + n + "</b><small>" + l + "</small></" + (fn ? "button" : "div") + ">",
    sub = (x) => '<p class="m pgs">' + x + "</p>",
    pl = (n, a, b) => n + " " + (n > 1 ? b : a);
  if (t == "cours") {
    const started = Object.keys(S.jm || {}).filter((id) => S.chap.some((c) => c.id == id)).length,
      lc = S.courses.find((x) => x.id === S.lc);
    return {
      sub: sub(S.mat.length ? pl(S.mat.length, "UE", "UE") + " · " + pl(S.chap.length, "chapitre", "chapitres") + " · " + pl(S.courses.length, "livret", "livrets") : "Ajoute tes UE et tes livrets pour les retrouver ici."),
      tiles:
        '<div class="hwg pgt">' +
        W(S.mat.length, "UE", "book", "#0a84ff") +
        W(S.chap.length, "chapitres", "file", "#30b0c7") +
        W(S.chap.length ? Math.round((started / S.chap.length) * 100) + " %" : "–", "chapitres commencés", "chart", "#30d158") +
        W(S.cards.length + S.qcm.length, "cartes et QCM", "cards", "#ff9f0a") +
        (lc
          ? '<button class="hwres hw2" style="--k:' + mof(lc).couleur + "\" onclick=\"R={id:'" + lc.id + "'};render();scrollTo(0,0)\"><span class=\"hwbk\">" + icn("book") +
            '</span><span class="hwrt"><span class="hwmk">Reprendre la lecture</span><b>' + esc(lc.titre) + "</b><small>" + esc(mof(lc).nom || "") + '</small></span><span class="hwgo">' + icn("chev") + "</span></button>"
          : "") +
        "</div>",
    };
  }
  if (t == "cards") {
    const ct = cardsToday();
    return {
      sub: sub(ct.all.length ? "Tes cartes du jour t’attendent : " + pl(ct.rev.length, "à revoir", "à revoir") + " et " + pl(ct.nw.length, "nouvelle", "nouvelles") + "." : "Aucune carte à revoir aujourd’hui ✓"),
      tiles:
        '<div class="hwg pgt">' +
        W(ct.rev.length, "à revoir aujourd’hui", "clock", "#ff9f0a") +
        W(ct.nw.length, "nouvelles du jour", "spark", "#bf5af2") +
        W(S.cards.length, "cartes au total", "cards", "#0a84ff") +
        W(S.fc || 0, "révisions faites", "check", "#30d158") +
        "</div>",
    };
  }
  if (t == "qcm") {
    const st = stats(),
      qd = qcmDue().length;
    return {
      sub: sub(S.qcm.length ? pl(S.qcm.length, "question disponible", "questions disponibles") + (qd ? " · " + pl(qd, "à revoir", "à revoir") + " aujourd’hui" : "") : "Ajoute des QCM pour t’entraîner."),
      tiles:
        '<div class="hwg pgt">' +
        W(qd, "à revoir aujourd’hui", "clock", "#bf5af2", qd ? "qs('due')" : "") +
        W(st.moy, "moyenne /20", "target", "#0a84ff") +
        W(st.n, "questions répondues", "check", "#30d158") +
        W(S.err.length, "erreurs à corriger", "errors", "#ff375f", S.err.length ? "go('err')" : "") +
        "</div>",
    };
  }
  if (t == "err") {
    const weak = S.chap.filter((c) => {
        const x = S.cs[c.id];
        return x && x.n >= 3 && x.ok / x.n < 0.6;
      }).length,
      hard = S.cards.filter((c) => c.lap && !(typeof fsAcq == "function" && fsAcq(c))).length;
    return {
      sub: sub(S.err.length ? "Corrige tes erreurs : c’est là que tu gagnes le plus de points." : "Aucune erreur en attente, bravo ✓"),
      tiles: "",
    };
  }
  if (t == "plan") {
    const jr = S.exam ? Math.ceil((new Date(S.exam) - new Date(day())) / 864e5) : null,
      started = S.chap.filter((c) => S.jm[c.id]).length,
      D = S.chap.length ? jPlan(1).days[0] : null,
      rv = D ? D.rev.length : 0,
      nw = D ? D.neu.length : 0;
    return {
      sub: sub(S.chap.length ? "La méthode des J organise tes journées jusqu’au concours." : "Ajoute des chapitres pour construire ton planning."),
      tiles:
        '<div class="hwg pgt">' +
        W(jr !== null && jr >= 0 ? (jr ? "J-" + jr : "Jour J") : "–", jr !== null && jr >= 0 ? "avant le concours" : "date du concours à régler", "cal", "#0a84ff", "profGo('reg')") +
        W(started + "/" + S.chap.length, "chapitres commencés", "book", "#30d158") +
        W(nw, "nouveau" + (nw > 1 ? "x" : "") + " chapitre" + (nw > 1 ? "s" : "") + " aujourd’hui", "spark", "#ff9f0a") +
        W(rv, "rappel" + (rv > 1 ? "s" : "") + " J aujourd’hui", "clock", "#bf5af2") +
        "</div>",
    };
  }
  return null;
}
