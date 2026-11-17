let CM = 0,
  CD = "";
const scm = (d) => {
    CM += d;
    $("calbox").innerHTML = cal();
  },
  scd = (d) => {
    CD = d;
    $("calbox").innerHTML = cal();
  };
function cal() {
  const b = new Date();
  b.setDate(1);
  b.setMonth(b.getMonth() + CM);
  const y = b.getFullYear(),
    mo = b.getMonth(),
    first = (b.getDay() + 6) % 7,
    nd = new Date(y, mo + 1, 0).getDate(),
    td = day(),
    ds = (d) => y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"),
    sel = CD || td,
    jd = (dt) =>
      S.chap.filter((c) => S.jm[c.id] && (S.jm[c.id].next === dt || (dt === td && S.jm[c.id].next < td)));
  let g = "";
  for (let i = 0; i < first; i++) g += "<span></span>";
  for (let d = 1; d <= nd; d++) {
    const dt = ds(d),
      n = S.act[dt] || 0,
      j = dt >= td ? jd(dt).length : 0;
    g +=
      '<button class="cd' +
      (n ? (n < 10 ? " l1" : n < 30 ? " l2" : " l3") : "") +
      (dt === td ? " td" : "") +
      (dt === sel ? " sel" : "") +
      '" onclick="scd(\'' +
      dt +
      '\')" aria-label="' +
      dlab(dt) +
      '">' +
      d +
      '<span class="mk">' +
      (S.days.includes(dt) ? '<i class="q1"></i>' : "") +
      (j ? '<i class="q2"></i>' : "") +
      (S.exam === dt ? '<i class="q3"></i>' : "") +
      "</span></button>";
  }
  const hs = S.hist.filter((h) => h.d === sel),
    js = sel >= td ? jd(sel) : [],
    n = S.act[sel] || 0;
  return (
    '<div class="pnav" style="margin-top:0"><button class="b" onclick="scm(-1)" aria-label="Mois précédent">←</button><b style="text-transform:capitalize">' +
    b.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) +
    '</b><button class="b" onclick="scm(1)" aria-label="Mois suivant">→</button></div><div class="cg cgh">' +
    ["L", "M", "M", "J", "V", "S", "D"].map((x) => "<span>" + x + "</span>").join("") +
    '</div><div class="cg">' +
    g +
    "</div>" +
    '<div class="r" style="font-size:13px;color:var(--mut);gap:12px"><span><i class="lgd"></i> jour travaillé</span><span><i class="dot q1"></i> journée bouclée</span><span><i class="dot q2"></i> rappel de la méthode des J</span><span><i class="dot q3"></i> concours</span></div>' +
    '<div class="cdd"><b>' +
    dlab(sel).replace(/^./, (x) => x.toUpperCase()) +
    "</b>" +
    (sel === td ? " · aujourd’hui" : "") +
    (sel > td
      ? ""
      : "<br><small>" +
        (n ? n + " réponse" + (n > 1 ? "s" : "") + " (QCM et cartes)" : "Aucune activité") +
        (S.days.includes(sel) ? " · journée bouclée" : "") +
        ((S.tm || {})[sel] ? " · " + fmtH(S.tm[sel]) + " de travail" : "") +
        "</small>") +
    hs
      .map(
        (h) =>
          '<div class="ln" style="cursor:default;padding-left:0"><span>Session de QCM' +
          (h.t
            ? " à " + new Date(h.t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : "") +
          "</span><i></i><b>" +
          pf(h.s) +
          "/20</b></div>",
      )
      .join("") +
    (js.length
      ? '<div style="margin-top:6px"><small>Rappels prévus :</small> ' +
        js.map((c) => '<span class="tag">' + esc(c.titre) + " · " + jLab(S.jm[c.id].k) + "</span>").join("") +
        "</div>"
      : "") +
    (S.exam === sel
      ? '<div style="margin-top:6px"><span class="tag" style="background:var(--kob);color:var(--ko)">Jour du concours</span></div>'
      : "") +
    "</div>"
  );
}
function radar() {
  if (!S.mat.length) return "";
  const n = S.mat.length,
    cx = 150,
    cy = 120,
    r = 82,
    pt = (i, v) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
    },
    val = (m) => {
      const x = S.ms[m.id];
      return x && x.n ? x.ok / x.n : 0;
    },
    pl = (v) =>
      S.mat
        .map((m, i) =>
          pt(i, typeof v == "function" ? v(m) : v)
            .map((x) => x.toFixed(1))
            .join(","),
        )
        .join(" ");
  return (
    '<h3>Profil par UE</h3><div class="c">' +
    (n >= 3
      ? '<svg viewBox="0 0 300 240" width="100%" style="max-width:420px;display:block;margin:auto" role="img" aria-label="Réussite par UE">' +
        [0.25, 0.5, 0.75, 1]
          .map((v) => '<polygon points="' + pl(v) + '" fill="none" stroke="var(--bd)"/>')
          .join("") +
        S.mat
          .map((m, i) => {
            const p = pt(i, 1),
              l = pt(i, 1.24);
            return (
              '<line x1="' +
              cx +
              '" y1="' +
              cy +
              '" x2="' +
              p[0].toFixed(1) +
              '" y2="' +
              p[1].toFixed(1) +
              '" stroke="var(--bd)"/><text x="' +
              l[0].toFixed(1) +
              '" y="' +
              (l[1] + 3).toFixed(1) +
              '" font-size="10" text-anchor="middle" fill="var(--mut)">' +
              esc(m.nom.slice(0, 14)) +
              "</text>"
            );
          })
          .join("") +
        '<polygon points="' +
        pl(val) +
        '" fill="var(--ac)" fill-opacity=".22" stroke="var(--ac)" stroke-width="2.5" stroke-linejoin="round"/>' +
        S.mat
          .map((m, i) => {
            const p = pt(i, val(m));
            return (
              '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="var(--ac)"/>'
            );
          })
          .join("") +
        "</svg>"
      : "") +
    S.mat
      .map((m) => {
        const x = S.ms[m.id];
        return (
          '<div class="ln" style="cursor:default;padding-left:0"><span>' +
          ICO(m) +
          " " +
          esc(m.nom) +
          "</span><i></i><small>" +
          (x && x.n ? Math.round((x.ok / x.n) * 100) + " % de réussite" : "pas encore testée") +
          " · " +
          fmtH((S.tu || {})[m.id] || 0) +
          "</small></div>"
        );
      })
      .join("") +
    (n >= 3
      ? '<small style="display:block;margin-top:8px">Plus la forme s’étend vers une UE, mieux tu la réussis.</small>'
      : "") +
    "</div>"
  );
}
function memo() {
  if (!S.cards.length) return "";
  const td = day(),
    nw = S.cards.filter((c) => !c.due).length,
    ac = S.cards.filter(fsAcq).length,
    ln = S.cards.length - nw - ac,
    dn = [...Array(30)].map(
      (_, i) => S.cards.filter((c) => c.due && (i ? c.due === day(i) : c.due <= td)).length + (i ? 0 : nw),
    ),
    mx = Math.max(1, ...dn);
  return (
    '<h3>Mémorisation des cartes</h3><div class="c"><div class="stk"><i style="flex:' +
    ac +
    ';background:var(--ok)"></i><i style="flex:' +
    ln +
    ';background:var(--wn)"></i><i style="flex:' +
    nw +
    ';background:var(--mut)"></i></div><div class="r" style="font-size:13px;gap:14px;margin-top:6px"><span><i class="dot" style="background:var(--ok)"></i> ' +
    ac +
    ' acquises</span><span><i class="dot" style="background:var(--wn)"></i> ' +
    ln +
    ' en cours</span><span><i class="dot" style="background:var(--mut)"></i> ' +
    nw +
    ' nouvelles</span></div><h4 style="margin-top:14px">Cartes à réviser sur 30 jours</h4><svg viewBox="0 0 360 110" width="100%" role="img" aria-label="Nombre de cartes à réviser par jour sur 30 jours">' +
    dn
      .map(
        (v, i) =>
          '<rect x="' +
          (4 + i * 11.8).toFixed(1) +
          '" y="' +
          (88 - (v / mx) * 78).toFixed(1) +
          '" width="9" height="' +
          (v ? Math.max(2, (v / mx) * 78) : 0).toFixed(1) +
          '" rx="2" fill="' +
          (i ? "var(--ac)" : "var(--ko)") +
          '"><title>' +
          (i ? dShort(day(i)) : "Aujourd’hui") +
          " : " +
          v +
          "</title></rect>",
      )
      .join("") +
    '<line x1="2" x2="358" y1="88.5" y2="88.5" stroke="var(--bd)"/>' +
    [0, 7, 14, 21, 29]
      .map(
        (i) =>
          '<text x="' +
          (8.5 + i * 11.8).toFixed(1) +
          '" y="102" font-size="9" text-anchor="middle" fill="var(--mut)">' +
          (i ? dShort(day(i)) : "Auj.") +
          "</text>",
      )
      .join("") +
    '<text x="356" y="10" font-size="9" text-anchor="end" fill="var(--mut)">max ' +
    mx +
    "</text></svg><small>En rouge : à réviser aujourd’hui, cartes en retard et nouvelles comprises.</small></div>"
  );
}
function insight() {
  const sz = S.seuil ?? 7,
    av = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const est = S.mat
    .map((m) => {
      const r = S.rc[m.id] || [],
        e = r.length >= 5 ? av(r) * 20 : null;
      return (
        '<div class="ln" style="cursor:default;padding-left:0"><span>' +
        ICO(m) +
        " " +
        esc(m.nom) +
        '</span><i></i><b style="color:' +
        (e === null ? "var(--mut)" : e < sz ? "var(--ko)" : "var(--fg)") +
        '">' +
        (e === null
          ? "pas assez de données"
          : pf(e.toFixed(1)) + "/20" + (e < sz ? " " + icn("alert") + "" : "")) +
        "</b></div>"
      );
    })
    .join("");
  const cfl = [
    ["s", "Sûr(e)"],
    ["h", "Hésitant(e)"],
    ["a", "Au hasard"],
  ]
    .map(([k, l]) => {
      const c = S.cf[k];
      return c
        ? '<span class="tag">' + l + " : " + Math.round((c.ok / c.n) * 100) + " % réussi (" + c.n + ")</span>"
        : "";
    })
    .join("");
  const CA = {
      i: [
        "Je ne savais pas",
        "le cours n’est pas assez appris : privilégie les flashcards et une relecture ciblée.",
      ],
      c: ["Confusion", "fais des fiches comparatives et des sessions « Tout mélangé »."],
      p: ["Piège d’énoncé", "relis chaque proposition lentement : un mot comme « toujours » change tout."],
      a: ["Inattention", "entraîne-toi avec un chrono et relis chaque proposition avant de valider."],
    },
    er = Object.entries(S.er).sort((a, b) => b[1] - a[1]);
  const days = [...Array(56)]
    .map((_, i) => {
      const n = S.act[day(i - 55)] || 0;
      return (
        '<i class="' +
        (n ? (n < 10 ? "l1" : n < 30 ? "l2" : "l3") : "") +
        '" title="' +
        day(i - 55) +
        " : " +
        n +
        '"></i>'
      );
    })
    .join("");
  const w = (k) => [...Array(7)].map((_, i) => S.act[day(-i - 7 * k)] || 0),
    w0 = w(0),
    w1 = w(1),
    sm = (a) => a.reduce((x, y) => x + y, 0),
    hs = S.hist.filter((h) => h.d >= day(-6)),
    rk = S.mat
      .filter((m) => (S.rc[m.id] || []).length >= 5)
      .map((m) => [m, av(S.rc[m.id])])
      .sort((a, b) => b[1] - a[1]);
  return (
    '<div class="c"><h3>Note estimée par UE</h3><small>Moyenne de tes 40 dernières réponses, au barème choisi. Alerte sous ' +
    sz +
    "/20. C’est une estimation, pas une prédiction.</small>" +
    est +
    "</div>" +
    '<div class="c"><div id="calbox">' +
    cal() +
    '</div><h4 style="margin-top:14px">Bilan de la semaine</h4><p style="margin:.3em 0">' +
    fmtH([...Array(7)].reduce((a, _, i) => a + ((S.tm || {})[day(-i)] || 0), 0)) +
    " de travail, " +
    sm(w0) +
    " réponses sur " +
    w0.filter((x) => x).length +
    " jour(s) travaillé(s)" +
    (sm(w1) ? " (" + (sm(w0) >= sm(w1) ? "+" : "") + (sm(w0) - sm(w1)) + " vs semaine précédente)" : "") +
    "." +
    (hs.length
      ? " Moyenne des sessions : " + pf((hs.reduce((a, h) => a + h.s, 0) / hs.length).toFixed(1)) + "/20."
      : "") +
    "</p>" +
    (rk.length > 1
      ? '<p style="margin:.3em 0">Point fort : <b>' +
        esc(rk[0][0].nom) +
        "</b> · À renforcer : <b>" +
        esc(rk[rk.length - 1][0].nom) +
        "</b>.</p>"
      : "") +
    "</div>"
  );
}
