// ================= Répétition espacée FSRS =================
// Algorithme FSRS-5 (celui d'Anki), paramètres par défaut.
// État stocké sur chaque carte et chaque QCM : x.fs = {s: stabilité en jours, d: difficulté 1-10,
// last: date de la dernière révision, n: nombre de révisions, l: nombre d'oublis}, et x.due = prochaine date.
// Notes : 1 = À revoir (oublié), 2 = Difficile, 3 = Bien, 4 = Facile.
const FW = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11,
  0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];
const F_DEC = -0.5,
  F_FAC = 19 / 81,
  clamp = (x, a, b) => Math.min(b, Math.max(a, x)),
  dBetween = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5),
  fRet = () => S.ret || 0.9, // rétention visée (probabilité de se souvenir le jour de la révision)
  fR = (t, s) => Math.pow(1 + (F_FAC * t) / s, F_DEC), // probabilité de se souvenir après t jours
  fD0 = (g) => clamp(FW[4] - Math.exp(FW[5] * (g - 1)) + 1, 1, 10),
  fIvl = (s) =>
    clamp(Math.round((s / F_FAC) * (Math.pow(fRet(), 1 / F_DEC) - 1)), 1, S.maxI || 365);

// Calcule le nouvel état après une note g, sans le modifier.
function fsNext(st, g) {
  const td = day();
  let s, d;
  if (!st || !st.s) {
    s = FW[g - 1];
    d = fD0(g);
  } else {
    const el = Math.max(0, dBetween(st.last || td, td)),
      r = fR(el, st.s);
    if (el === 0) s = st.s * Math.exp(FW[17] * (g - 3 + FW[18]));
    else if (g === 1)
      s = Math.min(
        st.s,
        FW[11] * Math.pow(st.d, -FW[12]) * (Math.pow(st.s + 1, FW[13]) - 1) * Math.exp(FW[14] * (1 - r)),
      );
    else
      s =
        st.s *
        (1 +
          Math.exp(FW[8]) *
            (11 - st.d) *
            Math.pow(st.s, -FW[9]) *
            (Math.exp(FW[10] * (1 - r)) - 1) *
            (g === 2 ? FW[15] : 1) *
            (g === 4 ? FW[16] : 1));
    const dp = st.d - FW[6] * (g - 3),
      dl = st.d + ((dp - st.d) * (10 - st.d)) / 9;
    d = FW[7] * fD0(4) + (1 - FW[7]) * dl;
  }
  s = clamp(s, 0.1, 36500);
  d = clamp(d, 1, 10);
  const iv = g === 1 ? 0 : fIvl(s);
  return {
    st: { s: +s.toFixed(3), d: +d.toFixed(3), last: td, n: ((st && st.n) || 0) + 1, l: ((st && st.l) || 0) + (g === 1 ? 1 : 0) },
    iv,
    due: day(iv),
  };
}
// Applique la note à l'élément (carte ou QCM).
function fsRate(x, g) {
  const r = fsNext(x.fs, g);
  x.fs = r.st;
  x.due = r.due;
  return r.iv;
}
// Libellé court d'un intervalle : « auj. », « 3 j », « 2 mois »…
const ivLab = (n) =>
  n <= 0 ? "auj." : n < 31 ? n + " j" : n < 365 ? Math.round(n / 30) + " mois" : (n / 365).toFixed(1).replace(".", ",") + " an";
// Une carte est « acquise » quand sa stabilité dépasse 3 semaines.
const fsAcq = (x) => !!(x.fs && x.fs.s >= 21),
  fsNew = (x) => !x.fs && !x.due,
  fsDue = (x) => !x.due || x.due <= day();
// Note d'un QCM à partir du résultat : sans faute = Bien (Facile si « sûr », Difficile si « au hasard »),
// partiel = Difficile, 0 point = À revoir.
const qGrade = (f, pt, conf) => (f === 0 ? (conf === "a" ? 2 : conf === "s" ? 4 : 3) : pt > 0 ? 2 : 1);
// Migration des anciennes cartes (système à 6 boîtes) vers FSRS.
function fsMigrate() {
  S.cards.forEach((c) => {
    if (c.fs || !c.due) return;
    const b = c.box || 0;
    c.fs = { s: [0.5, 1, 2, 4, 8, 16][b] || 1, d: 5, last: day(), n: b, l: c.lap || 0 };
  });
}
// Cartes du jour : les révisions dues, plus les nouvelles cartes dans la limite quotidienne (S.ncd).
function cardsToday(list) {
  list = list || S.cards;
  const used = S.dd && S.dd.d === day() ? S.dd.nw || 0 : 0,
    rev = list.filter((x) => x.due && x.due <= day()).sort((a, b) => (a.due < b.due ? -1 : 1)),
    nw = list.filter((x) => !x.due).slice(0, Math.max(0, (S.ncd ?? 20) - used));
  return { rev, nw, all: rev.concat(nw) };
}
// QCM déjà vus dont la date de révision est arrivée.
const qcmDue = () => S.qcm.filter((x) => x.due && x.due <= day());
