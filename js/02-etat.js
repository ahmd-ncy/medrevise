const K = "medrevise_v2";
let S,
  tab = "home",
  R = {};
const uid = () => Math.random().toString(36).slice(2, 9),
  $ = (id) => document.getElementById(id),
  v = (id) => $(id).value.trim();
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const im = (s) => (s && /^data:image\//.test(s) ? '<img src="' + esc(s) + '" alt="Schéma">' : "");
const day = (o = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + o);
  return d.toLocaleDateString("sv");
};
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
const COL = ["#8c2f39", "#2f5d62", "#6b4e71", "#a0642a", "#4f6f3a", "#355c8a"],
  OLDC = [
    "#e4405f",
    "#2f7de1",
    "#7a4de8",
    "#13a589",
    "#d9780a",
    "#c2185b",
    "#e4572e",
    "#2e86ab",
    "#7b5ea7",
    "#2a9d8f",
    "#e09f3e",
    "#9b3d4a",
    "#2d5f8b",
    "#5b4a8a",
    "#1f7a6b",
    "#a8671c",
    "#6b6f2a",
  ];
const M = (id) => S.mat.find((m) => m.id === id) || { nom: "?", couleur: "#888" },
  CH = (id) => S.chap.find((c) => c.id === id) || { titre: "?" },
  mof = (x) => M(CH(x.ch).mid);
const svg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="150"><rect width="420" height="150" fill="#e0f2f1"/><circle cx="110" cy="75" r="45" fill="#80cbc4" stroke="#00695c" stroke-width="3"/><text x="110" y="80" text-anchor="middle" font-size="14" fill="#004d40">Épaule</text><path d="M155 75H300" stroke="#00695c" stroke-width="3"/><text x="310" y="80" font-size="14" fill="#004d40">Bras</text><text x="210" y="140" text-anchor="middle" font-size="12" fill="#004d40">Schéma d\'exemple (fictif)</text></svg>',
  );
