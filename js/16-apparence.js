const PALS = {
  ocean: {
    l: ["#f1f5fa", "#ffffff", "#162033", "#5a6880", "#d5deea"],
    d: ["#0c1524", "#14213a", "#e6edf7", "#9db0cc", "#24365a"],
    c: ["#1f5fa8", "#0b7f8c", "#9c6410", "#5b55b8", "#c0453f", "#2a7a4e"],
  },
  foret: {
    l: ["#f1f5f0", "#ffffff", "#18241c", "#5b6d60", "#d3dfd3"],
    d: ["#0e1712", "#16241c", "#e6f1ea", "#9fb8a8", "#26402f"],
    c: ["#2e7a57", "#4c7a2a", "#94681a", "#3f7c8c", "#b4503f", "#5f7326"],
  },
  aurore: {
    l: ["#fbf4f1", "#ffffff", "#2a1c1c", "#7a6460", "#ead9d2"],
    d: ["#1a1214", "#281b1f", "#f5e9ea", "#c2a6aa", "#432c33"],
    c: ["#b84d33", "#a8457a", "#a06a10", "#6d52a8", "#b83a4b", "#33795f"],
  },
  ardoise: {
    l: ["#f3f4f6", "#ffffff", "#1a1f27", "#5f6875", "#d9dde3"],
    d: ["#111418", "#1a1f26", "#e7ebf0", "#a2acb8", "#2c3440"],
    c: ["#3d4f6b", "#2f6f7a", "#8a5f1a", "#5d5488", "#a8443f", "#44705a"],
  },
  lavande: {
    l: ["#f5f3fb", "#ffffff", "#1d1830", "#655f80", "#dcd6ee"],
    d: ["#14111f", "#1f1a30", "#ece8f7", "#ada5c9", "#352d52"],
    c: ["#6a4fb3", "#3f6fb5", "#9c6618", "#a04a9a", "#c04860", "#35786a"],
  },
};
const BGS = [
    ["p", "Selon la palette"],
    ["w", "Blanc", "#ffffff", "#f5f6f8", "#dfe3e8"],
    ["g", "Gris clair", "#efefef", "#ffffff", "#d9d9d9"],
    ["c", "Crème", "#f7f1e3", "#fffdf7", "#e3d8c1"],
    ["b", "Bleu pâle", "#e8f0fa", "#ffffff", "#cfdcee"],
    ["v", "Vert pâle", "#e7f2ea", "#ffffff", "#cddfd2"],
    ["r", "Rose pâle", "#f9ebea", "#ffffff", "#ecd3d0"],
    ["l", "Lavande", "#eeeaf7", "#ffffff", "#d9d2ec"],
  ],
  BGD = [
    ["p", "Selon la palette"],
    ["n", "Noir", "#000000", "#121417", "#2a2d33"],
    ["a", "Anthracite", "#15171a", "#1f2226", "#353a41"],
    ["b", "Bleu nuit", "#0b1220", "#131d33", "#26365a"],
    ["v", "Vert sapin", "#0c1612", "#14231c", "#274233"],
    ["m", "Brun", "#17120f", "#231b16", "#3d3027"],
    ["l", "Prune", "#150f1c", "#20172b", "#392a4d"],
  ];
const isDark = () => {
  const m = S.mode || "auto";
  return (
    m == "dark" || (m == "auto" && !!window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches)
  );
};
function applyLook() {
  const h = document.documentElement,
    m = S.mode || "auto",
    dark = isDark(),
    st = h.style,
    P = PALS[S.pal] || PALS.ocean,
    b = dark ? P.d : P.l;
  if (m == "auto") h.removeAttribute("data-theme");
  else h.dataset.theme = m;
  ["--bg", "--card", "--fg", "--mut", "--bd"].forEach((v, i) => st.setProperty(v, b[i]));
  P.c.forEach((c, i) => st.setProperty("--c" + (i + 1), c));
  h.dataset.fx = S.fx || "none";
  const g = (dark ? BGD : BGS).find((x) => x[0] == (dark ? S.bgd || "p" : S.bg || "w"));
  if (g && g[2]) {
    st.setProperty("--bg", g[2]);
    st.setProperty("--card", g[3]);
    st.setProperty("--bd", g[4]);
  }
}
function appearance() {
  const sw = (L, cur, fn) =>
      '<div class="r" style="margin:4px 0">' +
      L.map(
        (b) =>
          '<button class="sw' +
          (b[0] == cur ? " on" : "") +
          '" onclick="' +
          fn +
          "('" +
          b[0] +
          '\')" aria-label="Fond ' +
          b[1] +
          '" title="' +
          b[1] +
          '" style="background:' +
          (b[2] || "linear-gradient(135deg,var(--c1) 50%,var(--c2) 50%)") +
          '"></button>',
      ).join("") +
      "</div>",
    lb = (L, cur) => (L.find((b) => b[0] == cur) || L[0])[1],
    pal = PALS[S.pal] ? S.pal : "ocean";
  return (
    '<div class="c"><label class="f">Mode</label>' +
    chips(
      [
        ["auto", "Automatique"],
        ["light", "Clair"],
        ["dark", "Sombre"],
      ],
      S.mode || "auto",
      "smode",
    ) +
    '<label class="f">Palette de couleurs (clair et sombre)</label><div class="r" style="margin:4px 0">' +
    PAL.map(
      (p) =>
        '<button class="pal' +
        (pal == p[0] ? " on" : "") +
        '" onclick="spal(\'' +
        p[0] +
        "')\"><span>" +
        PALS[p[0]].c.map((c) => '<i style="background:' + c + '"></i>').join("") +
        "</span>" +
        p[1] +
        "</button>",
    ).join("") +
    '</div><label class="f">Fond en mode clair : ' +
    lb(BGS, S.bg || "w") +
    "</label>" +
    sw(BGS, S.bg || "w", "sbg") +
    '<label class="f">Fond en mode sombre : ' +
    lb(BGD, S.bgd || "p") +
    "</label>" +
    sw(BGD, S.bgd || "p", "sbgd") +
    '<label class="f">Effet visuel</label>' +
    chips(
      [
        ["none", "Aucun"],
        ["glow", "Lueur (glow)"],
        ["glass", "Verre"],
        ["grad", "Dégradé"],
        ["relief", "Relief"],
      ],
      S.fx || "none",
      "sfx",
    ) +
    "<small>Tu es actuellement en mode " +
    (isDark() ? "sombre" : "clair") +
    ".</small></div>"
  );
}
