const IC = {
  flame:
    '<path class="df" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  target:
    '<circle class="df" cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  star: '<path class="df" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  book: '<path class="df" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  cards: '<path class="df" d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  alert:
    '<path class="df" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  errors: '<circle class="df" cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  clock: '<circle class="df" cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  file: '<path class="df" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  edit: '<path d="M12 20h9"/><path class="df" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash:
    '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path class="df" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle class="df" cx="12" cy="7" r="4"/>',
  home: '<path class="df" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  plus: '<circle class="df" cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  grad: '<path class="df" d="M22 10L12 5 2 10l10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  exam: '<path class="df" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
  pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  heart:
    '<path class="df" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  flask:
    '<path d="M9 3h6"/><path class="df" d="M10 3v6L4.5 18.5a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.5 15h9"/>',
  bone: '<path d="M8.5 15.5l7-7"/><circle class="df" cx="6" cy="15.5" r="2.5"/><circle class="df" cx="8.5" cy="18" r="2.5"/><circle class="df" cx="15.5" cy="6" r="2.5"/><circle class="df" cx="18" cy="8.5" r="2.5"/>',
  dna: '<path d="M7 2c0 5 10 5 10 10S7 17 7 22"/><path d="M17 2c0 5-10 5-10 10s10 5 10 10"/><path d="M8.5 6h7M8.5 18h7"/>',
  cell: '<circle class="df" cx="12" cy="12" r="9"/><circle cx="10.5" cy="11" r="3"/><path d="M16 14.5h.01M15.5 8h.01"/>',
  pill: '<rect class="df" x="2" y="8.5" width="20" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7"/>',
  atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)"/>',
  eye: '<path class="df" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  drop: '<path class="df" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  people:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle class="df" cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  chart: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
};
Object.assign(IC, {
  cloud: '<path class="df" d="M17.5 19H8a6 6 0 1 1 1.3-11.86A7 7 0 0 1 22 11.5 4 4 0 0 1 17.5 19z"/>',
  cards:
    '<rect x="8.5" y="3" width="12" height="15" rx="2" transform="rotate(9 14.5 10.5)"/><g transform="rotate(-7 9.5 13.5)"><rect class="df" x="3.5" y="6" width="12" height="15" rx="2"/><path d="M7 11.5h5M7 15h3"/></g>',
  check:
    '<rect class="df" x="3" y="3" width="5.5" height="5.5" rx="1.2"/><path d="M4.3 5.8l1 1 1.8-2.2M12 5.8h9"/><rect x="3" y="10.2" width="5.5" height="5.5" rx="1.2"/><path d="M12 13h9"/><rect x="3" y="17.4" width="5.5" height="4.6" rx="1.2"/><path d="M12 19.8h6"/>',
  errors:
    '<rect class="df" x="5.5" y="2.5" width="15" height="19" rx="2"/><path d="M3 7h4.5M3 12h4.5M3 17h4.5M10.8 9.5l5 5M15.8 9.5l-5 5"/>',
  plus: '<rect class="df" x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
  bone: '<g transform="rotate(-45 12 12)"><path class="df" d="M7.2 10.5A2.3 2.3 0 1 0 3.6 12a2.3 2.3 0 1 0 3.6 1.5h9.6a2.3 2.3 0 1 0 3.6-1.5 2.3 2.3 0 1 0-3.6-1.5z"/></g>',
  heart:
    '<path class="df" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M6.5 12h2.6l1.4-2.6 2 5 1.4-2.4h3.6"/>',
  lungs:
    '<path d="M12 3v8"/><path class="df" d="M12 11c-1.5-2.5-4-3-5.5-1-2 2.500-3 6-3 9 0 1.500 1.500 2 3 1.500l3.500-1.200c1.200-.400 2-1.500 2-2.800z"/><path class="df" d="M12 11c1.500-2.500 4-3 5.500-1 2 2.500 3 6 3 9 0 1.500-1.500 2-3 1.500l-3.500-1.200c-1.200-.400-2-1.500-2-2.800z"/>',
  brain:
    '<path class="df" d="M12 5a3.300 3.300 0 0 0-6.200 1A3.400 3.400 0 0 0 3.500 11a3.400 3.400 0 0 0 1.700 5.300A3.600 3.600 0 0 0 12 17.500z"/><path class="df" d="M12 5a3.300 3.300 0 0 1 6.200 1 3.400 3.400 0 0 1 2.300 5 3.400 3.400 0 0 1-1.700 5.300A3.600 3.600 0 0 1 12 17.500z"/><path d="M12 5v15M8.500 10.500c1 0 1.500.700 1.500 1.500M15.500 10.500c-1 0-1.500.700-1.500 1.500"/>',
  micro:
    '<path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2"/><path class="df" d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
  stetho:
    '<path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15v1a6 6 0 0 0 12 0v-4"/><circle class="df" cx="20" cy="10" r="2"/>',
  syringe:
    '<path d="M18 2l4 4M17 7l3-3M9 11l4 4M5 19l-3 3M14 4l6 6"/><path class="df" d="M19 9L8.700 19.300c-1 1-2.500 1-3.400 0l-.600-.600c-1-1-1-2.500 0-3.400L15 5"/>',
  scale:
    '<path d="M12 3v18M7 21h10M5 7h14"/><path class="df" d="M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  virus:
    '<circle class="df" cx="12" cy="12" r="5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.500 3.500M15.500 15.500L19 19M5 19l3.500-3.500M15.500 8.500L19 5"/>',
  cal: '<rect class="df" x="3" y="4.500" width="18" height="17" rx="2"/><path d="M3 10h18M8 2.500v4M16 2.500v4"/>',
  search: '<circle class="df" cx="11" cy="11" r="7"/><path d="M21 21l-4.300-4.300"/>',
  focus:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/><circle class="df" cx="12" cy="12" r="3"/>',
  spark:
    '<path class="df" d="M11 3l1.900 5.100L18 10l-5.100 1.900L11 17l-1.900-5.100L4 10l5.100-1.900z"/><path d="M19 15l.800 2.200L22 18l-2.200.800L19 21l-.800-2.200L16 18l2.200-.800z"/>',
  pen: '<path class="df" d="M15 4l5 5-9.500 9.500H5.500v-5z"/><path d="M3 21h18M12.500 6.500l5 5"/>',
  shield: '<path class="df" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  trophy:
    '<path class="df" d="M18 2H6v7a6 6 0 0 0 12 0z"/><path d="M6 9H4.500a2.500 2.500 0 0 1 0-5H6M18 9h1.500a2.500 2.500 0 0 0 0-5H18M8 22h8M12 15v7"/>',
});
const LOGO =
  '<svg class="lg" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="4.200" d="M4 31h7l4.500-15L24 39l8.500-23L37 31h7"/><path stroke-width="3" opacity=".8" d="M39 5v9M34.500 9.500h9"/></svg>';
const ill = (n, t) =>
  '<div class="ill"><svg viewBox="0 0 160 110" aria-hidden="true"><circle cx="80" cy="56" r="44" class="i0"/><circle cx="26" cy="30" r="5" class="i1"/><circle cx="138" cy="78" r="7" class="i1"/><path class="i2" d="M132 20l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM22 74l1.500 4.500L28 80l-4.500 1.500L22 86l-1.500-4.500L16 80l4.500-1.500z"/><g class="ic" transform="translate(50 26) scale(2.500)">' +
  (IC[n] || IC.book) +
  "</g></svg>" +
  (t ? "<p>" + t + "</p>" : "") +
  "</div>";
const GI = [
    [/anat|ost[eé]o|squelet|locomot/, "bone"],
    [/neuro|cerveau|psy/, "brain"],
    [/respir|pneumo|poumon/, "lungs"],
    [/cardio|c[oœ]ur|physio/, "heart"],
    [/histo|embryo|microscop/, "micro"],
    [/g[eé]n[eé]t|adn|mol[eé]cul|g[eé]nom/, "dna"],
    [/biochim|chimie|m[eé]tabol/, "flask"],
    [/cellul|biologie/, "cell"],
    [/pharma|m[eé]dicament|th[eé]rap/, "pill"],
    [/physique|biophys|radio|imagerie/, "atom"],
    [/stat|math|[eé]pid[eé]m/, "chart"],
    [/shs|humain|social|[eé]thique|droit|sant[eé] publique|soci[eé]t/, "scale"],
    [/microb|bact[eé]r|virus|infect|immun/, "virus"],
    [/sang|h[eé]mato/, "drop"],
    [/ophtalm|vision|[oœ]il/, "eye"],
    [/clini|s[eé]mio|soin|m[eé]decine/, "stetho"],
  ],
  guessIc = (n) => {
    n = (n || "").toLowerCase();
    const g = GI.find((x) => x[0].test(n));
    return g ? g[1] : "book";
  };
const icPick = (id, cur, auto) =>
  '<input type="hidden" id="' +
  id +
  '" value="' +
  cur +
  '"><div class="r" style="margin:4px 0">' +
  (auto ? [""].concat(UEI) : UEI)
    .map(
      (n) =>
        '<button type="button" class="b icb' +
        (cur == n ? " p" : "") +
        '" aria-label="' +
        (n || "auto") +
        "\" onclick=\"document.querySelectorAll('.icb').forEach(b=>b.classList.remove('p'));this.classList.add('p');$('" +
        id +
        "').value='" +
        n +
        "'\">" +
        (n ? icn(n) : "Auto") +
        "</button>",
    )
    .join("") +
  "</div>";
let PTX = {};
const icn = (n, c) =>
    '<svg class="ic' +
    (c ? " " + c : "") +
    '" viewBox="0 0 24 24" aria-hidden="true">' +
    (IC[n] || IC.book) +
    "</svg>",
  UEI = [
    "bone",
    "heart",
    "lungs",
    "brain",
    "cell",
    "micro",
    "dna",
    "flask",
    "pill",
    "syringe",
    "virus",
    "drop",
    "atom",
    "eye",
    "stetho",
    "scale",
    "people",
    "chart",
    "book",
  ],
  OLDI = { "\u{1F9B4}": "bone", "\u{1FAC0}": "heart", "\u{1F9EA}": "flask" };
