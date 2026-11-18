function mkCloze(ch) {
  const d = document.createElement("div");
  d.id = "md";
  let mk = new Set();
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>Carte à trous</h3><label class="f">Phrase du cours</label><textarea id="cz">' +
    esc((SEL || "").replace(/\s+/g, " ").trim().slice(0, 400)) +
    '</textarea><label class="f">Touche les mots à masquer</label><div id="czw" class="r" style="margin:4px 0;gap:4px"></div><p id="em" class="m" role="status"></p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Créer</button></div></div>';
  document.body.appendChild(d);
  const ws = () => $("cz").value.trim().split(/\s+/).filter(Boolean),
    draw = () => {
      $("czw").innerHTML = ws()
        .map(
          (w, i) =>
            '<button type="button" class="chip' +
            (mk.has(i) ? " on" : "") +
            '" data-i="' +
            i +
            '">' +
            esc(w) +
            "</button>",
        )
        .join("");
    };
  $("cz").oninput = () => {
    mk = new Set();
    draw();
  };
  $("czw").onclick = (e) => {
    const b = e.target.closest("[data-i]");
    if (!b) return;
    const i = +b.dataset.i;
    mk.has(i) ? mk.delete(i) : mk.add(i);
    draw();
  };
  $("mn").onclick = () => d.remove();
  draw();
  $("my").onclick = () => {
    const w = ws();
    if (!w.length || !mk.size) return ($("em").textContent = "Écris une phrase et masque au moins un mot.");
    S.cards.push({
      id: uid(),
      ch,
      recto: w.map((x, i) => (mk.has(i) ? "[ … ]" : x)).join(" "),
      verso: w.join(" "),
      img: "",
      cz: 1,
      src:
        tab === "cours" && R.id && (S.courses.find((x) => x.id === R.id) || {}).pdf
          ? { c: R.id, p: (S.pp || {})[R.id] || 1 }
          : null,
    });
    save();
    d.remove();
  };
}
let TK = 0;
const fmtH = (x) =>
  x >= 3600
    ? Math.floor(x / 3600) + " h " + String(Math.floor((x % 3600) / 60)).padStart(2, "0")
    : Math.floor(x / 60) + " min";
setInterval(() => {
  if (document.hidden || !S) return;
  const rd = tab === "cours" && R.id,
    it = R.run && R.q && R.q[R.i],
    ch = it ? it.ch : rd ? (S.courses.find((c) => c.id === R.id) || {}).ch : null;
  if (!it && !rd) return;
  S.tm = S.tm || {};
  S.tu = S.tu || {};
  S.tm[day()] = (S.tm[day()] || 0) + 15;
  const u = ch && CH(ch).mid;
  if (u) S.tu[u] = (S.tu[u] || 0) + 15;
  if (rd && ch) jRead(ch);
  TK = (TK + 1) % 4;
  if (!TK) save();
}, 15000);
const OCI = {};
function ocEdit(ch, url, src) {
  const d = document.createElement("div");
  d.id = "md";
  let B = [],
    st = null;
  d.innerHTML =
    '<div class="mb" style="max-width:720px" role="dialog" aria-modal="true"><h3>Schéma à trous · étape 2 sur 2</h3><p class="m" style="margin:0 0 8px;font-weight:500">Dessine un rectangle sur chaque légende à masquer.</p><div id="ocw" class="ocw" style="touch-action:none;cursor:crosshair"><img src="' +
    url +
    '" alt="Schéma" draggable="false"><div id="ocb"></div></div><p id="em" class="m" role="status"></p><div class="r"><button class="b" id="ocu">Retirer le dernier cache</button></div><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Créer la carte</button></div></div>';
  document.body.appendChild(d);
  const w = $("ocw"),
    P = (e) => {
      const r = w.getBoundingClientRect();
      return [
        Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      ];
    },
    bx = (a, b) =>
      [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])].map(
        (v) => +v.toFixed(4),
      ),
    dr = (t) => {
      $("ocb").innerHTML = B.concat(t ? [t] : [])
        .map(
          (b) =>
            '<i style="left:' +
            b[0] * 100 +
            "%;top:" +
            b[1] * 100 +
            "%;width:" +
            b[2] * 100 +
            "%;height:" +
            b[3] * 100 +
            '%"></i>',
        )
        .join("");
      $("em").textContent = B.length + " cache" + (B.length > 1 ? "s" : "");
    };
  w.onpointerdown = (e) => {
    st = P(e);
    try {
      w.setPointerCapture(e.pointerId);
    } catch (x) {}
  };
  w.onpointermove = (e) => {
    if (st) dr(bx(st, P(e)));
  };
  w.onpointerup = (e) => {
    if (!st) return;
    const b = bx(st, P(e));
    st = null;
    if (b[2] > 0.02 && b[3] > 0.012) B.push(b);
    dr();
  };
  $("ocu").onclick = () => {
    B.pop();
    dr();
  };
  $("mn").onclick = () => d.remove();
  dr();
  $("my").onclick = async () => {
    if (!B.length) return ($("em").textContent = "Dessine au moins un cache.");
    const id = uid();
    try {
      await pdfPut("im:" + id, url);
    } catch (e) {
      return ($("em").textContent = "Image non enregistrée : stockage indisponible ou plein.");
    }
    S.cards.push({
      id,
      ch,
      oc: B,
      recto: "Schéma à compléter (" + B.length + " légende" + (B.length > 1 ? "s" : "") + ")",
      verso: "Schéma : toutes les légendes révélées.",
      img: "",
      src: src || null,
    });
    save();
    d.remove();
    if ($("fm")) $("fm").textContent = "Schéma à trous ajouté ✔";
  };
}
async function ocFromPdf() {
  const c = S.courses.find((x) => x.id === R.id),
    cv = $("pgc");
  if (!c || !cv) return;
  const src = { c: c.id, p: (S.pp || {})[c.id] || 1 };
  let o = document.createElement("canvas");
  try {
    // nouveau rendu de la page en haute définition (environ 2000 px de large) pour un recadrage net
    const pg = await PD.doc.getPage(src.p),
      vp = pg.getViewport({ scale: 2000 / pg.getViewport({ scale: 1 }).width });
    o.width = vp.width;
    o.height = vp.height;
    const g = o.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, o.width, o.height);
    await pg.render({ canvasContext: g, viewport: vp }).promise;
  } catch (e) {
    // à défaut, capture de la page telle qu'affichée
    o.width = cv.width;
    o.height = cv.height;
    const g = o.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, o.width, o.height);
    g.drawImage(cv, 0, 0);
  }
  ocCrop(o.toDataURL("image/jpeg", 0.92), (u) => ocEdit(c.ch, u, src));
}
// Étape 1 : sélectionner la zone du schéma dans la page ou l'image.
function ocCrop(url, cb) {
  const d = document.createElement("div");
  d.id = "md";
  let z = null,
    st = null;
  d.innerHTML =
    '<div class="mb" style="max-width:720px" role="dialog" aria-modal="true"><h3>Schéma à trous · étape 1 sur 2</h3><p class="m" style="margin:0 0 8px;font-weight:500">Encadre le schéma à garder. Tu pourras ensuite masquer ses légendes.</p><div id="ocw" class="ocw crop" style="touch-action:none;cursor:crosshair"><img src="' +
    url +
    '" alt="Page à recadrer" draggable="false"><div id="ocb"></div></div><p id="em" class="m" role="status">Aucune zone sélectionnée : toute l’image sera gardée.</p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Continuer</button></div></div>';
  document.body.appendChild(d);
  const w = $("ocw"),
    P = (e) => {
      const r = w.getBoundingClientRect();
      return [
        Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      ];
    },
    bx = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])],
    dr = (b) => {
      $("ocb").innerHTML = b
        ? '<i class="zone" style="left:' + b[0] * 100 + "%;top:" + b[1] * 100 + "%;width:" + b[2] * 100 + "%;height:" + b[3] * 100 + '%"></i>'
        : "";
    };
  w.onpointerdown = (e) => {
    st = P(e);
    try {
      w.setPointerCapture(e.pointerId);
    } catch (x) {}
  };
  w.onpointermove = (e) => {
    if (st) dr(bx(st, P(e)));
  };
  w.onpointerup = (e) => {
    if (!st) return;
    const b = bx(st, P(e));
    st = null;
    z = b[2] > 0.05 && b[3] > 0.03 ? b : null;
    dr(z);
    $("em").textContent = z ? "Zone sélectionnée. Redessine pour la changer." : "Zone trop petite : toute l’image sera gardée.";
  };
  $("mn").onclick = () => d.remove();
  $("my").onclick = () => {
    if (!z) {
      d.remove();
      return cb(url);
    }
    const im = new Image();
    im.onload = () => {
      const sx = z[0] * im.naturalWidth,
        sy = z[1] * im.naturalHeight,
        sw = z[2] * im.naturalWidth,
        sh = z[3] * im.naturalHeight,
        k = Math.min(1, 1400 / sw),
        o = document.createElement("canvas");
      o.width = Math.round(sw * k);
      o.height = Math.round(sh * k);
      o.getContext("2d").drawImage(im, sx, sy, sw, sh, 0, 0, o.width, o.height);
      d.remove();
      cb(o.toDataURL("image/jpeg", 0.85));
    };
    im.src = url;
  };
}
function ocCard(c, m, d) {
  const rv = R.rv || [];
  return (
    sbar() +
    '<div class="c" style="border-top:6px solid ' +
    m.couleur +
    '"><small>' +
    ICO(m) +
    " " +
    esc(m.nom + " › " + CH(c.ch).titre) +
    " · " +
    rv.length +
    "/" +
    c.oc.length +
    " révélée" +
    (rv.length > 1 ? "s" : "") +
    '</small><div class="ocw" style="margin-top:8px"><img id="oci" alt="Schéma"><div id="ocb">' +
    c.oc
      .map(
        (b, i) =>
          '<i role="button" tabindex="0" aria-label="Cache ' +
          (i + 1) +
          '" class="' +
          (rv.includes(i) ? "rv" : "") +
          '" style="left:' +
          b[0] * 100 +
          "%;top:" +
          b[1] * 100 +
          "%;width:" +
          b[2] * 100 +
          "%;height:" +
          b[3] * 100 +
          '%;cursor:pointer" onclick="ocR(' +
          i +
          ")\" onkeydown=\"if(event.key==='Enter')ocR(" +
          i +
          ')"></i>',
      )
      .join("") +
    '</div></div><small>Retrouve chaque légende de mémoire, puis touche son cache pour vérifier.</small><div class="r"><button class="b" onclick="ocR(-1)">Tout révéler</button>' +
    srcBtn(c) +
    "</div></div>" +
    rateBtns(c, d)
  );
}
function ocR(i) {
  const c = R.q[R.i];
  R.rv = i < 0 ? c.oc.map((_, k) => k) : (R.rv || []).filter((k) => k !== i).concat(i);
  R.seen = 1;
  render();
}
async function ocLoad() {
  const c = R.q && R.q[R.i],
    e = $("oci");
  if (!c || !e) return;
  try {
    const u = OCI[c.id] || (OCI[c.id] = await pdfGet("im:" + c.id));
    const x = $("oci");
    if (x) {
      if (u) x.src = u;
      else x.alt = "Image introuvable sur cet appareil";
    }
  } catch (x) {}
}
// ---- fiche de synthèse ----
