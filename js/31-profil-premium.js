// ================= Profil « premium » : anneaux du jour, calendrier d'activité, records, badges, réglages =================
// et en-tête de la page « Ma progression » (résumé de la semaine, points faibles).

const PR_RING = ["#ff375f", "#30d158", "#0a84ff"];

// série la plus longue de journées bouclées
function prBestStreak() {
  const d = [...new Set(S.days || [])].sort();
  let best = 0,
    cur = 0,
    prev = null;
  for (const x of d) {
    cur = prev && (new Date(x) - new Date(prev)) / 864e5 === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = x;
  }
  return Math.max(best, flame());
}
const prSum = (o, days) => days.reduce((a, d) => a + ((o || {})[d] || 0), 0);
const prDays = (n, off) => [...Array(n)].map((_, i) => day(i - n + 1 - (off || 0)));

// trois anneaux concentriques façon montre : un par objectif du jour
function prRings() {
  const d = dd(),
    o = d.o.slice(0, 3);
  if (!o.length)
    return '<div class="prc prrw"><div><b>Objectifs du jour</b><p class="m">Pas d’objectif aujourd’hui : ajoute du contenu ou un planning pour en recevoir.</p></div></div>';
  const R0 = 52,
    W = 13,
    rings = o
      .map(([t, n], i) => {
        const v = Math.min(OBJ[t].v(d), n),
          p = n ? v / n : 0,
          r = R0 - i * (W + 3),
          C = 2 * Math.PI * r,
          col = PR_RING[i];
        return (
          '<circle cx="64" cy="64" r="' + r + '" fill="none" stroke="' + col + '" stroke-opacity=".22" stroke-width="' + W + '"/>' +
          '<circle cx="64" cy="64" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + W + '" stroke-linecap="round" stroke-dasharray="' +
          C + '" stroke-dashoffset="' + C * (1 - p) + '" transform="rotate(-90 64 64)" class="prra"/>'
        );
      })
      .join(""),
    leg = o
      .map(([t, n], i) => {
        const v = Math.min(OBJ[t].v(d), n);
        return (
          '<button class="prl" onclick="' + OBJ[t].go + '"><i style="background:' + PR_RING[i] + '"></i><span><b>' + esc(OBJ[t].l(n)) + "</b><small>" + v + " / " + n +
          (v >= n ? " · fait ✓" : "") + "</small></span></button>"
        );
      })
      .join(""),
    done = o.filter(([t, n]) => OBJ[t].v(d) >= n).length;
  return (
    '<div class="prc prrw"><svg viewBox="0 0 128 128" class="prr" aria-hidden="true">' + rings + "</svg>" +
    '<div class="prlg"><b>Aujourd’hui</b><small class="m">' + (done == o.length ? "Journée bouclée, bravo 🎉" : done + " objectif" + (done > 1 ? "s" : "") + " sur " + o.length) + "</small>" + leg + "</div></div>"
  );
}

// calendrier d'activité des 20 dernières semaines
function prHeat() {
  const weeks = 20,
    today = new Date(day() + "T12:00"),
    start = new Date(today);
  start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - (weeks - 1) * 7); // lundi, 20 semaines plus tôt
  const cells = [],
    mx = Math.max(10, ...Object.values(S.act || {}));
  let total = 0,
    active = 0;
  for (let i = 0; i < weeks * 7; i++) {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    const k = dt.toISOString().slice(0, 10),
      v = (S.act || {})[k] || 0,
      fut = dt > today,
      lv = fut ? -1 : v === 0 ? 0 : Math.min(4, 1 + Math.floor((v / mx) * 4));
    if (!fut) {
      total += v;
      if (v) active++;
    }
    cells.push('<i class="h' + lv + '" title="' + dShort(k) + " : " + v + ' réponse' + (v > 1 ? "s" : "") + '"></i>');
  }
  return (
    '<div class="prc"><div class="prh"><b>Régularité</b><small class="m">' + active + " jour" + (active > 1 ? "s" : "") + " actifs · " + total + " réponses en 20 semaines</small></div>" +
    '<div class="prheat">' + cells.join("") + '</div><div class="prhl"><small class="m">Moins</small><i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><small class="m">Plus</small></div></div>'
  );
}

function prRecords() {
  const tm = Object.values(S.tm || {}).reduce((a, b) => a + b, 0),
    bestDay = Math.max(0, ...Object.values(S.act || {})),
    best = S.hist.length ? Math.max(...S.hist.map((h) => h.s)) : null,
    R = [
      ["flame", prBestStreak() + " j", "meilleure série", "#ff9f0a"],
      ["target", best === null ? "–" : String(Math.round(best * 10) / 10).replace(".", ",") + "/20", "meilleure note", "#0a84ff"],
      ["spark", bestDay, "réponses en un jour", "#bf5af2"],
      ["clock", fmtH(tm), "de travail au total", "#30d158"],
    ];
  return (
    '<div class="prc"><div class="prh"><b>Records</b></div><div class="prrec">' +
    R.map((r) => '<div><span class="pric" style="--k:' + r[3] + '">' + icn(r[0]) + "</span><b>" + r[1] + "</b><small>" + r[2] + "</small></div>").join("") +
    "</div></div>"
  );
}

function prBadges() {
  const st = stats(),
    tm = Object.values(S.tm || {}).reduce((a, b) => a + b, 0),
    bs = prBestStreak(),
    started = Object.keys(S.jm || {}).length,
    best = S.hist.length ? Math.max(...S.hist.map((h) => h.s)) : 0,
    atl = ((S.atq || {}).hist || []).length,
    B = [
      ["🔥", "Une semaine", "7 jours d’affilée", bs, 7],
      ["🌋", "Un mois", "30 jours d’affilée", bs, 30],
      ["✅", "Centurion", "100 QCM répondus", st.n, 100],
      ["🏆", "Marathonien", "1 000 QCM répondus", st.n, 1000],
      ["🃏", "Mémoire vive", "500 cartes révisées", S.fc || 0, 500],
      ["🎯", "Sans faute ou presque", "Une session à 16/20 ou plus", best >= 16 ? 1 : 0, 1],
      ["📚", "Lancé", "10 chapitres commencés", started, 10],
      ["⏱️", "Dix heures", "10 h de travail", Math.floor(tm / 3600), 10],
      ["🫀", "Anatomiste", "10 quiz dans l’atlas 3D", atl, 10],
    ],
    got = B.filter((b) => b[3] >= b[4]).length;
  return (
    '<div class="prc"><div class="prh"><b>Badges</b><small class="m">' + got + " / " + B.length + " obtenus</small></div><div class=\"prbad\">" +
    B.map((b) => {
      const ok = b[3] >= b[4],
        p = Math.min(1, b[3] / b[4]);
      return (
        '<div class="prb' + (ok ? " ok" : "") + '" title="' + esc(b[2]) + '"><span>' + b[0] + "</span><b>" + esc(b[1]) + "</b><small>" + esc(b[2]) + "</small>" +
        (ok ? "" : '<i><em style="width:' + p * 100 + '%"></em></i>') + "</div>"
      );
    }).join("") +
    "</div></div>"
  );
}

// réglages : liste groupée façon iOS
const PR_GROUPS = [
  ["Compte", ["moi", "compte"]],
  ["Suivi", ["progres", "cal"]],
  ["Application", ["reg", "app", "don"]],
  ["", ["aide", "admin"]],
];
const PR_ICOL = { moi: "#0a84ff", compte: "#30b0c7", progres: "#bf5af2", cal: "#ff9f0a", reg: "#8e8e93", app: "#ff375f", don: "#30d158", aide: "#5e5ce6", admin: "#ff453a" };
function prSettings() {
  return (
    '<div class="prset">' +
    PR_GROUPS.map(([t, ks]) => {
      const rows = ks
        .map((k) => PSEC.find((x) => x[0] == k))
        .filter((x) => x && (!x[4] || x[4]()));
      if (!rows.length) return "";
      return (
        (t ? '<div class="prsh">' + t + "</div>" : '<div class="prsh"></div>') +
        '<div class="prsg">' +
        rows
          .map(
            ([k, tt, ic, sub]) =>
              '<button class="prsr" onclick="R.ps=\'' + k + '\';render();scrollTo(0,0)"><span class="prsi" style="background:' + (PR_ICOL[k] || "#8e8e93") + '">' + icn(ic) +
              "</span><span class=\"prst\"><b>" + tt + "</b><small>" + esc(sub()) + '</small></span><span class="prsc">›</span></button>',
          )
          .join("") +
        "</div>"
      );
    }).join("") +
    "</div>"
  );
}

function profHome() {
  const st = stats(),
    nm = S.name || "Étudiant·e",
    jr = S.exam ? Math.ceil((new Date(S.exam) - new Date(day())) / 864e5) : null,
    tm = Object.values(S.tm || {}).reduce((a, b) => a + b, 0);
  return (
    '<div class="pcov"><div class="pcbg" style="' + banCss(S.ban) + '"><button class="banb" onclick="R.banp=!R.banp;render()" aria-label="Changer la bannière">' + icn("image") + " Bannière</button></div>" +
    '<label class="av2 ph pcav" title="Changer la photo de profil">' + avatar(nm) + '<input type="file" accept="image/*" hidden onchange="setPhoto(this)"><span class="phe">' + icn("edit") + "</span></label>" +
    '<div class="pcin"><h2>' + esc(nm + (S.lname ? " " + S.lname : "")) + '</h2><div class="pcch">' +
    [S.fil, S.fac ? "Fac de " + S.fac : "", jr !== null && jr >= 0 ? "J-" + jr + " avant le concours" : ""].filter(Boolean).map((x) => "<span>" + esc(x) + "</span>").join("") +
    (S.gel && S.gel.has ? '<span class="gelp">❄ gel dispo</span>' : "") + "</div>" +
    (S.bio ? '<p class="pcq">« ' + esc(S.bio) + " »</p>" : "") +
    '<div class="r" style="justify-content:center"><button class="b" onclick="R.ps=\'moi\';render()">' + icn("edit") + " Modifier le profil</button>" +
    '<button class="b" onclick="R.ps=\'reglages\';render();scrollTo(0,0)">' + icn("gear") + " Réglages</button></div></div>" +
    (R.banp ? banPick() : "") + "</div>" +
    '<div class="prkpi">' +
    [
      [flame(), "jour" + (flame() > 1 ? "s" : "") + " d’affilée", "#ff9f0a"],
      [st.n, "QCM répondus", "#bf5af2"],
      [st.moy, "moyenne /20", "#0a84ff"],
      [S.fc || 0, "cartes révisées", "#30d158"],
      [fmtH(tm), "de travail", "#30b0c7"],
    ]
      .map((k) => '<div style="--k:' + k[2] + '"><b>' + k[0] + "</b><small>" + k[1] + "</small></div>")
      .join("") +
    "</div>" +
    prRings() +
    '<div class="prgrid">' + prHeat() + prRecords() + "</div>" +
    prBadges() +
    '<h3 class="prt">Réglages</h3>' +
    prSettings()
  );
}

// ---------- page « Ma progression » : résumé de la semaine et points faibles ----------
function progHead() {
  const w1 = prDays(7),
    w0 = prDays(7, 7),
    q1 = prSum(S.act, w1),
    q0 = prSum(S.act, w0),
    t1 = prSum(S.tm, w1),
    t0 = prSum(S.tm, w0),
    h1 = S.hist.filter((h) => w1.includes(h.d)),
    h0 = S.hist.filter((h) => w0.includes(h.d)),
    m1 = h1.length ? h1.reduce((a, h) => a + h.s, 0) / h1.length : null,
    m0 = h0.length ? h0.reduce((a, h) => a + h.s, 0) / h0.length : null,
    ok = Object.values(S.ms || {}).reduce((a, x) => a + (x.ok || 0), 0),
    nn = Object.values(S.ms || {}).reduce((a, x) => a + (x.n || 0), 0),
    st = stats(),
    moy = st.moy === "–" ? null : +st.moy,
    C = 2 * Math.PI * 34,
    delta = (a, b, fmt) => {
      if (b === null || b === undefined || (!a && !b)) return "";
      const d = a - b;
      if (Math.abs(d) < 1e-9) return '<em class="prd">= semaine passée</em>';
      return '<em class="prd ' + (d > 0 ? "up" : "dn") + '">' + (d > 0 ? "▲ " : "▼ ") + fmt(Math.abs(d)) + " vs semaine passée</em>";
    },
    weak = S.chap
      .map((c) => ({ c, t: S.cs[c.id] }))
      .filter((x) => x.t && x.t.n >= 3)
      .map((x) => ({ ...x, p: x.t.ok / x.t.n }))
      .sort((a, b) => a.p - b.p)
      .slice(0, 5);
  return (
    '<div class="prhero"><div class="prgauge"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="8"/>' +
    '<circle cx="40" cy="40" r="34" fill="none" stroke="var(--pa, var(--ac))" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' +
    C * (1 - (moy || 0) / 20) + '" transform="rotate(-90 40 40)" class="prra"/></svg><span><b>' + (moy === null ? "–" : String(moy).replace(".", ",")) + "</b><small>/20</small></span></div>" +
    '<div class="prhs"><b>Ta moyenne aux QCM</b><small class="m">' + (nn ? Math.round((ok / nn) * 100) + " % de bonnes réponses sur " + nn + " questions" : "Réponds à des QCM pour voir ta moyenne.") + "</small>" +
    delta(m1 || 0, m0, (x) => String(Math.round(x * 10) / 10).replace(".", ",") + " pt") + "</div></div>" +
    '<div class="prweek"><div><small class="m">Cette semaine</small><b>' + q1 + "</b><small>réponses</small>" + delta(q1, q0, (x) => x) + "</div>" +
    "<div><small class=\"m\">Cette semaine</small><b>" + fmtH(t1) + "</b><small>de travail</small>" + delta(t1, t0, fmtH) + "</div>" +
    "<div><small class=\"m\">Cette semaine</small><b>" + h1.length + "</b><small>session" + (h1.length > 1 ? "s" : "") + "</small>" + delta(h1.length, h0.length, (x) => x) + "</div></div>" +
    (weak.length
      ? '<h3>À retravailler en priorité</h3><div class="prc prweak">' +
        weak
          .map(
            (x) =>
              '<div class="prwr"><span class="prwd" style="background:' + (M(x.c.mid).couleur || "var(--ac)") + '"></span><span class="prwt"><b>' + esc(x.c.titre) + "</b><small>" + esc(M(x.c.mid).nom) + " · " +
              x.t.n + ' questions</small><span class="prwb"><i style="width:' + Math.round(x.p * 100) + "%;background:" + (x.p < 0.5 ? "#ff453a" : x.p < 0.7 ? "#ff9f0a" : "#30d158") + '"></i></span></span><b class="prwp">' +
              Math.round(x.p * 100) + ' %</b><button class="b p" onclick="qs(\'c:' + x.c.id + "')\">Réviser</button></div>",
          )
          .join("") +
        "</div>"
      : "")
  );
}
