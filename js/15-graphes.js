const tile = (x) => {
  const cl = x.p === null ? "" : x.p >= 0.75 ? "ok" : x.p >= 0.5 ? "wn" : "ko";
  return (
    '<button class="mt ' +
    cl +
    '" onclick="qs(\'c:' +
    x.c.id +
    "')\"><b>" +
    esc(x.c.titre) +
    "</b><small>" +
    (x.p === null
      ? "pas encore testé"
      : Math.round(x.p * 100) + " %" + (x.age > 14 ? " · " + icn("clock") + " " + x.age + " j" : "")) +
    "</small></button>"
  );
};

const hdt = (o) => new Date(o.t || o.d + "T12:00"),
  hfd = (o) => hdt(o).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
  hfl = (o) =>
    o.t
      ? hdt(o).toLocaleString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : hdt(o).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
let CR = 20,
  CHD = [],
  CHX = [];
const scr = (x) => {
  CR = +x;
  $("chbox").innerHTML = chart();
};
function chart() {
  const h = CR ? S.hist.slice(-CR) : S.hist.slice();
  CHD = h;
  if (!h.length) return ill("chart", "Fais une session de QCM pour voir ta progression.");
  const W = 360,
    H = 210,
    L = 26,
    Rg = 12,
    T = 12,
    B = 26,
    n = h.length,
    x = (i) => L + (n > 1 ? (i * (W - L - Rg)) / (n - 1) : (W - L - Rg) / 2),
    y = (v) => T + ((20 - v) / 20) * (H - T - B),
    av = (a) => a.reduce((p, c) => p + c, 0) / a.length,
    f = (v) => v.toFixed(1),
    cur = (P) =>
      P.map((p, i) => {
        if (!i) return "M" + f(p[0]) + " " + f(p[1]);
        const q = P[i - 1],
          mx = f((q[0] + p[0]) / 2);
        return "C" + mx + " " + f(q[1]) + " " + mx + " " + f(p[1]) + " " + f(p[0]) + " " + f(p[1]);
      }).join(""),
    P = h.map((o, i) => [x(i), y(o.s)]),
    MA = h.map((o, i) => [x(i), y(av(h.slice(Math.max(0, i - 4), i + 1).map((z) => z.s)))]),
    ln = cur(P),
    last = h[n - 1],
    moy = av(h.map((o) => o.s)),
    tr = n >= 6 ? av(h.slice(-3).map((o) => o.s)) - av(h.slice(-6, -3).map((o) => o.s)) : null,
    st = Math.ceil(n / 4);
  CHX = P.map((p) => p[0]);
  return (
    '<div class="cst"><div><small>Dernière note</small><b>' +
    pf(Math.round(last.s * 10) / 10) +
    "<small> /20</small></b></div><div><small>Moyenne</small><b>" +
    pf(f(moy)) +
    "</b></div>" +
    (tr !== null
      ? '<div><small>Tendance</small><b style="color:' +
        (tr >= 0 ? "var(--ok)" : "var(--ko)") +
        '">' +
        (tr >= 0 ? "↗ +" : "↘ ") +
        pf(f(tr)) +
        "</b></div>"
      : "") +
    "</div>" +
    chips(
      [
        [10, "10 dernières"],
        [20, "20 dernières"],
        [0, "Toutes"],
      ],
      CR,
      "scr",
    ) +
    '<div class="chw"><svg viewBox="0 0 ' +
    W +
    " " +
    H +
    '" width="100%" role="img" aria-label="Notes sur 20 de tes sessions de QCM" style="touch-action:pan-y;display:block" onpointermove="chHov(event)" onpointerdown="chHov(event)" onpointerleave="chOut()"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ac);stop-opacity:.34"/><stop offset="1" style="stop-color:var(--ac);stop-opacity:0"/></linearGradient></defs>' +
    [0, 5, 10, 15, 20]
      .map(
        (v) =>
          '<line x1="' +
          L +
          '" x2="' +
          (W - Rg) +
          '" y1="' +
          y(v) +
          '" y2="' +
          y(v) +
          '" stroke="var(--bd)" stroke-width="1"/><text x="' +
          (L - 6) +
          '" y="' +
          (y(v) + 3.5) +
          '" font-size="10" text-anchor="end" fill="var(--mut)">' +
          v +
          "</text>",
      )
      .join("") +
    (n > 1
      ? '<path d="' +
        ln +
        "L" +
        f(x(n - 1)) +
        " " +
        y(0) +
        "L" +
        f(x(0)) +
        " " +
        y(0) +
        'Z" fill="url(#cg)"/><path d="' +
        cur(MA) +
        '" fill="none" stroke="var(--mut)" stroke-width="1.5" stroke-dasharray="4 4"/><path d="' +
        ln +
        '" fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
      : "") +
    '<circle cx="' +
    f(P[n - 1][0]) +
    '" cy="' +
    f(P[n - 1][1]) +
    '" r="4.5" fill="var(--ac)" stroke="var(--card)" stroke-width="2"/>' +
    h
      .map((o, i) =>
        (i % st == 0 && n - 1 - i >= st * 0.6) || i == n - 1
          ? '<text x="' +
            f(x(i)) +
            '" y="' +
            (H - 8) +
            '" font-size="10" text-anchor="' +
            (n == 1 ? "middle" : i == n - 1 ? "end" : i == 0 ? "start" : "middle") +
            '" fill="var(--mut)">' +
            hfd(o) +
            "</text>"
          : "",
      )
      .join("") +
    '<line id="chg" y1="' +
    T +
    '" y2="' +
    y(0) +
    '" stroke="var(--fg)" stroke-width="1" opacity="0"/><circle id="chd" r="5" fill="var(--card)" stroke="var(--ac)" stroke-width="2.5" opacity="0"/></svg><div id="cht" class="cht"></div></div><small>Trait plein : tes notes. Pointillés : moyenne glissante sur 5 sessions. Touche ou survole la courbe pour le détail.</small>'
  );
}
function chHov(e) {
  if (!CHD.length) return;
  const r = e.currentTarget.getBoundingClientRect(),
    vx = ((e.clientX - r.left) / r.width) * 360;
  let i = 0,
    b = 1e9;
  CHX.forEach((x, k) => {
    const d = Math.abs(x - vx);
    if (d < b) {
      b = d;
      i = k;
    }
  });
  const o = CHD[i],
    cx = CHX[i],
    cy = 12 + ((20 - o.s) / 20) * 172,
    g = $("chg"),
    d = $("chd"),
    t = $("cht");
  g.setAttribute("x1", cx);
  g.setAttribute("x2", cx);
  g.setAttribute("opacity", 0.35);
  d.setAttribute("cx", cx);
  d.setAttribute("cy", cy);
  d.setAttribute("opacity", 1);
  t.style.display = "block";
  t.style.left = Math.min(Math.max((cx / 360) * 100, 24), 76) + "%";
  t.innerHTML = hfl(o) + "<br>" + pf(o.s) + "/20 · " + o.n + " question" + (o.n > 1 ? "s" : "");
}
function chOut() {
  ["chg", "chd"].forEach((k) => $(k) && $(k).setAttribute("opacity", 0));
  if ($("cht")) $("cht").style.display = "none";
}
