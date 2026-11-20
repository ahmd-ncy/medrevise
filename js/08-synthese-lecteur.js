function openSyn(ch) {
  if (R.run) return;
  clearInterval(IV);
  tab = "syn";
  R = { ch };
  render();
  scrollTo(0, 0);
}
function synData(ch) {
  const c = CH(ch),
    m = M(c.mid),
    lv = S.courses.filter((x) => x.ch === ch),
    t = S.cs[ch],
    hl = lv.flatMap((x) => (x.hl || []).map((h) => ({ ...h, cid: x.id }))),
    ar = lv
      .map((x) => {
        const L = (x.texte || "").split("\n"),
          i = L.findIndex((l) => /^# .*retenir/i.test(l));
        if (i < 0) return "";
        const o = [];
        for (let j = i + 1; j < L.length && !L[j].startsWith("# "); j++) o.push(L[j]);
        return o.join("\n");
      })
      .filter(Boolean),
    er = S.err.map((id) => S.qcm.find((q) => q.id === id)).filter((q) => q && q.ch === ch),
    dc = S.cards.filter((x) => x.ch === ch && x.lap && !x.oc).sort((a, b) => b.lap - a.lap),
    nt = lv.filter((x) => x.nt);
  return { c, m, lv, t, hl, ar, er, dc, nt };
}
function syn() {
  const ch = R.ch;
  if (!S.chap.some((x) => x.id === ch)) {
    tab = "cours";
    return list();
  }
  const { c, m, lv, t, hl, ar, er, dc, nt } = synData(ch);
  return (
    '<button class="b" onclick="go(\'cours\')">← Tous les cours</button><div class="art" style="--sc:' +
    m.couleur +
    '"><span class="un">' +
    esc(m.nom) +
    ' · fiche de synthèse</span><h1 class="at">' +
    esc(c.titre) +
    '</h1><div class="meta"><span>' +
    (t && t.n
      ? Math.round((t.ok / t.n) * 100) + " % de réussite (" + t.n + " réponses)"
      : "pas encore testé") +
    "</span>" +
    jBadge(ch) +
    '<span class="fsz"><button class="b" onclick="synExp(\'' +
    ch +
    '\')">Exporter la fiche</button></span></div></div><p id="msg" class="m" role="status"></p>' +
    "<h3>Livrets</h3>" +
    (lv
      .map(
        (x) =>
          '<button class="rs" style="--sc:' +
          m.couleur +
          '" onclick="openAt(\'' +
          x.id +
          "'," +
          ((S.pp || {})[x.id] || 1) +
          ')">' +
          icn("file") +
          "<span>" +
          esc(x.titre) +
          "</span></button>",
      )
      .join("") || '<p class="m">Aucun livret.</p>') +
    (ar.length
      ? "<h3>À retenir</h3>" +
        ar
          .map((a) => '<div class="c rd" style="font-size:16px;--sc:' + m.couleur + '">' + md(a) + "</div>")
          .join("")
      : "") +
    "<h3>Surlignages (" +
    hl.length +
    ")</h3>" +
    (hl.length
      ? '<div class="c">' +
        hl
          .sort((a, b) => a.p - b.p)
          .map(
            (h) =>
              '<div class="hl1"><button class="b" onclick="openAt(\'' +
              h.cid +
              "'," +
              h.p +
              ')">p. ' +
              h.p +
              '</button><span style="flex:1"><mark>' +
              esc(h.t) +
              "</mark>" +
              (h.n ? "<br><small>" + esc(h.n) + "</small>" : "") +
              "</span></div>",
          )
          .join("") +
        "</div>"
      : '<p class="m">Surligne des passages dans tes PDF : ils apparaîtront ici.</p>') +
    (nt.length
      ? "<h3>Mes notes</h3>" +
        nt
          .map(
            (x) =>
              '<div class="c"><b>' +
              esc(x.titre) +
              '</b><p class="t" style="margin:.4em 0 0">' +
              esc(x.nt) +
              "</p></div>",
          )
          .join("")
      : "") +
    "<h3>Erreurs en attente (" +
    er.length +
    ")</h3>" +
    (er
      .map(
        (q) =>
          '<div class="c rv"><b>' +
          esc(q.enonce) +
          "</b><br><small>Vraies : " +
          esc(
            q.props
              .filter((p) => p.ok)
              .map((p) => p.t)
              .join(" · "),
          ) +
          "</small></div>",
      )
      .join("") || '<p class="m">Aucune.</p>') +
    "<h3>Cartes difficiles (" +
    dc.length +
    ")</h3>" +
    (dc
      .map(
        (x) => '<div class="c rv g"><b>' + esc(x.recto) + "</b><br><small>" + esc(x.verso) + "</small></div>",
      )
      .join("") || '<p class="m">Aucune.</p>') +
    '<div class="r"><button class="b p" onclick="qs(\'c:' +
    ch +
    "')\">QCM du chapitre</button><button class=\"b\" onclick=\"go('cards');R.f='c:" +
    ch +
    "';R.due=false;render()\">Cartes du chapitre</button></div>"
  );
}
async function synExp(ch) {
  const { c, m, hl, ar, er, dc, nt } = synData(ch),
    tx =
      "# " +
      c.titre +
      " (" +
      m.nom +
      ")\n\n" +
      (ar.length ? "## À retenir\n" + ar.join("\n") + "\n\n" : "") +
      (hl.length
        ? "## Surlignages\n" +
          hl.map((h) => "- (p. " + h.p + ") " + h.t + (h.n ? " — " + h.n : "")).join("\n") +
          "\n\n"
        : "") +
      (nt.length ? "## Notes\n" + nt.map((x) => x.nt).join("\n\n") + "\n\n" : "") +
      (er.length
        ? "## Erreurs à revoir\n" +
          er
            .map(
              (q) =>
                "- " +
                q.enonce +
                " → " +
                q.props
                  .filter((p) => p.ok)
                  .map((p) => p.t)
                  .join(" ; "),
            )
            .join("\n") +
          "\n\n"
        : "") +
      (dc.length
        ? "## Cartes difficiles\n" + dc.map((x) => "- " + x.recto + " → " + x.verso).join("\n") + "\n"
        : ""),
    say = (t) => {
      if ($("msg")) $("msg").textContent = t;
    };
  if (await dlFile("fiche-" + c.titre.replace(/[^\w\u00C0-\u017F]+/g, "-").slice(0, 40) + ".md", tx, "text/markdown"))
    return say("Fiche enregistrée.");
  try {
    await navigator.clipboard.writeText(tx);
    say("Téléchargement indisponible ici : la fiche est copiée, colle-la dans une note.");
  } catch (e) {
    say("Export indisponible ici.");
  }
}
// ---- lecteur : zoom, plein écran, notes ----
let PZ = 1;
function pz(d) {
  PZ = Math.min(3, Math.max(1, PZ + d * 0.5));
  const w = $("pgw");
  if (!w) return;
  w.style.width = PZ * 100 + "%";
  $("pzl").textContent = PZ * 100 + " %";
  pdfGo((S.pp || {})[PD.id] || 1);
}
function pfs(force) {
  const on = document.body.classList.toggle("pf", force);
  document.body.classList.remove("pfh");
  // vrai plein écran du navigateur quand il existe (Android, ordinateur) : cache aussi les barres du navigateur
  const fe = document.fullscreenElement || document.webkitFullscreenElement;
  try {
    if (on && !fe) {
      const d = document.documentElement,
        rq = d.requestFullscreen || d.webkitRequestFullscreen;
      if (rq) Promise.resolve(rq.call(d)).catch(() => {});
    } else if (!on && fe) {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) Promise.resolve(ex.call(document)).catch(() => {});
    }
  } catch (e) {}
  if (PD) pdfGo((S.pp || {})[PD.id] || 1);
}
// sortie du plein écran par le geste « retour » ou la touche Échap : on quitte aussi le mode lecture
["fullscreenchange", "webkitfullscreenchange"].forEach((ev) =>
  document.addEventListener(ev, () => {
    if (!(document.fullscreenElement || document.webkitFullscreenElement) && document.body.classList.contains("pf")) pfs(false);
  }),
);

const CNT = (v) => {
  const c = S.courses.find((x) => x.id === R.id);
  if (c) {
    c.nt = v;
    clearTimeout(CNT.t);
    CNT.t = setTimeout(save, 600);
  }
};
