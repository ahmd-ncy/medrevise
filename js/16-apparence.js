const PALS = {
  signature: {
    l: ["#eef2ff", "#ffffff", "#0f172a", "#55607a", "#d6dcf5"],
    d: ["#0b1430", "#131e45", "#eef3ff", "#a9b6e8", "#2a3872"],
    c: ["#3b82f6", "#06b6d4", "#f59e0b", "#a855f7", "#f43f5e", "#22c55e"],
  },
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
  rose: {
    l: ["#fbf3f6", "#ffffff", "#2b1a22", "#7d6170", "#efd8e2"],
    d: ["#1a1016", "#271820", "#f7e8ef", "#c9a6b8", "#45293a"],
    c: ["#c2477a", "#8a4fb8", "#c0702a", "#3f7fb5", "#d0434f", "#3a8a6a"],
  },
  sable: {
    l: ["#f6f1e8", "#fffdf8", "#2b241c", "#7a6d5e", "#e3d9c8"],
    d: ["#17130e", "#221c15", "#f2eadf", "#c2b39f", "#3d3326"],
    c: ["#a0642a", "#5f7a3a", "#b0802a", "#5a6f8f", "#a8453a", "#6b5a8a"],
  },
  contraste: {
    l: ["#ffffff", "#ffffff", "#000000", "#2b2b2b", "#000000"],
    d: ["#000000", "#000000", "#ffffff", "#e0e0e0", "#ffffff"],
    c: ["#0040c0", "#006060", "#8a4b00", "#5a00b0", "#b00020", "#006b2a"],
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
// Polices proposées (chargées depuis Google Fonts seulement si on les choisit).
const FONTS = {
  inter: ["Moderne", ""],
  nunito: ["Arrondie", "Nunito:wght@500;600;700;800", '"Nunito", sans-serif'],
  serif: ["Classique", "Source+Serif+4:wght@400;600;700", '"Source Serif 4", Georgia, serif'],
  lisible: ["Très lisible", "Atkinson+Hyperlegible:wght@400;700", '"Atkinson Hyperlegible", sans-serif'],
  mono: ["Machine à écrire", "IBM+Plex+Mono:wght@400;600", '"IBM Plex Mono", monospace'],
};
// Thèmes prêts à l'emploi : un clic règle tout d'un coup.
const THEMES = [
  ["signature", "Signature", { mode: "dark", pal: "signature", bg: "w", bgd: "p", fx: "aurora", font: "inter", rad: "r", mono: 0 }],
  ["classique", "Classique", { mode: "auto", pal: "ocean", bg: "w", bgd: "p", fx: "none", font: "inter", rad: "n", mono: 0 }],
  ["minuit", "Minuit", { mode: "dark", pal: "ocean", bg: "w", bgd: "b", fx: "none", font: "inter", rad: "n", mono: 0 }],
  ["neon", "Néon", { mode: "dark", pal: "lavande", bg: "w", bgd: "n", fx: "glow", font: "inter", rad: "r", mono: 0 }],
  ["pastel", "Pastel", { mode: "light", pal: "rose", bg: "l", bgd: "p", fx: "none", font: "nunito", rad: "r", mono: 0 }],
  ["nature", "Nature", { mode: "auto", pal: "foret", bg: "v", bgd: "v", fx: "none", font: "nunito", rad: "n", mono: 0 }],
  ["papier", "Papier", { mode: "light", pal: "sable", bg: "c", bgd: "m", fx: "none", font: "serif", rad: "s", mono: 0 }],
  ["verre", "Verre", { mode: "auto", pal: "ocean", bg: "b", bgd: "b", fx: "glass", font: "inter", rad: "r", mono: 0 }],
  ["contraste", "Contraste élevé", { mode: "light", pal: "contraste", bg: "p", bgd: "p", fx: "none", font: "lisible", rad: "n", mono: 0 }],
];
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
  P.c.forEach((c, i) => st.setProperty("--c" + (i + 1), S.mono && S.acc ? S.acc : c));
  h.dataset.fx = S.fx || "none";
  const g = (dark ? BGD : BGS).find((x) => x[0] == (dark ? S.bgd || "p" : S.bg || "w"));
  if (g && g[2] && S.pal !== "contraste") {
    st.setProperty("--bg", g[2]);
    st.setProperty("--card", g[3]);
    st.setProperty("--bd", g[4]);
  }
  h.dataset.rad = S.rad || "n";
  h.dataset.anim = S.anim === 0 ? "off" : "on";
  h.style.setProperty("--zoom", (S.tsz || 100) / 100);
  // police
  const F = FONTS[S.font] || FONTS.inter;
  let fl = $("ffl"),
    fs = $("ffs");
  if (F[1]) {
    if (!fl) {
      fl = document.createElement("link");
      fl.id = "ffl";
      fl.rel = "stylesheet";
      document.head.appendChild(fl);
    }
    const href = "https://fonts.googleapis.com/css2?family=" + F[1] + "&display=swap";
    if (fl.href !== href) fl.href = href;
    if (!fs) {
      fs = document.createElement("style");
      fs.id = "ffs";
      document.head.appendChild(fs);
    }
    fs.textContent = "body,body *:not(svg):not(svg *):not(.ic){font-family:" + F[2] + "!important}";
  } else if (fs) fs.textContent = "";
}
const sLook = (k, v) => {
    S[k] = v;
    S.theme = "";
    save();
    render();
  },
  sTheme = (id) => {
    const t = THEMES.find((x) => x[0] == id);
    if (!t) return;
    Object.assign(S, t[2]);
    S.theme = id;
    save();
    render();
  };
function themeCard(t) {
  const o = t[2],
    P = PALS[o.pal],
    dk = o.mode == "dark",
    base = dk ? P.d : P.l,
    g = (dk ? BGD : BGS).find((x) => x[0] == (dk ? o.bgd : o.bg)),
    bg = o.pal != "contraste" && g && g[2] ? g[2] : base[0],
    cd = o.pal != "contraste" && g && g[3] ? g[3] : base[1],
    r = o.rad == "r" ? 10 : o.rad == "s" ? 2 : 6;
  return (
    '<button class="thc' +
    (S.theme == t[0] ? " on" : "") +
    '" onclick="sTheme(\'' +
    t[0] +
    '\')"><span class="thp" style="background:' +
    bg +
    ";border-radius:" +
    r +
    'px"><i style="background:' +
    P.c[0] +
    ";border-radius:" +
    r +
    "px" +
    (o.fx == "glow" ? ";box-shadow:0 0 10px " + P.c[0] : "") +
    '"></i><span style="background:' +
    cd +
    ";border-radius:" +
    r +
    'px">' +
    P.c
      .slice(1, 5)
      .map((c) => '<b style="background:' + c + '"></b>')
      .join("") +
    '</span></span><span class="thn">' +
    t[1] +
    "</span></button>"
  );
}
function appearance() {
  const sw = (L, cur, k) =>
      '<div class="r" style="margin:4px 0">' +
      L.map(
        (b) =>
          '<button class="sw' +
          (b[0] == cur ? " on" : "") +
          "\" onclick=\"sLook('" +
          k +
          "','" +
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
    ch = (L, cur, k) =>
      '<div class="chips">' +
      L.map(
        (x) => '<button class="chip' + (String(cur) === String(x[0]) ? " on" : "") + "\" onclick=\"sLook('" + k + "'," + JSON.stringify(x[0]).replace(/"/g, "'") + ')">' + x[1] + "</button>",
      ).join("") +
      "</div>",
    pal = PALS[S.pal] ? S.pal : "ocean",
    PL2 = [
      ["signature", "Signature"],
      ["ocean", "Océan"],
      ["foret", "Forêt"],
      ["aurore", "Aurore"],
      ["rose", "Rose"],
      ["lavande", "Lavande"],
      ["sable", "Sable"],
      ["ardoise", "Ardoise"],
      ["contraste", "Contraste élevé"],
    ];
  return (
    '<div class="c"><b>Thèmes</b><p class="m" style="margin:.2em 0 .6em">Un clic règle tout. Tu peux ensuite ajuster chaque détail ci-dessous.</p><div class="thg">' +
    THEMES.map(themeCard).join("") +
    "</div></div>" +
    '<div class="c"><b>Mode</b>' +
    ch(
      [
        ["auto", "Automatique"],
        ["light", "Clair"],
        ["dark", "Sombre"],
      ],
      S.mode || "auto",
      "mode",
    ) +
    "<small class=\"hl\">Automatique suit le réglage de ton téléphone ou de ton ordinateur (actuellement : " +
    (isDark() ? "sombre" : "clair") +
    ").</small></div>" +
    '<div class="c"><b>Couleurs</b><label class="f">Palette</label><div class="r" style="margin:4px 0">' +
    PL2.map(
      (p) =>
        '<button class="pal' +
        (pal == p[0] ? " on" : "") +
        "\" onclick=\"sLook('pal','" +
        p[0] +
        "')\"><span>" +
        PALS[p[0]].c.map((c) => '<i style="background:' + c + '"></i>').join("") +
        "</span>" +
        p[1] +
        "</button>",
    ).join("") +
    '</div><label class="f">Couleur des onglets</label>' +
    ch(
      [
        [0, "Une couleur par onglet"],
        [1, "Une seule couleur"],
      ],
      S.mono ? 1 : 0,
      "mono",
    ) +
    (S.mono
      ? '<div class="r" style="align-items:center;margin:0"><input type="color" value="' +
        (S.acc || "#3b5b92") +
        '" onchange="sLook(\'acc\',this.value)" style="width:56px;height:40px;padding:2px;border:1px solid var(--bd);border-radius:8px;background:var(--card)"><small>Choisis ta couleur</small></div>'
      : "") +
    '<label class="f">Fond en mode clair</label>' +
    sw(BGS, S.bg || "w", "bg") +
    '<label class="f">Fond en mode sombre</label>' +
    sw(BGD, S.bgd || "p", "bgd") +
    "</div>" +
    '<div class="c"><b>Texte</b><label class="f">Police</label><div class="r" style="margin:4px 0">' +
    Object.keys(FONTS)
      .map(
        (k) =>
          '<button class="chip' +
          ((S.font || "inter") == k ? " on" : "") +
          "\" onclick=\"sLook('font','" +
          k +
          "')\">" +
          FONTS[k][0] +
          "</button>",
      )
      .join("") +
    '</div><label class="f">Taille du texte</label>' +
    ch(
      [
        [90, "Petite"],
        [100, "Normale"],
        [112, "Grande"],
        [125, "Très grande"],
      ],
      S.tsz || 100,
      "tsz",
    ) +
    "</div>" +
    '<div class="c"><b>Style</b><label class="f">Coins</label>' +
    ch(
      [
        ["s", "Carrés"],
        ["n", "Légèrement arrondis"],
        ["r", "Très arrondis"],
      ],
      S.rad || "n",
      "rad",
    ) +
    '<label class="f">Effet visuel</label>' +
    ch(
      [
        ["none", "Aucun"],
        ["aurora", "Aurore boréale"],
        ["glow", "Lueur"],
        ["glass", "Verre"],
        ["grad", "Dégradé"],
        ["relief", "Relief"],
      ],
      S.fx || "none",
      "fx",
    ) +
    '<label class="f">Animations</label>' +
    ch(
      [
        [1, "Activées"],
        [0, "Réduites"],
      ],
      S.anim === 0 ? 0 : 1,
      "anim",
    ) +
    "</div>"
  );
}
