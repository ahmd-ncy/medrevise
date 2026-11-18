// ================= Import JSON de QCM et flashcards =================
// Format attendu (un objet, ou une liste d'objets pour plusieurs chapitres) :
// { "format":"medrevise", "version":1, "ue":"…", "chapitre":"…",
//   "qcm":[{"enonce":"…","propositions":[{"texte":"…","correcte":true},…],"explication":"…","page":12,"annale":"…"}],
//   "flashcards":[{"recto":"…","verso":"…","page":3},{"trous":"Le … {{mot}} …","page":4}] }
const JPROMPT = `Tu vas transformer un cours de médecine (PASS/LAS, faculté de Nancy) en questions de révision pour mon application MedRevise. Le cours est joint à ce message.

RÈGLES
1. Utilise uniquement le contenu du cours joint. N'ajoute aucune connaissance extérieure. Si une notion est ambiguë dans le cours, ne fais pas de question dessus.
2. QCM au format du concours : un énoncé et 5 propositions, avec une ou plusieurs justes (au moins une, et varie le nombre de bonnes réponses d'un QCM à l'autre). Chaque proposition se juge seule, vraie ou fausse : pas de « toutes les réponses » ni de « aucune des réponses ». Les propositions fausses doivent être plausibles (inversion, mauvais chiffre, confusion entre deux notions proches, mauvaise localisation).
3. Pour chaque QCM, écris une explication courte qui corrige chaque proposition fausse en s'appuyant sur le cours, et indique dans "page" le numéro de page du fichier PDF où se trouve l'information (un nombre entier, la page du fichier et non le numéro imprimé s'ils diffèrent).
4. Flashcards : une seule notion par carte, réponse courte. Pour les définitions, chiffres et listes, fais des cartes à trous : écris la phrase dans "trous" en mettant les mots à retrouver entre doubles accolades, par exemple "Le débit cardiaque vaut environ {{5 L/min}} au repos."
5. Couvre tout le cours : environ un QCM par notion importante (souvent 15 à 40) et 20 à 60 flashcards selon la longueur.
6. Si le document est une annale, ajoute "annale": "Annales 2024" (avec la bonne année) à chaque QCM et reprends la correction officielle si elle est fournie.
7. Réponds uniquement avec le JSON, dans un seul bloc de code, sans texte avant ni après. Si tout ne tient pas dans une réponse, fais plusieurs JSON complets et valides, un par message, et j'écrirai « continue ».

FORMAT EXACT
{
  "format": "medrevise",
  "version": 1,
  "ue": "Nom de l'UE",
  "chapitre": "Titre du chapitre",
  "qcm": [
    {
      "enonce": "Concernant …, quelles propositions sont exactes ?",
      "propositions": [
        { "texte": "…", "correcte": true },
        { "texte": "…", "correcte": false },
        { "texte": "…", "correcte": true },
        { "texte": "…", "correcte": false },
        { "texte": "…", "correcte": false }
      ],
      "explication": "…",
      "page": 12
    }
  ],
  "flashcards": [
    { "recto": "Question ?", "verso": "Réponse", "page": 3 },
    { "trous": "Phrase avec {{mot à retrouver}}.", "page": 4 }
  ]
}

UE : [écris ici le nom de l'UE]
Chapitre : [écris ici le titre du chapitre]`;
let JI = null; // résultat de la dernière analyse
const nrmT = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
function jsonForm() {
  return (
    '<div class="c imp"><b>Import depuis Claude</b> ' +
    helpBtn("import") +
    '<p class="m" style="margin:.3em 0 0">Fais préparer tes QCM et tes flashcards par Claude à partir de ton cours, puis importe-les ici en une fois, au lieu de les taper un par un.</p></div>' +
    '<div class="c"><b>1. Préparer le fichier avec Claude</b><p class="m" style="margin:.3em 0 .6em">Ouvre une nouvelle conversation avec Claude, colle ce prompt, complète l’UE et le chapitre à la fin, et joins ton cours (PDF). Claude te répondra avec un bloc de texte à copier.</p><div class="r" style="margin:0"><button class="b p" onclick="jCopy()">Copier le prompt</button></div><p id="jcm" class="m" role="status"></p><details><summary>Voir le prompt</summary><pre class="pre" id="jpr">' +
    esc(JPROMPT) +
    "</pre></details></div>" +
    '<div class="c"><b>2. Importer le résultat</b><label class="f">Colle ici la réponse de Claude (le bloc de code entier convient)</label><textarea id="jt" style="font:13px ui-monospace,monospace;min-height:140px" oninput="JI=null;$(\'jp\').innerHTML=\'\'"></textarea><label class="f">Ou choisis un fichier .json</label><input type="file" accept=".json,.txt,application/json" onchange="this.files[0]&&this.files[0].text().then(t=>{$(\'jt\').value=t;jCheck()})">' +
    '<div class="lb">Destination</div><label class="f" style="color:var(--fg)"><input type="radio" name="jd" value="f" checked onchange="jDest()"> Selon l’UE et le chapitre écrits dans le fichier (créés s’ils n’existent pas)</label><label class="f" style="color:var(--fg)"><input type="radio" name="jd" value="c" onchange="jDest()"> Dans un chapitre que je choisis</label><div id="jdc" hidden><label class="f">UE</label>' +
    chsel() +
    '</div><label class="f">Livret à lier, pour le bouton « Voir dans le cours » (pages)</label><select id="sl">' +
    slOpts((S.chap.find((c) => c.id === AC && c.mid === AU) || S.chap.find((c) => c.mid === AU) || {}).id) +
    '</select><small id="jsl">Avec la destination « selon le fichier », le livret est lié automatiquement si le chapitre n’en a qu’un.</small>' +
    '<label class="f" style="color:var(--fg)"><input type="checkbox" id="jai" checked> Marquer les QCM comme « à vérifier » (liste dans Ajouter → Gérer)</label>' +
    '<div class="r"><button class="b" onclick="jCheck()">Vérifier</button></div><div id="jp" role="status"></div></div>'
  );
}
function jDest() {
  const c = document.querySelector('input[name=jd]:checked').value == "c";
  $("jdc").hidden = !c;
  $("jsl").hidden = c;
  JI = null;
  $("jp").innerHTML = "";
}
async function jCopy() {
  try {
    await navigator.clipboard.writeText(JPROMPT);
    $("jcm").textContent = "Prompt copié ✔";
  } catch (e) {
    const p = $("jpr");
    p.parentNode.open = true;
    const r = document.createRange();
    r.selectNodeContents(p);
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    $("jcm").textContent = "Copie automatique impossible ici : le prompt est sélectionné, copie-le à la main.";
  }
}
// Lit le texte collé : accepte un bloc de code, un objet, une liste, ou plusieurs JSON à la suite.
function jParse(t) {
  t = String(t || "")
    .replace(/```(?:json)?/gi, "\n")
    .trim();
  try {
    const d = JSON.parse(t);
    return Array.isArray(d) ? d : [d];
  } catch (e) {}
  // plusieurs objets collés à la suite
  const out = [];
  let dep = 0,
    st = -1,
    ins = false,
    esc_ = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ins) {
      if (esc_) esc_ = false;
      else if (ch == "\\") esc_ = true;
      else if (ch == '"') ins = false;
      continue;
    }
    if (ch == '"') ins = true;
    else if (ch == "{") {
      if (!dep) st = i;
      dep++;
    } else if (ch == "}" && dep) {
      dep--;
      if (!dep) out.push(JSON.parse(t.slice(st, i + 1)));
    }
  }
  if (!out.length) throw new Error("aucun objet JSON trouvé");
  return out;
}
// Analyse sans rien enregistrer : renvoie les éléments valides, les erreurs et les doublons.
function jAnalyse(txt, dest) {
  const blocks = jParse(txt),
    res = { groups: [], err: [], dup: 0, nq: 0, nc: 0 },
    seen = new Set();
  blocks.forEach((b, bi) => {
    if (!b || typeof b != "object") return res.err.push("Bloc " + (bi + 1) + " illisible.");
    const ue = String(b.ue || b.matiere || "").trim(),
      cht = String(b.chapitre || "").trim(),
      tag = blocks.length > 1 ? "Bloc " + (bi + 1) + ", " : "";
    if (!dest && (!ue || !cht)) return res.err.push(tag + "« ue » ou « chapitre » manquant : choisis un chapitre de destination.");
    const exCh = dest || (S.chap.find((c) => c.titre === cht && M(c.mid).nom === ue) || {}).id,
      qk = (e, ps) => nrmT(e) + "|" + ps.map((p) => nrmT(p.t)).join("|"),
      old = new Set(
        exCh
          ? S.qcm
              .filter((q) => q.ch === exCh)
              .map((q) => qk(q.enonce, q.props))
              .concat(S.cards.filter((c) => c.ch === exCh).map((c) => "c|" + nrmT(c.recto)))
          : [],
      ),
      g = { ue, cht, ch: exCh, q: [], c: [] };
    (b.qcm || b.questions || []).forEach((q, i) => {
      const w = tag + "QCM " + (i + 1) + " ignoré : ";
      if (!q || !String(q.enonce || "").trim()) return res.err.push(w + "énoncé manquant.");
      const pr = Array.isArray(q.propositions) ? q.propositions : [];
      if (pr.length < 2 || pr.length > 8) return res.err.push(w + "il faut de 2 à 8 propositions.");
      const props = pr.map((p, j) => ({
        l: "ABCDEFGH"[j],
        t: String((p && (p.texte ?? p.t)) || "").trim(),
        ok: p && (p.correcte === true || p.correcte === "true") ? true : p && (p.correcte === false || p.correcte === "false") ? false : null,
      }));
      if (props.some((p) => !p.t)) return res.err.push(w + "une proposition est vide.");
      if (props.some((p) => p.ok === null)) return res.err.push(w + "« correcte » doit valoir true ou false pour chaque proposition.");
      if (!props.some((p) => p.ok)) return res.err.push(w + "aucune proposition juste.");
      const k = qk(q.enonce, props);
      if (seen.has(k) || old.has(k)) return res.dup++;
      seen.add(k);
      g.q.push({
        enonce: String(q.enonce).trim(),
        props,
        expl: String(q.explication || "").trim(),
        an: String(q.annale || b.annale || "").trim(),
        page: Math.max(0, parseInt(q.page) || 0),
      });
    });
    (b.flashcards || b.cartes || []).forEach((c, i) => {
      const w = tag + "Flashcard " + (i + 1) + " ignorée : ",
        tr = c && (c.trous || (c.type == "trous" && c.texte));
      let r, v, cz = 0;
      if (tr) {
        if (!/\{\{.+?\}\}/.test(tr)) return res.err.push(w + "aucun {{trou}} dans la phrase.");
        r = String(tr).replace(/\{\{.+?\}\}/g, "[ … ]").trim();
        v = String(tr).replace(/\{\{(.+?)\}\}/g, "$1").trim();
        cz = 1;
      } else {
        r = String((c && c.recto) || "").trim();
        v = String((c && c.verso) || "").trim();
        if (!r || !v) return res.err.push(w + "recto ou verso manquant.");
      }
      const k = "c|" + nrmT(r);
      if (seen.has(k) || old.has(k)) return res.dup++;
      seen.add(k);
      g.c.push({ recto: r, verso: v, cz, page: Math.max(0, parseInt(c.page) || 0) });
    });
    res.nq += g.q.length;
    res.nc += g.c.length;
    if (g.q.length || g.c.length) res.groups.push(g);
  });
  return res;
}
function jCheck() {
  const dest = document.querySelector('input[name=jd]:checked').value == "c" ? $("ch").value : "",
    out = $("jp");
  if (document.querySelector('input[name=jd]:checked').value == "c" && !dest) return (out.innerHTML = '<p class="wnl">' + esc(NOCH) + "</p>");
  try {
    JI = jAnalyse($("jt").value, dest);
  } catch (e) {
    JI = null;
    return (out.innerHTML = '<p class="wnl">' + icn("alert") + " JSON illisible : " + esc(e.message) + ". Vérifie que tu as copié tout le bloc.</p>");
  }
  JI.dest = dest;
  out.innerHTML =
    '<div class="bn ' +
    (JI.nq + JI.nc ? "good" : "bad") +
    '"><b>' +
    JI.nq +
    " QCM et " +
    JI.nc +
    " flashcard" +
    (JI.nc > 1 ? "s" : "") +
    " prêts à importer</b>" +
    JI.groups
      .map(
        (g) =>
          "<p>" +
          esc(dest ? M(CH(dest).mid).nom + " › " + CH(dest).titre : g.ue + " › " + g.cht) +
          " : " +
          g.q.length +
          " QCM, " +
          g.c.length +
          " cartes" +
          (!dest && !g.ch ? " <small>(UE ou chapitre créé à l’import)</small>" : "") +
          "</p>",
      )
      .join("") +
    (JI.dup ? "<p>" + JI.dup + " doublon" + (JI.dup > 1 ? "s" : "") + " ignoré" + (JI.dup > 1 ? "s" : "") + " (déjà dans l’application ou répétés).</p>" : "") +
    "</div>" +
    (JI.err.length
      ? '<details class="c"' +
        (JI.nq + JI.nc ? "" : " open") +
        "><summary><b>" +
        JI.err.length +
        " élément" +
        (JI.err.length > 1 ? "s" : "") +
        " ignoré" +
        (JI.err.length > 1 ? "s" : "") +
        "</b></summary>" +
        JI.err.map((e) => '<p class="m" style="margin:.3em 0">' + esc(e) + "</p>").join("") +
        "</details>"
      : "") +
    (JI.nq + JI.nc ? '<button class="big" onclick="jImport()">Importer</button>' : "");
}
function jImport() {
  if (!JI) return;
  const ai = $("jai").checked,
    sl = $("sl") ? $("sl").value : "";
  let n = 0;
  JI.groups.forEach((g) => {
    const ch = JI.dest || ens(g.ue, g.cht),
      lv = JI.dest ? sl : (() => {
        const l = S.courses.filter((c) => c.ch === ch);
        return l.length === 1 ? l[0].id : "";
      })(),
      src = (p) => (lv && p ? { c: lv, p } : null);
    g.q.forEach((q) => {
      S.qcm.push({ id: uid(), ch, enonce: q.enonce, img: "", props: q.props, expl: q.expl, an: q.an, src: src(q.page), ...(ai ? { ai: 1 } : {}) });
      n++;
    });
    g.c.forEach((c) => {
      S.cards.push({ id: uid(), ch, recto: c.recto, verso: c.verso, img: "", cz: c.cz, src: src(c.page) });
      n++;
    });
  });
  save();
  JI = null;
  $("jt").value = "";
  $("jp").innerHTML =
    '<div class="bn good"><b>' +
    n +
    " élément" +
    (n > 1 ? "s" : "") +
    " importé" +
    (n > 1 ? "s" : "") +
    " ✔</b><p>Les nouvelles cartes arrivent dans tes cartes du jour au rythme fixé dans ton profil. Les QCM sont dans l’onglet QCM" +
    (ai ? ", et à vérifier dans Ajouter → Gérer" : "") +
    ".</p></div>";
}
