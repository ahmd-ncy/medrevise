// ================= Un en-tête qui a son propre caractère pour chaque page =================
// Flashcards : un paquet de cartes · QCM : la copie d'examen · Erreurs : le carnet · Planning : le compte à rebours
function pageHero(t) {
  const pl = (n, a, b) => n + " " + (n > 1 ? b : a);
  if (t == "cards") {
    const ct = cardsToday(),
      n = ct.all.length,
      min = Math.max(1, Math.round(n * 0.25));
    return (
      '<div class="fdk"><div class="fdkt"><span class="fdkk">Flashcards ' + helpBtn("fsrs") + "</span>" +
      "<h1>" + (n ? pl(n, "carte", "cartes") + " pour aujourd’hui" : "Tout est révisé ✓") + "</h1>" +
      "<p>" + (n ? pl(ct.rev.length, "à revoir", "à revoir") + " · " + pl(ct.nw.length, "nouvelle", "nouvelles") + " · environ " + min + " min" : "Reviens demain, ou révise toutes les cartes d’un sujet ci-dessous.") + "</p>" +
      (n ? '<button class="fdkgo" onclick="R.f=\'\';R.due=true;start(\'cards\')">' + icn("play") + " Réviser maintenant</button>" : "") +
      '</div><div class="fdks" aria-hidden="true"><i></i><i></i><div class="fdkc"><small>Question</small><b>' + (n || "✓") + "</b><em>" + (n ? "à retourner" : "à jour") + "</em></div></div></div>"
    );
  }
  if (t == "qcm") {
    const st = stats(),
      qd = qcmDue().length,
      m = R.mode || "train",
      MO = [
        ["train", "grad", "Entraînement", "Correction après chaque question"],
        ["exam", "exam", "Examen blanc", "Note /20 et correction à la fin"],
        ["vf", "check", "Vrai ou faux", "Chaque proposition jugée seule"],
      ];
    return (
      '<div class="qex"><div class="qexh"><div><span class="qexk">Épreuve de QCM</span><h1>' + (S.qcm.length ? pl(S.qcm.length, "question", "questions") + " à ta disposition" : "Aucun QCM pour l’instant") + "</h1>" +
      "<p>" + (qd ? pl(qd, "question à revoir", "questions à revoir") + " aujourd’hui · " : "") + "moyenne " + st.moy + "/20 sur " + st.n + " réponses</p></div>" +
      '<div class="qexs" title="Ta moyenne"><b>' + String(st.moy).replace(".", ",") + "</b><small>/20</small></div></div>" +
      '<div class="qexm">' +
      MO.map((x) => '<button class="' + (m == x[0] ? "on" : "") + '" onclick="cm(\'' + x[0] + "')\">" + icn(x[1]) + "<b>" + x[2] + "</b><small>" + x[3] + "</small></button>").join("") +
      "</div></div>"
    );
  }
  if (t == "err") {
    const n = S.err.length;
    return (
      '<div class="enb"><div class="enbr" aria-hidden="true">' + "<i></i>".repeat(7) + '</div><div class="enbt"><span class="enbk">Mon carnet ' + helpBtn("err") + "</span><h1>Carnet d’erreurs</h1>" +
      "<p>" + (n ? pl(n, "question ratée t’attend", "questions ratées t’attendent") + ". C’est là que tu gagnes le plus de points." : "Aucune erreur en attente : une question réussie sans faute sort du carnet.") + "</p></div>" +
      '<div class="enbn"><b>' + n + "</b><small>à corriger</small></div></div>"
    );
  }
  if (t == "plan") {
    const ex = S.exam && S.exam >= day() ? S.exam : null,
      jr = ex ? Math.ceil((new Date(ex) - new Date(day())) / 864e5) : null,
      starts = Object.values(S.jm || {}).map((x) => x.j0).filter(Boolean).sort(),
      d0 = starts[0] || day(),
      span = ex ? Math.max(1, (new Date(ex) - new Date(d0)) / 864e5) : 1,
      p = ex ? Math.min(1, Math.max(0, (new Date(day()) - new Date(d0)) / 864e5 / span)) : 0,
      started = S.chap.filter((c) => S.jm[c.id]).length,
      D = S.chap.length ? jPlan(1).days[0] : null;
    return (
      '<div class="pcd"><div class="pcdt"><span class="pcdk">Planning · méthode des J ' + helpBtn("j") + "</span>" +
      (ex
        ? '<div class="pcdn"><b>' + (jr ? jr : "J") + "</b><span>" + (jr ? "jour" + (jr > 1 ? "s" : "") + "<br>avant le concours" : "C’est le jour J,<br>courage !") + "</span></div>" +
          "<p>" + new Date(ex + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "</p>" +
          '<div class="pcdb"><i style="width:' + Math.round(p * 100) + '%"></i></div><small>' + Math.round(p * 100) + " % du chemin parcouru · " + started + "/" + S.chap.length + " chapitres commencés</small>"
        : '<h1>Ton planning</h1><p>Ajoute la date de ton concours pour voir le compte à rebours.</p><button class="b" onclick="profGo(\'reg\')">Régler la date</button>') +
      "</div>" +
      (D ? '<div class="pcdd"><small>Aujourd’hui</small><b>' + D.neu.length + "</b><span>nouveau" + (D.neu.length > 1 ? "x" : "") + "</span><b>" + D.rev.length + "</b><span>rappel" + (D.rev.length > 1 ? "s" : "") + "</span></div>" : "") +
      "</div>"
    );
  }
  return null;
}
