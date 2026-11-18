// ================= Importer un dossier (Ajouter → Importer un dossier) =================
// On choisit un dossier rangé ainsi :  UE2 / chapitre 1 / L1.pdf  (+ fichiers .json de QCM et flashcards).
// L'app crée les UE, les chapitres et les livrets (avec leur PDF), puis importe les QCM et les cartes.
// Un dossier parent contenant plusieurs UE (ex. SANTE / UE2, UE6…) fonctionne aussi.
let DI = null; // analyse en cours
const natCmp = (a, b) => a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  dBase = (n) => n.replace(/\.(pdf|json)$/i, ""),
  // « C10 L1 » → « Livret 1 », « C9 L2,1 » → « Livret 2.1 », « L1 » → « Livret 1 »
  dLivret = (n) => {
    const m = dBase(n).match(/(?:^|\s|_)L\s*(\d+(?:[.,]\d+)?)\s*$/i);
    return m ? "Livret " + m[1].replace(",", ".") : dBase(n);
  },
  dChapNum = (t) => +((String(t).match(/chap(?:itre)?\.?\s*0*(\d+)/i) || [])[1] || NaN),
  dChapTitre = (f) => {
    const n = dChapNum(f);
    return n ? "Chapitre " + n : f.charAt(0).toUpperCase() + f.slice(1);
  };
function dossierForm() {
  return (
    '<div class="c imp"><b>Importer un dossier</b><p class="m" style="margin:.3em 0 0">Ajoute d’un coup toutes tes UE, tes chapitres et tes livrets PDF, rangés dans des dossiers sur ton ordinateur. Les QCM et flashcards préparés par Claude (fichiers .json) sont importés en même temps.</p></div>' +
    '<div class="c"><b>Comment ranger tes fichiers</b><pre class="pre dtree">UE2/\n  chapitre 1/\n    L1.pdf\n    L1.json   ← QCM et flashcards (facultatif)\n  chapitre 2/\n    C2 L1.pdf\n    C2 L2.pdf\nUE6/\n  …</pre><small class="m">Tu peux choisir un dossier d’UE (UE2) ou le dossier qui contient toutes tes UE. Ce qui existe déjà dans l’app n’est pas ajouté une deuxième fois.</small></div>' +
    '<div class="c"><label class="drop" ondragover="event.preventDefault()"><span class="dri">' +
    icn("upload") +
    '</span><span class="drt"><b>Choisir un dossier</b><small>Sur ordinateur (Chrome, Edge, Firefox, Safari)</small></span><span class="drb">Parcourir</span><input type="file" hidden webkitdirectory multiple onchange="dScan(this.files)"></label><div id="dout" role="status"></div></div>'
  );
}
// Analyse le dossier choisi : rien n'est encore enregistré.
async function dScan(files) {
  const out = $("dout");
  files = [...(files || [])].filter((f) => f.webkitRelativePath && !/(^|\/)\./.test(f.webkitRelativePath));
  if (!files.length) return (out.innerHTML = '<p class="wnl">Ce dossier est vide.</p>');
  out.innerHTML = '<p class="m">Analyse de ' + files.length + " fichiers…</p>";
  const T = {}; // UE → chapitre → { pdf: [], json: [] }
  let ign = 0;
  for (const f of files) {
    const seg = f.webkitRelativePath.split("/");
    if (seg.length < 3) {
      ign++;
      continue;
    }
    const ue = seg[seg.length - 3],
      ch = seg[seg.length - 2],
      isJ = /\.json$/i.test(f.name);
    let isP = /\.pdf$/i.test(f.name);
    // fichier sans extension (ex. « C2 L1 ») : on regarde s'il commence par %PDF
    if (!isP && !isJ && !/\.[a-z0-9]{2,4}$/i.test(f.name) && f.size > 4)
      isP = (await f.slice(0, 4).text()) === "%PDF";
    if (!isP && !isJ) {
      ign++;
      continue;
    }
    const c = (((T[ue] = T[ue] || {})[ch] = T[ue][ch] || { pdf: [], json: [] }));
    (isP ? c.pdf : c.json).push(f);
  }
  const ues = Object.keys(T).sort(natCmp);
  if (!ues.length) return (out.innerHTML = '<p class="wnl">Aucun PDF trouvé. Range tes fichiers comme dans l’exemple : UE / chapitre / livret.pdf</p>');
  // lecture des .json (QCM et cartes)
  const plan = [];
  let nP = 0,
    nNew = 0,
    nQ = 0,
    nC = 0,
    errs = [],
    mo = 0;
  for (const ue of ues) {
    const m = dFindUE(ue),
      chs = [];
    for (const chf of Object.keys(T[ue]).sort(natCmp)) {
      const g = T[ue][chf],
        js = [];
      let titre = dChapTitre(chf);
      for (const f of g.json.sort((a, b) => natCmp(a.name, b.name))) {
        try {
          const t = await f.text(),
            b = jParse(t)[0] || {};
          if (b.chapitre && dChapNum(b.chapitre) === dChapNum(titre)) titre = String(b.chapitre).trim();
          js.push({ f, t });
        } catch (e) {
          errs.push(ue + " / " + chf + " / " + f.name + " : fichier illisible.");
        }
      }
      const exCh = m && dFindChap(m.id, titre),
        livs = g.pdf
          .sort((a, b) => natCmp(a.name, b.name))
          .map((f) => {
            const ex = exCh && S.courses.find((c) => c.ch === exCh.id && c.pdf && c.pdf.name === f.name && c.pdf.size === f.size);
            nP++;
            mo += f.size;
            if (!ex) nNew++;
            return { f, titre: dLivret(f.name), ex };
          });
      // compte des QCM et cartes (doublons exclus)
      let q = 0,
        c = 0;
      js.forEach((j) => {
        const a = jAnalyse(j.t, exCh ? exCh.id : "__nouveau__");
        j.ok = !a.err.length;
        a.err.forEach((e) => errs.push(ue + " / " + chf + " / " + j.f.name + " : " + e));
        a.groups.forEach((g2) => ((q += g2.q.length), (c += g2.c.length)));
      });
      nQ += q;
      nC += c;
      chs.push({ chf, titre, exCh, livs, js, q, c });
    }
    plan.push({ ue, m, chs });
  }
  DI = { plan, nP, nNew, nQ, nC, mo };
  out.innerHTML =
    '<div class="dsum"><div><b>' +
    ues.length +
    "</b><small>UE</small></div><div><b>" +
    plan.reduce((a, u) => a + u.chs.length, 0) +
    "</b><small>chapitres</small></div><div><b>" +
    nNew +
    "</b><small>livrets PDF à ajouter</small></div><div><b>" +
    nQ +
    "</b><small>QCM</small></div><div><b>" +
    nC +
    "</b><small>flashcards</small></div></div>" +
    plan
      .map(
        (u) =>
          '<details class="due"' +
          (plan.length == 1 ? " open" : "") +
          "><summary><b>" +
          esc(u.m ? u.m.nom : u.ue) +
          "</b> " +
          (u.m ? '<span class="pill">déjà dans l’app</span>' : '<span class="pill gel">nouvelle UE</span>') +
          " · " +
          u.chs.length +
          " chapitre" +
          (u.chs.length > 1 ? "s" : "") +
          "</summary>" +
          u.chs
            .map(
              (c) =>
                '<div class="dch"><b>' +
                esc(c.titre) +
                "</b>" +
                (c.exCh ? ' <small class="m">(existe déjà)</small>' : "") +
                "<small>" +
                c.livs.map((l) => esc(l.titre) + (l.ex ? " ✓" : "")).join(" · ") +
                (c.q || c.c ? " — " + c.q + " QCM, " + c.c + " cartes" : "") +
                "</small></div>",
            )
            .join("") +
          "</details>",
      )
      .join("") +
    (errs.length ? '<div class="wnl">' + errs.slice(0, 8).map(esc).join("<br>") + (errs.length > 8 ? "<br>…" : "") + "</div>" : "") +
    (ign ? '<small class="m">' + ign + " fichier" + (ign > 1 ? "s" : "") + " ignoré" + (ign > 1 ? "s" : "") + " (ni PDF ni JSON, ou pas rangé dans un dossier de chapitre).</small>" : "") +
    '<label class="f" style="color:var(--fg)"><input type="checkbox" id="dai" checked> Marquer les QCM comme « à vérifier »</label>' +
    '<button class="big" style="margin-top:10px" onclick="dImport()">Tout importer (' +
    fsz(mo) +
    ")</button>";
}
// UE existante portant ce nom (« UE2 » retrouve aussi « UE2 – Physique »)
function dFindUE(n) {
  const k = n.trim().toLowerCase();
  return S.mat.find((m) => m.nom.trim().toLowerCase() === k) || S.mat.find((m) => m.nom.trim().toLowerCase().startsWith(k) && !/[a-z0-9]/i.test(m.nom.trim().charAt(k.length)));
}
function dFindChap(mid, titre) {
  const n = dChapNum(titre);
  return S.chap.find((c) => c.mid === mid && c.titre === titre) || (n ? S.chap.find((c) => c.mid === mid && dChapNum(c.titre) === n) : null);
}
async function dImport() {
  if (!DI) return;
  const out = $("dout"),
    ai = $("dai") && $("dai").checked,
    P = DI;
  DI = null;
  let i = 0,
    nl = 0,
    nq = 0,
    nc = 0,
    fail = [];
  const tot = P.nNew || 1,
    prog = (t) =>
      (out.innerHTML =
        '<p class="m">' + t + '</p><div class="dbar"><i style="width:' + Math.round((i / tot) * 100) + '%"></i></div><small class="m">Garde cette page ouverte pendant l’import.</small>');
  for (const u of P.plan) {
    let m = u.m || dFindUE(u.ue);
    if (!m) S.mat.push((m = { id: uid(), nom: u.ue, prof: "", ic: guessIc(u.ue), couleur: COL[S.mat.length % COL.length] }));
    for (const c of u.chs) {
      let ch = dFindChap(m.id, c.titre);
      if (!ch) S.chap.push((ch = { id: uid(), mid: m.id, titre: c.titre, prof: "", info: "" }));
      else if (ch.titre !== c.titre && /^chapitre \d+$/i.test(ch.titre)) ch.titre = c.titre; // titre plus parlant trouvé dans le .json
      const ids = {};
      for (const l of c.livs) {
        if (l.ex) {
          ids[dBase(l.f.name)] = l.ex.id;
          continue;
        }
        prog("Ajout de « " + esc(m.nom + " · " + ch.titre + " · " + l.titre) + " » (" + (i + 1) + "/" + P.nNew + ")…");
        const co = { id: uid(), ch: ch.id, titre: l.titre, texte: "", imgs: [] };
        try {
          await pdfPut(co.id, await l.f.arrayBuffer());
          co.pdf = { name: l.f.name, size: l.f.size };
          S.courses.push(co);
          ids[dBase(l.f.name)] = co.id;
          nl++;
        } catch (e) {
          fail.push(l.f.name);
        }
        i++;
        if (i % 5 == 0) save();
      }
      // QCM et cartes : liés au livret du même nom (L1.json → L1.pdf), sinon au livret unique du chapitre
      const all = S.courses.filter((x) => x.ch === ch.id);
      for (const j of c.js) {
        if (!j.ok) continue;
        const a = jAnalyse(j.t, ch.id),
          lv = ids[dBase(j.f.name)] || (all.length === 1 ? all[0].id : ""),
          src = (p) => (lv && p ? { c: lv, p } : null);
        a.groups.forEach((g) => {
          g.q.forEach((q) => {
            S.qcm.push({ id: uid(), ch: ch.id, enonce: q.enonce, img: "", props: q.props, expl: q.expl, an: q.an, src: src(q.page), ...(ai ? { ai: 1 } : {}) });
            nq++;
          });
          g.c.forEach((x) => {
            S.cards.push({ id: uid(), ch: ch.id, recto: x.recto, verso: x.verso, img: "", cz: x.cz, src: src(x.page) });
            nc++;
          });
        });
      }
    }
  }
  save();
  out.innerHTML =
    '<div class="bn good"><b>Import terminé ✔</b><p>' +
    nl +
    " livret" +
    (nl > 1 ? "s" : "") +
    " PDF, " +
    nq +
    " QCM et " +
    nc +
    " flashcards ajoutés." +
    (SY.user ? " Les PDF s’envoient dans ton compte en arrière-plan : laisse l’app ouverte quelques minutes." : "") +
    "</p>" +
    (fail.length ? '<p class="wnl">Non enregistrés (stockage plein ?) : ' + fail.map(esc).join(", ") + "</p>" : "") +
    '<div class="r"><button class="b p" onclick="go(\'cours\')">Voir mes cours</button></div></div>';
}
