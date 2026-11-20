function add() {
  const t = R.add;
  if (t === "gerer") return '<h2 class="ti">Ajouter</h2>' + tabsAdd() + gerer();
  const T = [
    ["qcm", "QCM"],
    ["card", "Flashcard"],
    ["json", "Import depuis Claude"],
    ["dossier", "Importer un dossier"],
    ["oc", "Schéma à trous"],
    ["cours", "Livret"],
    ["chap", "Chapitre"],
    ["mat", "UE"],
    ["gerer", "" + icn("gear") + " Gérer"],
  ];
  let f = "";
  if (t === "mat")
    f =
      '<label class="f">Nom</label><input type="text" id="n"><label class="f">Professeur / responsable</label><input type="text" id="p"><label class="f">Icône (Auto : choisie d’après le nom)</label>' +
      icPick("aic", "", 1) +
      '<button class="b p" onclick="aMat()">Ajouter l’UE</button>';
  if (t === "chap")
    f =
      '<label class="f">UE</label><select id="mid" onchange="AU=this.value;AC=\'\'">' +
      S.mat
        .map(
          (m) =>
            '<option value="' +
            m.id +
            '"' +
            (m.id === AU ? " selected" : "") +
            ">" +
            esc(m.nom) +
            "</option>",
        )
        .join("") +
      '</select><label class="f">Titre du chapitre</label><input type="text" id="n"><label class="f">Professeur</label><input type="text" id="p"><label class="f">Infos (date, support, remarques…)</label><input type="text" id="i"><button class="b p" onclick="aChap()">Ajouter le chapitre</button>';
  if (t === "cours")
    f =
      '<label class="f">UE</label>' +
      chsel() +
      '<label class="f">Titre du livret (ex. Livret 1)</label><input type="text" id="n"><label class="f">PDF du livret (facultatif)</label>' +
      fDrop({ id: "pdfin", accept: "application/pdf,.pdf", icon: "file", t: "Ajoute le PDF du livret", s: "Touche pour le choisir, ou glisse-le ici" }) +
      '<label class="f">Texte du livret (facultatif si PDF)</label><textarea id="x" style="min-height:160px"></textarea>' +
      imgf() +
      '<button class="b p" onclick="aCours()">Ajouter le livret</button>';
  if (t === "json") f = jsonForm();
  if (t === "dossier") f = dossierForm();
  if (t === "oc")
    f =
      '<label class="f">UE</label>' +
      chsel() +
      '<label class="f">Image du schéma</label>' +
      fDrop({
        accept: "image/*",
        icon: "image",
        t: "Choisis l’image du schéma",
        s: "Photo, capture d’écran ou image du livret",
        on: "if(!$(\'ch\').value)return $(\'fm\').textContent=NOCH;const ch=$(\'ch\').value;shrink(this,u=>ocCrop(u,v=>ocEdit(ch,v)),2400)",
      }) +
      '<small>Tu encadreras d’abord le schéma, puis tu dessineras un cache sur chaque légende à retrouver. Depuis un livret PDF, le bouton « Schéma à trous » capture directement la page affichée.</small>';
  if (t === "card")
    f =
      '<label class="f">UE</label>' +
      chsel() +
      '<label class="f">Recto : une question, ou une phrase avec {{mot}} pour une carte à trous</label><textarea id="r"></textarea><label class="f">Verso (réponse)</label><textarea id="vv"></textarea>' +
      srcf() +
      imgf() +
      '<button class="b p" onclick="aCard()">Ajouter la flashcard</button>';
  if (t === "qcm")
    f =
      '<label class="f">UE</label>' +
      chsel() +
      '<label class="f">Énoncé</label><textarea id="e"></textarea><label class="f">Propositions (coche celles qui sont justes)</label>' +
      '<div id="rows">' +
      [0, 1, 2, 3].map((i) => prow(i, "")).join("") +
      '</div><button class="b" onclick="plus(\'\')">+ Ajouter une proposition</button>' +
      '<label class="f">Explication (facultatif)</label><textarea id="x"></textarea><label class="f">Annale : source ou année (facultatif, ex. Annales 2024)</label><input type="text" id="an">' +
      srcf() +
      imgf() +
      '<button class="b p" onclick="aQcm()">Ajouter le QCM</button>';
  return (
    '<h2>Ajouter</h2><div class="r" style="margin:0 0 10px">' +
    T.map(
      (x) =>
        '<button class="b ' +
        (t === x[0] ? "p" : "") +
        '" onclick="R={add:\'' +
        x[0] +
        "'};render()\">" +
        x[1] +
        "</button>",
    ).join("") +
    "</div>" +
    (t === "json"
      ? f
      : '<div class="c">' +
        ((t === "chap" || t === "cours" || t === "card" || t === "qcm") && !S.chap.length && t !== "mat"
          ? "<p>Crée d'abord une UE puis un chapitre.</p>"
          : f) +
        '<p id="fm" class="m" role="status"></p></div>')
  );
}
// Zone de dépôt de fichier : on touche pour choisir, ou on glisse le fichier dessus (ordinateur).
const fsz = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(n / 1e3)) + " Ko");
function fDrop(o) {
  return (
    '<label class="drop' +
    (o.sm ? " sm" : "") +
    '" ondragover="event.preventDefault();this.classList.add(\'ov\')" ondragleave="this.classList.remove(\'ov\')" ondrop="dropIn(event,this)"><span class="dri">' +
    icn(o.icon || "upload") +
    '</span><span class="drt"><b>' +
    o.t +
    "</b><small>" +
    (o.s || "Touche pour choisir un fichier") +
    '</small></span><span class="drb">' +
    (o.btn || "Choisir") +
    '</span><input type="file" hidden accept="' +
    o.accept +
    '"' +
    (o.id ? ' id="' + o.id + '"' : "") +
    ' onchange="dropShow(this);' +
    (o.on || "") +
    '"></label>'
  );
}
function dropIn(e, l) {
  e.preventDefault();
  l.classList.remove("ov");
  const i = l.querySelector("input"),
    f = e.dataTransfer && e.dataTransfer.files[0];
  if (!f) return;
  const acc = i.accept;
  if (acc && !(acc == "image/*" ? /^image\//.test(f.type) : acc.split(",").some((a) => f.type == a.trim() || f.name.toLowerCase().endsWith(a.trim()))))
    return toast("Ce type de fichier n’est pas accepté ici.");
  const dt = new DataTransfer();
  dt.items.add(f);
  i.files = dt.files;
  i.dispatchEvent(new Event("change"));
}
function dropShow(i) {
  const f = i.files[0],
    l = i.closest(".drop");
  if (!f || !l) return;
  l.classList.add("has");
  l.querySelector(".dri").innerHTML = icn("tick");
  l.querySelector(".drt").innerHTML = "<b>" + esc(f.name) + "</b><small>" + fsz(f.size) + " · prêt</small>";
  l.querySelector(".drb").textContent = "Changer";
}
const imgf = () =>
  '<label class="f">Schéma (facultatif)</label>' +
  fDrop({
    accept: "image/*",
    icon: "image",
    t: "Ajouter une image",
    s: "Photo ou capture d’un schéma",
    sm: 1,
    on: "shrink(this,u=>{R.img=u;$(\'fm\').textContent=\'Image prête.\'})",
  });
const done = (m) => {
  R.img = "";
  add_reset();
  $("fm").textContent = m;
};
function add_reset() {
  document.querySelectorAll("#app input[type=text],#app textarea").forEach((e) => (e.value = ""));
  document.querySelectorAll("#app input[type=checkbox],#app input[type=file]").forEach((e) => {
    e.checked = false;
    if (e.type === "file") e.value = "";
  });
}
function aMat() {
  if (!v("n")) return ($("fm").textContent = "Nom requis.");
  S.mat.push({
    id: uid(),
    nom: v("n"),
    prof: v("p"),
    ic: $("aic").value || guessIc(v("n")),
    couleur: COL[S.mat.length % COL.length],
  });
  save();
  done("UE ajoutée ✔");
}
function aChap() {
  if (!v("n")) return ($("fm").textContent = "Titre requis.");
  S.chap.push({ id: uid(), mid: $("mid").value, titre: v("n"), prof: v("p"), info: v("i") });
  save();
  done("Chapitre ajouté ✔");
}
// pdf.js n'est chargé qu'au premier PDF ouvert (il pèse 1,4 Mo avec son « worker »).
let PDFL = null;
const pdfLib = () =>
  window.pdfjsLib
    ? Promise.resolve()
    : (PDFL =
        PDFL ||
        new Promise((ok, ko) => {
          const sc = document.createElement("script");
          sc.src = "vendor/pdf.min.js";
          sc.onload = ok;
          sc.onerror = () => {
            PDFL = null;
            ko(new Error("bibliothèque PDF non chargée"));
          };
          document.head.appendChild(sc);
        }));
const WK = "vendor/pdf.worker.min.js",
  DB = () =>
    new Promise((ok, ko) => {
      const r = indexedDB.open("medrevise", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("pdf");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
const pdfOp = (m, id, v) =>
    DB().then(
      (d) =>
        new Promise((ok, ko) => {
          const t = d.transaction("pdf", m == "get" ? "readonly" : "readwrite"),
            q =
              m == "get"
                ? t.objectStore("pdf").get(id)
                : m == "put"
                  ? t.objectStore("pdf").put(v, id)
                  : t.objectStore("pdf").delete(id);
          q.onsuccess = () => ok(q.result);
          q.onerror = () => ko(q.error);
        }),
    ),
  // PDF et images : gardés sur l'appareil et copiés dans le compte (voir 22-sync.js).
  // Le cache de texte (clés « …:t ») reste local.
  pdfPut = (id, v) =>
    pdfOp("put", id, v).then((r) => {
      if (typeof cloudPut == "function") cloudPut(id, v);
      return r;
    }),
  pdfGet = async (id) => {
    let v = await pdfOp("get", id);
    if (v == null && typeof cloudGet == "function") {
      v = await cloudGet(id);
      if (v != null) await pdfOp("put", id, v).catch(() => {});
    }
    return v;
  },
  pdfDel = (id) =>
    pdfOp("del", id).then((r) => {
      if (typeof cloudDel == "function") cloudDel(id);
      return r;
    });
async function addPdf(inp, id) {
  const f = inp.files[0];
  if (!f) return;
  try {
    await pdfPut(id, await f.arrayBuffer());
    const c = S.courses.find((x) => x.id === id);
    PD = null;
    delete PTX[id];
    pdfDel(id + ":t").catch(() => {});
    c.pdf = { name: f.name, size: f.size };
    save();
    render();
  } catch (e) {
    ask("PDF non enregistré : stockage indisponible ou plein.", () => {}, "OK");
  }
}
function rmPdf(id) {
  ask(
    "Retirer le PDF de ce cours ?",
    async () => {
      try {
        await pdfDel(id);
      } catch (e) {}
      PD = null;
      S.courses.find((x) => x.id === id).pdf = null;
      save();
      render();
    },
    "Retirer",
  );
}
let PD = null,
  PT = 0;
async function pdfInit() {
  const c = S.courses.find((x) => x.id === R.id);
  let box = $("pdfv");
  if (!c || !c.pdf || !box) return;
  try {
    if (!PD || PD.id !== c.id) {
      if (SY.user) box.innerHTML = '<p class="m">Chargement du PDF…</p>';
      const buf = await pdfGet(c.id);
      if (!buf) {
        box.innerHTML =
          '<p class="m">' +
          (SY.user
            ? "PDF introuvable, ni sur cet appareil ni dans ton compte. Ajoute-le de nouveau avec « Remplacer le PDF »."
            : "PDF introuvable sur cet appareil. Connecte-toi (Profil → Compte) pour récupérer les PDF de ton compte, ou utilise « Remplacer le PDF ».") +
          "</p>";
        return;
      }
      await pdfLib();
      if (!window.pdfjsLib) throw new Error("bibliothèque PDF non chargée");
      pdfjsLib.GlobalWorkerOptions.workerSrc = WK;
      PD = { id: c.id, doc: await pdfjsLib.getDocument({ data: buf.slice(0) }).promise };
    }
    box = $("pdfv");
    if (!box || R.id !== c.id) return;
    const n = PD.doc.numPages,
      nav =
        '<div class="pnav"><button class="b" onclick="pdfGo(-1,1)" aria-label="Page précédente">←</button><span>Page <input type="number" class="pin" min="1" max="' +
        n +
        '" aria-label="Numéro de page" onchange="pdfGo(+this.value)"> / ' +
        n +
        '</span><button class="b" onclick="pdfGo(1,1)" aria-label="Page suivante">→</button></div>';
    box.innerHTML =
      nav.replace('class="pnav"', 'class="pnav ptop"') +
      '<div class="r ptb"><button class="b" onpointerdown="hlGrab()" onclick="hlAdd()">' +
      icn("pen") +
      ' Surligner</button><button class="b" onclick="ocFromPdf()">' +
      icn("eye") +
      ' Schéma à trous</button><span class="pzg"><button class="b" onclick="pz(-1)" aria-label="Zoom arrière">−</button><span id="pzl">' +
      PZ * 100 +
      ' %</span><button class="b" onclick="pz(1)" aria-label="Zoom avant">+</button></span><button class="b" id="pfb" onclick="pfs()">' +
      icn("scan") +
      " Plein écran</button></div>" +
      '<div class="pzw" id="pzw"><div class="pgw" id="pgw" style="width:' +
      PZ * 100 +
      '%"><canvas id="pgc" class="pgc"></canvas><div id="phl"></div><div class="textLayer" id="ptl"></div></div></div>' +
      nav.replace('class="pnav"', 'class="pnav pbot"') +
      // barre du plein écran : seulement l'essentiel, touche la page pour la cacher ou l'afficher
      '<div class="pfbar" role="toolbar" aria-label="Lecture en plein écran"><button class="b" onclick="pfs()" aria-label="Quitter le plein écran">✕</button><button class="b" onclick="pdfGo(-1,1)" aria-label="Page précédente">←</button><span class="pfn"><input type="number" class="pin" min="1" max="' +
      n +
      '" aria-label="Numéro de page" onchange="pdfGo(+this.value)"> / ' +
      n +
      '</span><button class="b" onclick="pdfGo(1,1)" aria-label="Page suivante">→</button><button class="b" onclick="pz(-1)" aria-label="Zoom arrière">−</button><button class="b" onclick="pz(1)" aria-label="Zoom avant">+</button></div>';
    const w = $("pgw");
    let x0 = null;
    w.ontouchstart = (e) => {
      x0 = e.touches[0].clientX;
    };
    w.ontouchend = (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (PZ > 1 || String(getSelection())) return;
      if (Math.abs(dx) > 60) pdfGo(dx < 0 ? 1 : -1, 1);
    };
    // en plein écran, un simple toucher sur la page cache ou réaffiche la barre
    w.onclick = () => {
      if (document.body.classList.contains("pf") && !String(getSelection())) document.body.classList.toggle("pfh");
    };
    await pdfGo((S.pp || {})[c.id] || 1);
  } catch (e) {
    const b = $("pdfv");
    if (b) b.innerHTML = '<p class="m">Impossible d’afficher le PDF ici (' + esc(e.message || e) + ").</p>";
  }
}
async function pdfGo(p, rel) {
  if (!PD || !$("pgc")) return;
  S.pp = S.pp || {};
  const n = PD.doc.numPages,
    cur = S.pp[PD.id] || 1;
  p = Math.min(n, Math.max(1, Math.round(rel ? cur + p : p) || 1));
  S.pp[PD.id] = p;
  save();
  document.querySelectorAll(".pin").forEach((i) => {
    i.value = p;
  });
  const t = ++PT,
    pg = await PD.doc.getPage(p);
  let cv = $("pgc");
  if (!cv || t !== PT) return;
  const k0 = ($("pgw").clientWidth || 600) / pg.getViewport({ scale: 1 }).width,
    vp = pg.getViewport({ scale: k0 * Math.min(2, window.devicePixelRatio || 1) }),
    off = document.createElement("canvas");
  off.width = vp.width;
  off.height = vp.height;
  await pg.render({ canvasContext: off.getContext("2d"), viewport: vp }).promise;
  cv = $("pgc");
  if (!cv || t !== PT) return;
  cv.width = vp.width;
  cv.height = vp.height;
  cv.style.aspectRatio = "auto";
  cv.getContext("2d").drawImage(off, 0, 0);
  const tl = $("ptl");
  if (tl) {
    tl.innerHTML = "";
    tl.style.setProperty("--scale-factor", k0);
    try {
      const tc = await pg.getTextContent();
      if (t === PT && $("ptl") === tl)
        pdfjsLib.renderTextLayer({
          textContentSource: tc,
          container: tl,
          viewport: pg.getViewport({ scale: k0 }),
          textDivs: [],
        });
    } catch (e) {}
  }
  hlDraw();
  if (rel) {
    if (document.body.classList.contains("pf")) $("pdfv").scrollTop = 0;
    else $("pdfv").scrollIntoView({ block: "start" });
  }
}
async function aCours() {
  if (!$("ch").value) return ($("fm").textContent = NOCH);
  const f = $("pdfin") && $("pdfin").files[0];
  if (!v("n") || !(v("x") || f)) return ($("fm").textContent = "Titre requis, et un texte ou un PDF.");
  const c = { id: uid(), ch: $("ch").value, titre: v("n"), texte: v("x"), imgs: R.img ? [R.img] : [] };
  try {
    if (f) {
      await pdfPut(c.id, await f.arrayBuffer());
      c.pdf = { name: f.name, size: f.size };
    }
  } catch (e) {
    return ($("fm").textContent = "PDF non enregistré (stockage indisponible ou plein).");
  }
  S.courses.push(c);
  save();
  done("Livret ajouté ✔");
}
function aCard() {
  if (!$("ch").value) return ($("fm").textContent = NOCH);
  let cr = v("r"),
    cw = v("vv"),
    cz = /\{\{.+?\}\}/.test(cr);
  if (cz) {
    cw = cw || cr.replace(/\{\{(.+?)\}\}/g, "$1");
    cr = cr.replace(/\{\{.+?\}\}/g, "[ … ]");
  }
  if (!cr || !cw)
    return ($("fm").textContent = "Recto et verso requis (verso facultatif pour une carte à trous).");
  S.cards.push({
    id: uid(),
    ch: $("ch").value,
    recto: cr,
    verso: cw,
    cz: cz ? 1 : 0,
    img: R.img || "",
    src: srcv(),
  });
  save();
  done("Flashcard ajoutée ✔");
}
function aQcm() {
  if (!$("ch").value) return ($("fm").textContent = NOCH);
  const p = [...Array(8).keys()]
    .filter((i) => $("p" + i) && v("p" + i))
    .map((i, n) => ({ l: "ABCDEFGH"[n], t: v("p" + i), ok: $("k" + i).checked }));
  if (!v("e") || p.length < 2 || !p.some((x) => x.ok))
    return ($("fm").textContent = "Énoncé, 2 propositions minimum et au moins une bonne réponse.");
  S.qcm.push({
    id: uid(),
    ch: $("ch").value,
    enonce: v("e"),
    img: R.img || "",
    props: p,
    expl: v("x"),
    an: v("an"),
    src: srcv(),
  });
  save();
  done("QCM ajouté ✔");
}
