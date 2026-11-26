// ================= Atlas 3D =================
// Modèles anatomiques en 3D (BodyParts3D, Z-Anatomy), dans la page Atlas (/atlas, /atlas/<modèle>).
// Un seul fichier .glb par modèle, dans l'espace privé « atlas » de Supabase, partagé par tous :
// la base ne le donne qu'à l'administrateur et aux membres à qui il a ouvert l'accès (voir supabase.sql).
// Une copie est gardée sur l'appareil (cache « mr-atlas ») pour l'ouvrir hors connexion ; elle est effacée si l'accès est retiré.
const ATL = {
  // modèles : « detail » relie les fiches d'un modèle à un modèle plus détaillé (bouton « Voir en détail »)
  models: [
    { id: "thorax", titre: "Thorax", sous: "Os, muscles, organes, vaisseaux, nerfs et médiastin" },
    { id: "coeur", titre: "Cœur", sous: "Cavités, valves, piliers, coronaires et veines du cœur" },
    { id: "poumons", titre: "Poumons et arbre bronchique", sous: "Lobes, bronches jusqu’aux segments, plèvre et vaisseaux" },
    { id: "abdomen", titre: "Abdomen", sous: "Viscères, segments du foie, vaisseaux, paroi, plexus lombal" },
  ],
  detail: {
    coeur: ["right atrium", "left atrium", "right ventricle", "left ventricle", "ascending aorta", "pulmonary trunk", "superior vena cava", "inferior vena cava"],
    poumons: ["rul", "rml", "rll", "lul", "lll", "right lung", "left lung", "main bronchus", "trachea", "pleura", "pulmonary artery", "pulmonary veins"],
  },
  cache: "mr-atlas",
  colors: { os: 0xe8dcc4, cartilage: 0xaacddc, muscle: 0xc4483c, organe: 0xe2a0a8, valve: 0xf3e6c4, artere: 0xe8342a, veine: 0x3c6edc, nerf: 0xf2c94c, zone: 0x9b8cff },
  sysFr: { os: "Os", cartilage: "Cartilage", muscle: "Muscle", organe: "Organe", valve: "Valve", artere: "Artère", veine: "Veine", nerf: "Nerf", zone: "Zone" },
  sysPl: { os: "Os", cartilage: "Cartilages", muscle: "Muscles", organe: "Organes", valve: "Valves", artere: "Artères", veine: "Veines", nerf: "Nerfs", zone: "Médiastin" },
  zoneCol: { "zone sup": 0x9b8cff, "zone ant": 0x5fd4c8, "zone moy": 0xff8fab, "zone post": 0xffd166 },
  views: [["front", "Face"], ["back", "Dos"], ["side", "Profil"], ["q34", "3/4"], ["persp", "Perspective"]],
  v: null, // visualiseur ouvert
};
const atlasOk = () => !!(SY.sb && SY.user && SY.role && (SY.role == "admin" || (SY.acc ? SY.acc.atlas : SY.atl)));

// ---------- page « Atlas 3D » (/atlas) : galerie des modèles, et fichiers pour l'administrateur ----------
const ATL_ICO = {
  thorax: '<path d="M12 3v18M12 6c-3 0-6 1-7 3M12 6c3 0 6 1 7 3M12 9.5c-3 0-6 1-7 3M12 9.5c3 0 6 1 7 3M12 13c-2.6 0-5 .9-6 2.6M12 13c2.6 0 5 .9 6 2.6M12 16.5c-2 0-3.6.6-4.4 1.6M12 16.5c2 0 3.6.6 4.4 1.6"/>',
  coeur: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M12 7.4V4M9 5l1.5 2"/>',
  abdomen: '<path d="M7 4c-2 3-3 6-3 9a8 8 0 0 0 16 0c0-3-1-6-3-9"/><path d="M9 10c1.5 1 4.5 1 6 0M8.5 14c2 1.5 5 1.5 7 0"/><circle cx="12" cy="17.5" r=".8"/>',
  poumons: '<path d="M12 3v8M12 11c-1.5 0-2.5 1-3.5 2M12 11c1.5 0 2.5 1 3.5 2"/><path d="M9 7c-3 1-5 5-5 10 0 2 1.5 3 3 3s2-1 2-3zM15 7c3 1 5 5 5 10 0 2-1.5 3-3 3s-2-1-2-3z"/>',
};
// couleur d'accent de l'atlas = couleur du thème de l'utilisateur, éclaircie si besoin pour rester lisible sur le fond sombre
function atlasAccent() {
  let hex = "#5fd4c8";
  try {
    const e = document.createElement("i");
    e.style.color = "var(--tc, var(--c1))";
    document.body.appendChild(e);
    const m = getComputedStyle(e).color.match(/[\d.]+/g);
    e.remove();
    if (m && m.length >= 3) {
      let [r, g, b] = m.slice(0, 3).map((x) => +x / 255);
      const mx = Math.max(r, g, b),
        mn = Math.min(r, g, b),
        d = mx - mn;
      let h = 0,
        l = (mx + mn) / 2,
        sa = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
      if (d) h = mx == r ? ((g - b) / d) % 6 : mx == g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
      l = Math.min(0.74, Math.max(0.6, l));
      sa = d ? Math.max(0.5, sa) : 0;
      const c = (1 - Math.abs(2 * l - 1)) * sa,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        o = l - c / 2,
        [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
      hex = "#" + [R, G, B].map((v) => Math.round((v + o) * 255).toString(16).padStart(2, "0")).join("");
    }
  } catch (err) {}
  document.documentElement.style.setProperty("--atac", hex);
  return hex;
}
const atlasIco = (id) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ATL_ICO[id] || ATL_ICO.thorax) + "</svg>";
ATL.files = null; // liste des fichiers en ligne (null = pas encore lue)
async function atlasFilesLoad() {
  if (!SY.sb) return;
  const r = await SY.sb.storage.from("atlas").list("", { limit: 100 });
  ATL.files = r.error ? [] : r.data || [];
  if (tab == "atlas" && !R.atl) {
    const g = $("atgal"),
      a = $("atadm");
    if (g) g.innerHTML = atlasGallery();
    if (a) a.innerHTML = atlasAdminFiles();
  }
}
const atlasHas = (id) => !ATL.files || ATL.files.some((f) => f.name == id + ".glb" || f.name == id + "-hd.glb");
function atlasGallery() {
  return ATL.models
    .map((m) => {
      const ok = atlasHas(m.id);
      return (
        '<button class="atgc' + (ok ? "" : " off") + '" onclick="atlasGo(\'' + m.id + "')\"" + (ok ? "" : ' aria-disabled="true"') + ">" +
        '<span class="atgi">' + atlasIco(m.id) + '</span><span class="atgt"><b>' + esc(m.titre) + "</b><small>" + esc(m.sous) + "</small>" +
        (ok ? "" : '<em>Pas encore en ligne</em>') + "</span>" + icn("chev") + "</button>"
      );
    })
    .join("");
}
function atlasAdminFiles() {
  if (!ATL.files) return '<p class="m">Lecture des fichiers…</p>';
  const fmt = (f) => {
    if (!f) return '<span class="atfm">Manquant</span>';
    const d = new Date(f.updated_at || f.created_at || 0),
      sz = ((f.metadata && f.metadata.size) || 0) / 1048576;
    return "<span>" + d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + "</span><small>" + sz.toFixed(1).replace(".", ",") + " Mo</small>";
  };
  return (
    '<div class="atft">' +
    ATL.models
      .map((m) => {
        const lo = ATL.files.find((f) => f.name == m.id + ".glb"),
          hi = ATL.files.find((f) => f.name == m.id + "-hd.glb");
        return (
          '<div class="atfr"><b>' + esc(m.titre) + "</b>" +
          [["", "Téléphone", lo, m.id + ".glb"], ["-hd", "Ordinateur", hi, m.id + "-hd.glb"]]
            .map(
              (v) =>
                '<label class="atfc' + (v[2] ? "" : " miss") + '"><span class="atfk">' + v[1] + " <code>" + v[3] + "</code></span>" + fmt(v[2]) +
                '<input type="file" hidden onchange="atlasUpload(\'' + m.id + "',this.files[0],'" + v[0] + "')\"><i>Remplacer</i></label>",
            )
            .join("") +
          "</div>"
        );
      })
      .join("") +
    '</div><label class="b p atfall">Envoyer plusieurs fichiers…<input type="file" multiple hidden onchange="atlasUploadMany(this.files)"></label>' +
    '<p class="m">Le nom du fichier choisit le modèle : <code>thorax.glb</code> (téléphone), <code>thorax-hd.glb</code> (ordinateur), pareil pour <code>coeur</code> et <code>poumons</code>. Si une version manque, l’autre est utilisée.</p>'
  );
}
function atlasPage() {
  if (!atlasOk())
    return '<div class="bn"><h2 class="ti">Atlas 3D</h2><p class="m">L’atlas 3D est ouvert sur invitation. Demande l’accès à l’administrateur.</p></div>';
  if (R.atl) return '<div class="bn atwait"><p class="m">Ouverture de l’atlas…</p></div>';
  if (!ATL.files) setTimeout(atlasFilesLoad, 0);
  setTimeout(() => typeof atlasOffPaint == "function" && atlasOffPaint(), 0);
  atlasAccent();
  return (
    '<h2 class="ti">Atlas 3D</h2><p class="m atsub">Explore les structures en 3D : touche une structure pour sa fiche, écarte, coupe, fais un quiz.</p>' +
    '<div id="atgal" class="atgal">' + atlasGallery() + "</div>" +
    '<div id="atoff" class="offbar"></div>' +
    (SY.role == "admin"
      ? '<details class="bn atadmw"><summary><b>Fichiers des modèles</b><small>réservé à l’administrateur</small></summary><div id="atadm">' + atlasAdminFiles() + "</div></details>"
      : "")
  );
}
// affichage synchronisé avec l'adresse : /atlas/<modèle> ouvre le visualiseur, ailleurs on le ferme
function atlasSync() {
  const want = tab == "atlas" && R.atl && atlasOk() ? R.atl : null;
  if (!want) {
    if (ATL.v && !ATL.v.overlay) atlasClose();
    return;
  }
  if (!ATL.v || ATL.v.id !== want) atlasOpen(want, R.focus);
  else if (R.focus && ATL.v.focusName !== R.focus && ATL.v.focusBy) ATL.v.focusBy(R.focus);
}
// ouvrir un modèle : depuis la galerie, un lien dans un livret ou une correction de QCM
function atlasGo(id, focusName) {
  if (R.run) {
    // session de QCM en cours : on ouvre par-dessus, sans quitter la session
    if (!id) return atlasClose();
    return atlasOpen(id, focusName, true);
  }
  if (id && tab != "atlas") ATL.ret = { tab, R: Object.assign({}, R) };
  if (!id && ATL.ret) {
    // retour à la page d'où l'on venait (livret…)
    const r = ATL.ret;
    ATL.ret = null;
    tab = r.tab;
    R = r.R;
    return render();
  }
  clearInterval(IV);
  tab = "atlas";
  R = id ? { atl: id, focus: focusName || "" } : {};
  render();
  if (!id) scrollTo(0, 0);
}

// ---------- accès retiré : on efface la copie locale ----------
function atlasForget() {
  try {
    if (window.caches) caches.delete(ATL.cache);
  } catch (e) {}
}

// ---------- fichier du modèle : copie locale à jour, sinon téléchargement ----------
// Deux niveaux de détail : « <id>-hd.glb » (plus fin) pour les ordinateurs s'il existe, sinon « <id>.glb ».
// version détaillée seulement sur un ordinateur assez puissant (et pas en mode « Économie »)
const atlasWantHD = () => {
  let eco = false;
  try {
    eco = JSON.parse(localStorage.getItem("mr_atlas_aff") || "{}").q == "eco";
  } catch (e) {}
  return !eco && matchMedia("(pointer: fine)").matches && Math.min(screen.width, screen.height) >= 700 && (navigator.hardwareConcurrency || 8) >= 6 && (navigator.deviceMemory || 8) >= 8;
};
async function atlasFile(id, force) {
  const ca = window.caches ? await caches.open(ATL.cache).catch(() => null) : null,
    st = SY.sb.storage.from("atlas");
  let name = id + ".glb",
    maj = null,
    online = navigator.onLine !== false;
  if (online) {
    // la liste ne renvoie les fichiers que si la base autorise ce compte : c'est aussi le contrôle d'accès
    const r = await st.list("", { search: id });
    if (r.error) {
      if (/fetch|network/i.test(r.error.message || "")) online = false;
      else throw r.error;
    } else {
      const fs = r.data || [],
        hdF = fs.find((x) => x.name === id + "-hd.glb"),
        loF = fs.find((x) => x.name === id + ".glb"),
        // version voulue (détaillée sur ordinateur, légère sur téléphone), sinon l'autre
        f = atlasWantHD() ? hdF || loF : loF || hdF;
      if (!f) {
        if (ca) await ca.delete("/atlas/" + id + ".glb");
        throw new Error(SY.role == "admin" ? "absent" : "refuse");
      }
      name = f.name;
      maj = f.updated_at || f.created_at || "";
    }
  }
  let old = ca ? await ca.match("/atlas/" + name) : null;
  if (!old && !online && ca) old = (await ca.match("/atlas/" + id + "-hd.glb")) || (await ca.match("/atlas/" + id + ".glb"));
  if (old && (!online || (!force && old.headers.get("x-maj") === maj))) return old.arrayBuffer();
  if (!online) throw new Error("horsligne");
  const { data, error } = await st.download(name);
  if (error) throw error;
  const buf = await data.arrayBuffer();
  if (ca)
    await ca
      .put("/atlas/" + name, new Response(buf.slice(0), { headers: { "content-type": "model/gltf-binary", "x-maj": maj || "" } }))
      .catch(() => {});
  return buf;
}

// ---------- three.js, chargé seulement quand on ouvre l'atlas ----------
function atlasLib() {
  if (window.ATLAS3D) return Promise.resolve(window.ATLAS3D);
  return new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = "vendor/three-atlas.js";
    s.onload = () => (window.ATLAS3D ? ok(window.ATLAS3D) : ko(new Error("lib")));
    s.onerror = () => ko(new Error("lib"));
    document.head.appendChild(s);
  });
}

// ---------- icônes des outils ----------
const ATI = {
  struct: '<path d="M4 6h16M4 12h10M4 18h13"/><circle cx="19" cy="12" r="1.6"/>',
  disp: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  ex: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5"/><path d="m9 5 3-2 3 2M9 19l3 2 3-2M5 9l-2 3 2 3M19 9l2 3-2 3"/>',
  cut: '<path d="M4 15h16" stroke-dasharray="3 2"/><path d="M7 15V7a5 5 0 0 1 10 0v8"/>',
  lay: '<path d="m12 4 8 4-8 4-8-4z"/><path d="m4 12 8 4 8-4M4 16l8 4 8-4"/>',
  tr: '<rect x="4" y="4" width="11" height="11" rx="2"/><rect x="9" y="9" width="11" height="11" rx="2" stroke-dasharray="2 2"/>',
  mes: '<path d="m4 16 12-12 4 4L8 20z"/><path d="m8 12 2 2M11 9l2 2M14 6l2 2"/>',
  med: '<path d="M12 4c-3 0-5 2-5 5v6c0 3 2 5 5 5s5-2 5-5V9c0-3-2-5-5-5z"/><path d="M7 12h10M12 4v16" stroke-dasharray="2 2"/>',
  anim: '<path d="M3 12h3l2-5 4 10 3-7 2 2h4"/>',
  tour: '<path d="M5 20V5M5 5h11l-2 3 2 3H5"/><circle cx="17" cy="18" r="2"/>',
  hb: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M7 12h2l1.5-2 2 4 1.5-2h3"/>',
  trj: '<path d="M4 18c3 0 3-5 6-5s3 5 6 5 3-8 4-12"/><circle cx="4" cy="18" r="1.6"/>',
  br: '<path d="M12 4v6M12 10c-2 0-6 2-6 7 0 2 1 3 3 3 2 0 3-2 3-4M12 10c2 0 6 2 6 7 0 2-1 3-3 3-2 0-3-2-3-4"/>',
  quiz: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  lab: '<path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  ar: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="m12 7 4 2.3v4.6L12 16l-4-2.1V9.3z"/>',
  vues: '<path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z"/>',
  pres: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="m10 8 4 2-4 2z" fill="currentColor"/>',
  cmp: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>',
  help: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
};
const atIco = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ATI[k] + "</svg>";
// bouton retour du visualiseur : galerie des atlas, ou page d'origine (livret, QCM)
function atlasExit() {
  if (ATL.v && ATL.v.overlay) return atlasClose();
  atlasGo();
}

// ---------- ouverture du visualiseur ----------
async function atlasOpen(id, focusName, overlay) {
  if (ATL.v) atlasClose(true);
  const m = ATL.models.find((x) => x.id === id) || ATL.models[0],
    d = document.createElement("div");
  id = m.id;
  d.id = "atl";
  d.setAttribute("role", "dialog");
  d.setAttribute("aria-modal", "true");
  d.setAttribute("aria-label", "Atlas 3D : " + m.titre);
  const dock = (k, t, extra) => '<button data-k="' + k + '" title="' + t + '"' + (extra || "") + ">" + atIco(k) + "<span>" + t + "</span></button>",
    ar = (() => {
      try {
        return document.createElement("a").relList.supports("ar");
      } catch (e) {
        return false;
      }
    })();
  d.innerHTML =
    '<canvas id="atc"></canvas>' +
    '<div id="atlbl"></div><div id="atgl"></div><div id="atmeas"></div><div id="athov" hidden></div>' +
    '<header class="atb atop"><button class="atx" id="atback0" aria-label="Retour aux atlas" title="Retour aux atlas">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<div class="atmsw"><button id="atmsw" aria-haspopup="listbox" aria-expanded="false"><b>' + esc(m.titre) + '</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>' +
    '<div id="atmlist" role="listbox" hidden>' +
    ATL.models
      .map((x) => '<button role="option" data-m="' + x.id + '"' + (x.id == id ? ' class="on" aria-selected="true"' : "") + "><b>" + esc(x.titre) + "</b><small>" + esc(x.sous) + "</small></button>")
      .join("") +
    "</div></div>" +
    '<div class="ats"><input id="atq" type="search" placeholder="Rechercher…" autocomplete="off" aria-label="Rechercher une structure"><div id="atsug" role="listbox"></div></div>' +
    '<div class="atv">' +
    ATL.views.map((v, i) => '<button data-v="' + v[0] + '"' + (i ? "" : ' class="on"') + ">" + v[1] + "</button>").join("") +
    "</div></header>" +
    '<div id="atdock" class="atb" role="toolbar" aria-label="Outils">' +
    dock("struct", "Structures") +
    dock("disp", "Affichage") +
    dock("ex", "Écarter") +
    dock("cut", "Coupe") +
    dock("lay", "Couches", ' data-x="1"') +
    dock("tr", "Transparence", ' data-x="1"') +
    dock("mes", "Mesurer", ' data-y="1"') +
    dock("med", "Médiastin", ' data-x="1" hidden') +
    dock("anim", "Animations", ' data-x="1" hidden') +
    dock("tour", "Parcours", ' data-x="1"') +
    dock("vues", "Vues", ' data-x="1"') +
    dock("lab", "Étiquettes", ' data-y="1" class="on"') +
    dock("pres", "Présentation", ' data-y="1"') +
    dock("quiz", "Quiz") +
    dock("more", "Plus") +
    "</div>" +
    '<section id="atsheet" class="atb" hidden aria-live="polite"><div class="atsh-h"><b id="atsht"></b>' +
    '<button id="atshc" title="Réduire" aria-label="Réduire"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>' +
    '<button id="atshx" title="Fermer" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div id="attool"></div></section>' +
    '<div id="atcorner"><svg id="atgiz" viewBox="-50 -50 100 100" role="group" aria-label="Orientation : touche une direction"></svg>' +
    '<div class="atzm"><button id="atzi" title="Zoomer (+)">+</button><button id="atzo" title="Dézoomer (−)">−</button>' +
    '<button id="atback" title="Vue précédente (Retour arrière)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></svg></button>' +
    '<button id="atreset" title="Réinitialiser la vue (R)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6"/><path d="M4 4v4.6h4.6"/></svg></button>' +
    '<button id="atgrid" title="Quadrillage 3D (G)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM4 10h16M4 16h16M10 4v16M16 4v16"/></svg></button></div>' +
    '<div id="atscale"><i></i><span></span></div></div>' +
    '<div id="athelpbox" class="atb" hidden></div>' +
    '<button id="atpresx" aria-label="Quitter la présentation">✕ Quitter</button>' +
    '<div id="atquiz" class="atb" hidden></div>' +
    '<aside id="atpan" aria-live="polite"></aside>' +
    '<div id="atmsg">Chargement du modèle…</div>' +
    '<small id="atcr">BodyParts3D © DBCLS · CC BY 4.0</small>';
  document.body.appendChild(d);
  document.documentElement.classList.add("atlon");
  ATL.v = { id, alive: true, ar, overlay: !!overlay, focusName: focusName || "", acc: atlasAccent() };
  ATL.key = (e) => ATL.v && ATL.v.onKey && ATL.v.onKey(e);
  addEventListener("keydown", ATL.key);
  ATL.keyup = (e) => ATL.v && ATL.v.onKeyUp && ATL.v.onKeyUp(e);
  ATL.blur = () => ATL.v && ATL.v.onBlur && ATL.v.onBlur();
  addEventListener("keyup", ATL.keyup);
  addEventListener("blur", ATL.blur);
  $("atback0").onclick = () => atlasExit();
  $("atmsw").onclick = (e) => {
    e.stopPropagation();
    const l = $("atmlist");
    l.hidden = !l.hidden;
    $("atmsw").setAttribute("aria-expanded", String(!l.hidden));
  };
  d.addEventListener("click", (e) => !e.target.closest(".atmsw") && $("atmlist") && ($("atmlist").hidden = true));
  d.querySelectorAll("#atmlist button").forEach((b) => (b.onclick = () => b.dataset.m != id && (overlay ? atlasOpen(b.dataset.m, "", true) : atlasGo(b.dataset.m))));
  try {
    const [lib, buf] = await Promise.all([atlasLib(), atlasFile(id)]);
    if (!ATL.v || ATL.v.id !== id || !ATL.v.alive) return;
    atlasView(lib, buf, m, focusName);
  } catch (e) {
    const k = e && e.message,
      t =
        k == "absent"
          ? "Ce modèle n’est pas encore en ligne." + (SY.role == "admin" ? " Envoie ses fichiers depuis la page Atlas (section « Fichiers des modèles »)." : "")
          : k == "refuse"
            ? "Tu n’as pas accès à l’atlas 3D. Demande à l’administrateur."
            : k == "horsligne"
              ? "Pas de connexion : ce modèle n’a pas encore été téléchargé sur cet appareil."
              : k == "lib"
                ? "Impossible de charger le moteur 3D. Vérifie ta connexion puis réessaie."
                : "Erreur : " + (k || "inconnue");
    if ($("atmsg")) $("atmsg").textContent = t;
    if (k == "refuse") {
      SY.atl = false;
      if (SY.acc) SY.acc.atlas = false;
      atlasForget();
    }
  }
}

// texte sans accents ni majuscules, pour la recherche
const atNorm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .toLowerCase();

// Couleurs « réalistes » (teintes d'atlas illustré) selon la fiche, sinon selon le système
const ATL_REAL = {
  sys: { os: 0xe6d8bc, cartilage: 0xdde6e8, muscle: 0x9c2b22, organe: 0xc98b85, valve: 0xeadfc6, artere: 0xb8322a, veine: 0x3a57a0, nerf: 0xe8d27a, zone: 0x9b8cff },
  fiche: {
    "intervertebral disk": 0xd7dccf, "right atrium": 0x9b4a3c, "left atrium": 0x9b4a3c, "right ventricle": 0x86362b, "left ventricle": 0x86362b,
    "right lung": 0xd9a0a0, "left lung": 0xd9a0a0, trachea: 0xdccbbb, "main bronchus": 0xdccbbb, esophagus: 0xc0766a, thymus: 0xd9b48c,
    "pulmonary trunk": 0x4a62b0, "pulmonary artery": 0x4a62b0, diaphragm: 0xa1362a, "pulmonary veins": 0xb8322a,
    "papillary rv": 0x8f3a2e, "papillary lv": 0x8f3a2e, "ascending aorta": 0xb8322a, "superior vena cava": 0x3a57a0, "inferior vena cava": 0x3a57a0,
    "coronary sinus": 0x34508f, "tricuspid valve": 0xe6dcc2, "mitral valve": 0xe6dcc2, "aortic valve": 0xece2c8, "pulmonary valve": 0xece2c8,
    liver: 0x7d3328, "liver segments": 0x86392d, gallbladder: 0x5d7d3b, "bile duct": 0x76903e, stomach: 0xd59b8b, duodenum: 0xd8a08e, jejunum: 0xdba595,
    "ascending colon": 0xcf9b7d, "transverse colon": 0xcf9b7d, "descending colon": 0xcf9b7d, "sigmoid colon": 0xcf9b7d, appendix: 0xd6a189,
    pancreas: 0xe2c28c, "pancreatic ducts": 0xe8d8b0, spleen: 0x6f2b3c, kidney: 0x8b3b2f, "renal pelvis": 0xe6d4a6, ureter: 0xe6d4a6,
    "suprarenal gland": 0xd8a442, "greater omentum": 0xefd48e, "lesser omentum": 0xefd8a0, mesocolon: 0xefd8a0, "portal vein": 0x4a62b0,
    rul: 0xe0a9a4, rml: 0xd99e9a, rll: 0xe0a9a4, lul: 0xe0a9a4, lll: 0xd99e9a, pleura: 0xe9d6d2, "segmental bronchi": 0xdccbbb, "lobar bronchi": 0xdccbbb, "intermediate bronchus": 0xdccbbb,
  },
  rough: { os: 0.8, cartilage: 0.45, muscle: 0.55, organe: 0.5, valve: 0.5, artere: 0.35, veine: 0.35, nerf: 0.5, zone: 0.9 },
};
// Couches de profondeur : 0 = le plus superficiel
const ATL_LAYERS = ["Tout", "Sans muscles superficiels", "Sans muscles de la paroi", "Sans intercostaux ni ceinture scapulaire", "Sans squelette", "Médiastin seul"];
const ATL_LAYER_OF = {
  "pectoralis major": 0, "serratus anterior": 0,
  "pectoralis minor": 1, subclavius: 1, "serratus posterior superior": 1, "serratus posterior inferior": 1, subscapularis: 1, "external intercostal muscle": 1,
  "internal intercostal muscle": 2, "innermost intercostal muscle": 2, clavicle: 2, scapula: 2,
  "transversus thoracis": 3, "internal thoracic artery": 3, "internal thoracic vein": 3,
  diaphragm: 4, thymus: 4, "right lung": 4, "left lung": 4,
  "long thoracic nerve": 1, "intercostal nerves": 2, rul: 4, rml: 4, rll: 4, lul: 4, lll: 4, pleura: 4,
};

// ---------- visualiseur ----------
function atlasView(L, buf, model, focusName) {
  const T = L.THREE,
    V = ATL.v,
    canvas = $("atc"),
    dk = (k) => document.querySelector('#atdock [data-k="' + k + '"]'),
    fine = matchMedia("(pointer: fine)").matches,
    renderer = new T.WebGLRenderer({ canvas, antialias: true, stencil: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, fine ? 1.75 : 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  const scene = new T.Scene(),
    camP = new T.PerspectiveCamera(35, 1, 0.01, 50),
    camO = new T.OrthographicCamera(-1, 1, 1, -1, 0.01, 50),
    controls = new L.OrbitControls(camP, canvas),
    ORIGIN = new T.Vector3();
  // fond : dégradé radial doux (plus clair derrière le modèle)
  {
    const cv = document.createElement("canvas"),
      g = cv.getContext("2d");
    cv.width = cv.height = 512;
    const gr = g.createRadialGradient(256, 230, 20, 256, 256, 380);
    gr.addColorStop(0, "#" + new T.Color("#26354a").lerp(new T.Color(V.acc || "#5fd4c8"), 0.14).getHexString());
    gr.addColorStop(0.55, "#141c28");
    gr.addColorStop(1, "#07090e");
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 512);
    const tx = new T.CanvasTexture(cv);
    tx.colorSpace = T.SRGBColorSpace;
    scene.background = tx;
    V.bgTex = tx;
  }
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  scene.add(new T.HemisphereLight(0xffffff, 0x334455, 1.5));
  const key = new T.DirectionalLight(0xffffff, 2.2);
  key.position.set(1, 2, 3);
  const key2 = key.clone();
  camP.add(key);
  camO.add(key2);
  scene.add(camP, camO);
  Object.assign(V, {
    renderer, controls, cam: camP,
    parts: [], labels: [], fiches: {}, radius: 0.3, gridR: 0.5, ext: new T.Vector3(0.2, 0.2, 0.2),
    f: 0, mode: "eclate", exDir: "all", exScope: "all", anim: null, sel: null, sels: new Set(), multi: false,
    hSys: new Set(), hOne: new Set(), iso: null, layer: 0, showLbl: true,
    dirty: true, idleT: 0, view: "front", opac: 1,
    clip: { axis: "", pos: 0, plane: new T.Plane(new T.Vector3(0, -1, 0), 0), caps: false },
    breath: { on: false, ready: false, t0: 0, s: 0 }, hb: { on: false, speed: 1, snd: true }, path: null, tour: null, quiz: null, tool: "",
    opSys: "muscle", real: false, relief: true, ao: false, outline: true, qMode: "auto", focus: false, xray: false, ortho: false, grid: false,
    hist: [], meas: { on: false, pts: [] },
  });
  try {
    const pr = JSON.parse(localStorage.getItem("mr_atlas_aff") || "{}");
    ["real", "relief", "outline", "focus", "xray", "ortho"].forEach((k) => typeof pr[k] == "boolean" && (V[k] = pr[k]));
    if (pr.ao2 === true) V.ao = true; // ombres de contact : seulement si on les a réactivées depuis la correction
    if (["auto", "high", "eco"].includes(pr.q)) V.qMode = pr.q;
  } catch (e) {}
  const prefSave = () => {
    try {
      localStorage.setItem("mr_atlas_aff", JSON.stringify({ real: V.real, relief: V.relief, ao2: V.ao, outline: V.outline, focus: V.focus, xray: V.xray, ortho: V.ortho, q: V.qMode }));
    } catch (e) {}
  };
  // rendu à la demande : on ne redessine que quand quelque chose bouge
  const need = () => {
    V.dirty = true;
    clearTimeout(V.idleT);
    V.idleT = setTimeout(occlusion, 180);
  };
  V.need = need;
  controls.addEventListener("change", need);
  // pendant qu'on fait tourner le modèle : rendu simple (sans ombres de contact), plus fluide
  controls.addEventListener("start", () => {
    histPush();
    V.moving = true;
  });
  controls.addEventListener("end", () => {
    clearTimeout(V.movT);
    V.movT = setTimeout(() => {
      V.moving = false;
      need();
    }, 120);
  });

  // ---------- effets : ombres de contact (GTAO) et contour de la sélection ----------
  let composer = null,
    gtao = null,
    outline = null,
    rpass = null;
  function fxBuild() {
    if (composer) composer.dispose();
    composer = null;
    gtao = null;
    outline = null;
    if (!V.ao && !V.outline) return need();
    const w = canvas.clientWidth || 1,
      h = canvas.clientHeight || 1,
      pr = renderer.getPixelRatio(),
      rt = new T.WebGLRenderTarget(w * pr, h * pr, { type: T.HalfFloatType, stencilBuffer: true });
    composer = new L.EffectComposer(renderer, rt);
    rpass = new L.RenderPass(scene, V.cam);
    composer.addPass(rpass);
    if (V.ao) {
      gtao = new L.GTAOPass(scene, V.cam, w, h);
      gtao.blendIntensity = 0.85;
      gtao.updateGtaoMaterial({ radius: 0.025, distanceExponent: 1, thickness: 1, scale: 1, samples: 12 });
      composer.addPass(gtao);
    }
    if (V.outline) {
      outline = new L.OutlinePass(new T.Vector2(w, h), scene, V.cam);
      outline.edgeStrength = 4;
      outline.edgeThickness = 1.5;
      outline.visibleEdgeColor.set(V.acc || 0x5fd4c8);
      outline.hiddenEdgeColor.set(new T.Color(V.acc || 0x5fd4c8).multiplyScalar(0.35));
      composer.addPass(outline);
    }
    composer.addPass(new L.OutputPass());
    composer.setSize(w, h);
    need();
  }
  function draw() {
    if (outline) outline.selectedObjects = [...V.sels].map((p) => p.mesh);
    const busy = V.moving || V.anim || FADE || V.breath.on || V.hb.on || V.path || V.pres || V.keys.size;
    const useFx = composer && !busy && !V.fxFail && (V.ao || (outline && V.sels.size));
    if (useFx) {
      try {
        composer.render();
      } catch (e) {
        V.fxFail = true; // un effet qui plante ne doit jamais bloquer l'affichage
        renderer.render(scene, V.cam);
      }
      return;
    }
    renderer.render(scene, V.cam);
  }
  // ---------- qualité automatique : si l'appareil peine, on allège l'affichage par paliers ----------
  // 0 complet · 1 résolution réduite, sans ombres de contact · 2 sans relief ni contour · 3 résolution basse
  const DPR = devicePixelRatio || 1;
  V.q = { lvl: 0, ema: 16, n: 0, warned: false };
  function qualityApply(l, quiet) {
    V.q.lvl = l;
    renderer.setPixelRatio(Math.min(DPR, [fine ? 1.75 : 1.5, 1.25, 1, 0.8][l]));
    if (l >= 1 && V.ao) V.ao = false;
    if (l >= 2) {
      V.outline = false;
      if (V.relief) {
        V.relief = false;
        materials(true);
      }
    }
    fxBuild();
    resize();
    if (!quiet && !V.q.warned) {
      V.q.warned = true;
      toast("Affichage allégé automatiquement pour rester fluide (Affichage → Qualité).");
    }
  }
  function perfTick(t0, dt) {
    if (V.qMode != "auto" || V.q.lvl >= 3) return;
    // on mesure seulement pendant un mouvement continu (rotation, animation)
    if (!(V.moving || V.anim || V.breath.on || V.hb.on || V.path || V.pres || FADE)) return;
    V.q.ema = V.q.ema * 0.9 + dt * 1000 * 0.1;
    if (++V.q.n > 20 && V.q.ema > 34) {
      V.q.n = 0;
      V.q.ema = 16;
      qualityApply(V.q.lvl + 1);
    }
  }

  // ---------- matériaux : couleurs, relief, transparence, rayons X, focus ----------
  const NOISE = `
  float atH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float atN(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(atH(i), atH(i + vec3(1,0,0)), f.x), mix(atH(i + vec3(0,1,0)), atH(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(atH(i + vec3(0,0,1)), atH(i + vec3(1,0,1)), f.x), mix(atH(i + vec3(0,1,1)), atH(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
  // Relief « réaliste » calculé dans le shader (aucune texture à télécharger), un motif par type de tissu :
  // muscle (fibres), os (grain), myocarde (fibres fines, teinte nuancée), poumon (parenchyme spongieux, lobules, petites taches),
  // voies aériennes (anneaux cartilagineux), vaisseaux (paroi lisse et brillante), nerfs (fascicules), tissus mous (valves, thymus, œsophage).
  const RELIEF = {
    muscle:
      "vec3 q = vAtW * 1000.0; float s = dot(q, atFib); vec3 qq = (q - atFib * s) * 0.9; vec3 gr = atG(qq); gr -= atFib * dot(gr, atFib); atBump(gr, 1.6); diffuseColor.rgb *= 0.93 + 0.14 * atN(qq);",
    os: "vec3 q = vAtW * 1600.0; atBump(atG(q), 0.9); diffuseColor.rgb *= 0.95 + 0.08 * atN(q * 0.5);",
    myo:
      "vec3 q = vAtW * 1000.0; float s = dot(q, atFib); vec3 qq = (q - atFib * s) * 1.4; vec3 gr = atG(qq); gr -= atFib * dot(gr, atFib); atBump(gr + 0.35 * atG(q * 0.35), 0.85);" +
      "diffuseColor.rgb *= 0.9 + 0.18 * atN(q * 0.25); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 0.98, 0.86), 0.5 * atN(q * 0.05 + 3.1));",
    lung:
      "vec3 q = vAtW * 1000.0; atBump(atG(q * 2.4) * 0.7 + atG(q * 0.55) * 0.8, 1.15); float lob = abs(atN(q * 0.22) - 0.5); diffuseColor.rgb *= 0.84 + 0.22 * atN(q * 0.4) - 0.1 * smoothstep(0.04, 0.0, lob);" +
      "float sp = smoothstep(0.8, 0.86, atN(q * 1.6 + 7.0)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.24, 0.26), sp * 0.4);",
    air:
      "vec3 q = vAtW * 1000.0; float s = dot(q, atFib) * 1.55; atBump(atFib * cos(s) * 0.55 + atG(q * 1.2) * 0.25, 1.0); diffuseColor.rgb *= 0.88 + 0.16 * (0.5 + 0.5 * sin(s));",
    vessel: "vec3 q = vAtW * 1000.0; float s = dot(q, atFib); atBump(atG(q * 0.8) * 0.5 + atG(vec3(s * 0.15, 0.0, 0.0) + q * 0.05) * 0.3, 0.45); diffuseColor.rgb *= 0.92 + 0.12 * atN(q * 0.3);",
    nerf: "vec3 q = vAtW * 1000.0; float s = dot(q, atFib); vec3 qq = (q - atFib * s) * 2.4; vec3 gr = atG(qq); gr -= atFib * dot(gr, atFib); atBump(gr, 0.9); diffuseColor.rgb *= 0.92 + 0.14 * atN(qq);",
    soft: "vec3 q = vAtW * 1000.0; atBump(atG(q * 1.1) * 0.6 + atG(q * 0.3) * 0.4, 0.6); diffuseColor.rgb *= 0.93 + 0.12 * atN(q * 0.35);",
  };
  const AT_MYO = /^(right|left) (atrium|ventricle)$|^papillary/,
    AT_LUNG = /^(rul|rml|rll|lul|lll|right lung|left lung)$/,
    AT_AIR = /^(trachea|main bronchus|intermediate bronchus|lobar bronchi|segmental bronchi)$/;
  function reliefKind(p) {
    const sy = p.meta.systeme,
      f = p.meta.fiche || "";
    if (sy == "zone" || f == "pleura") return "";
    if (AT_MYO.test(f)) return "myo";
    if (AT_LUNG.test(f)) return "lung";
    if (AT_AIR.test(f)) return "air";
    if (sy == "muscle" || sy == "os" || sy == "nerf") return sy;
    if (sy == "artere" || sy == "veine") return "vessel";
    if (sy == "cartilage") return "os";
    return "soft";
  }
  function reliefPatch(mt, kind, fiber) {
    mt.onBeforeCompile = (sh) => {
      sh.uniforms.atFib = { value: fiber };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vAtW;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvAtW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vAtW;\nuniform vec3 atFib;" + NOISE +
            "\nvec3 atG(vec3 p){ float n = atN(p); return vec3(atN(p+vec3(0.31,0,0)), atN(p+vec3(0,0.31,0)), atN(p+vec3(0,0,0.31))) - n; }" +
            "\n#define atBump(g, k) normal = normalize(normal + (k) * (viewMatrix * vec4((g), 0.0)).xyz)",
        )
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n{" + RELIEF[kind] + "}");
    };
    mt.customProgramCacheKey = () => "atrelief2-" + kind;
  }
  function hashStr(s) {
    let h = 7;
    for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  }
  function colorOf(p) {
    if (p.meta.systeme == "zone") return ATL.zoneCol[p.meta.fiche] || ATL.colors.zone;
    if (!V.real) return ATL.colors[p.meta.systeme] || 0xcccccc;
    const base = ATL_REAL.fiche[p.meta.fiche] ?? ATL_REAL.sys[p.meta.systeme] ?? 0xcccccc,
      c = new T.Color(base);
    c.offsetHSL(0, 0, ((hashStr(p.meta.fiche || p.meta.fr) % 100) / 100 - 0.5) * 0.08);
    return c.getHex();
  }
  const selEm = new T.Color(V.acc || 0x5fd4c8).multiplyScalar(0.33);
  // opacité voulue d'une structure (transparence, rayons X, focus, structures « en retrait » pendant une animation ou un parcours)
  function opOf(p) {
    const sys = p.meta.systeme;
    let op = 1;
    if (sys == "zone") op = 0.3;
    else if (sys == "organe" && p.meta.fiche == "pleura") op = 0.35;
    if (V.xray) op = Math.min(op, 0.28);
    if (sys == V.opSys) op = Math.min(op, V.opac);
    if (V.focus && V.sels.size && !V.sels.has(p)) op = Math.min(op, 0.1);
    if (V.ghost && !V.ghost.has(p)) op = Math.min(op, 0.1);
    return op;
  }
  // fondu : opacité et visibilité changent en douceur au lieu d'apparaître ou disparaître d'un coup
  let FADE = null;
  function fadeTo(dur) {
    const list = [];
    for (const p of V.parts) {
      const was = p.mesh.visible,
        will = visible(p),
        mt = p.mesh.material,
        o0 = was ? mt.opacity : 0,
        o1 = will ? opOf(p) : 0;
      if (!was && !will) continue;
      if (Math.abs(o0 - o1) < 0.01 && was === will) continue;
      if (!was && will) p.mesh.visible = true;
      list.push([p, o0, o1, will]);
    }
    if (!list.length) return materials();
    for (const [p] of list) {
      const mt = p.mesh.material;
      if (!mt.transparent) mt.needsUpdate = true;
      mt.transparent = true;
      mt.depthWrite = false;
    }
    FADE = { t0: performance.now(), dur: dur || 450, list, map: new Set(list.map((x) => x[0])) };
    need();
  }
  function fadeTick(now) {
    const F = FADE,
      k = Math.min(1, Math.max(0, (now - F.t0) / F.dur)),
      e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    for (const [p, o0, o1] of F.list) p.mesh.material.opacity = o0 + (o1 - o0) * e;
    if (k >= 1) {
      FADE = null;
      for (const [p, , , will] of F.list) if (!will) p.mesh.visible = false;
      materials();
      if (V.tool == "struct") treePaint();
    }
    V.dirty = true;
  }
  function materials(rebuild) {
    for (const p of V.parts) {
      const sys = p.meta.systeme;
      let mt = p.mesh.material;
      if (rebuild) {
        const old = mt;
        mt = new T.MeshStandardMaterial({ roughness: V.real ? ATL_REAL.rough[sys] ?? 0.6 : 0.65, metalness: 0 });
        const rk = V.real && V.relief ? reliefKind(p) : "";
        if (rk) reliefPatch(mt, rk, p.fib);
        if (V.real && (rk == "lung" || rk == "myo")) mt.roughness = rk == "lung" ? 0.62 : 0.48;
        mt.clippingPlanes = old.clippingPlanes;
        mt.side = old.side;
        p.mesh.material = mt;
        old.dispose();
      }
      mt.color.setHex(colorOf(p));
      const op = opOf(p);
      if (FADE && FADE.map.has(p)) continue; // un fondu est en cours sur cette structure
      const tr = op < 0.99;
      if (mt.transparent !== tr) mt.needsUpdate = true;
      mt.transparent = tr;
      mt.opacity = op;
      mt.depthWrite = !tr;
      if (sys == "zone" || p.meta.fiche == "pleura") mt.side = mt.clippingPlanes && mt.clippingPlanes.length ? mt.side : T.DoubleSide;
      if (V.sels.has(p)) mt.emissive.copy(selEm).multiplyScalar(p === V.sel ? 1 : 0.62);
      else mt.emissive.setHex(0);
    }
    need();
  }

  // ---------- chargement ----------
  const loader = new L.GLTFLoader().setMeshoptDecoder(L.MeshoptDecoder);
  loader.parse(
    buf,
    "",
    (g) => {
      if (ATL.v !== V) return;
      const root = g.scene;
      scene.add(root);
      const box = new T.Box3().setFromObject(root);
      root.position.sub(box.getCenter(new T.Vector3()));
      root.updateMatrixWorld(true);
      V.root = root;
      V.mc = root.worldToLocal(new T.Vector3());
      V.ext = box.getSize(new T.Vector3()).multiplyScalar(0.5);
      V.radius = V.ext.length();
      V.fiches = (g.asset && g.asset.extras && g.asset.extras.fiches) || {};
      // couches propres au modèle (ex. paroi abdominale), sinon celles du thorax
      V.LC = (g.asset && g.asset.extras && g.asset.extras.couches) || null;
      V.LN = V.LC ? V.LC.names : ATL_LAYERS;
      if (g.asset && g.asset.extras && g.asset.extras.source)
        $("atcr").textContent = /Z-Anatomy/.test(g.asset.extras.source) ? "BodyParts3D © DBCLS · CC BY 4.0 · Z-Anatomy · CC BY-SA 4.0" : "BodyParts3D © DBCLS · CC BY 4.0";
      const present = new Set();
      root.traverse((o) => {
        if (!o.isMesh) return;
        let n = o,
          x = null;
        while (n && !(x = n.userData && n.userData.fr ? n.userData : null)) n = n.parent;
        if (!x) return;
        if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
        // arbre de volumes englobants : toucher / survoler devient instantané
        try {
          if (o.geometry.computeBoundsTree) o.geometry.computeBoundsTree();
        } catch (e) {}
        o.material = new T.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.65, metalness: 0 });
        o.renderOrder = 100;
        const wb = new T.Box3().setFromObject(o),
          size = wb.getSize(new T.Vector3()),
          p = {
            mesh: o, base: o.position.clone(), q0: o.quaternion.clone(), s0: o.scale.clone(),
            c: root.worldToLocal(wb.getCenter(new T.Vector3())), size, meta: x,
            layer: V.LC ? V.LC.of[x.fiche] ?? (x.systeme == "muscle" ? 0 : V.LC.names.length - 1) : ATL_LAYER_OF[x.fiche] ?? (x.systeme == "os" || x.systeme == "cartilage" ? 3 : x.systeme == "muscle" ? 1 : 5),
            zone: x.systeme == "zone",
          };
        // axe des fibres (relief des muscles) : la plus grande dimension
        p.fib = size.x >= size.y && size.x >= size.z ? new T.Vector3(1, 0, 0) : size.y >= size.z ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1);
        const fi = V.fiches[x.fiche] || {};
        p.key = atNorm([x.fr, fi.titre, fi.cat, ATL.sysFr[x.systeme], x.en].join(" "));
        o.userData.part = p;
        V.parts.push(p);
        present.add(x.systeme);
        if (x.cache) V.hOne.add(p); // masquée à l'ouverture (plèvre, médiastin…)
        if (x.repere) {
          o.geometry.computeBoundingBox();
          const el = document.createElement("button");
          el.className = "atlb";
          el.innerHTML = '<i style="background:#' + (ATL.colors[x.systeme] || 0xcccccc).toString(16).padStart(6, "0") + '"></i><em></em><span>' + esc(x.repere) + "</span>";
          el.onclick = () => (V.quiz ? null : select(p));
          $("atlbl").appendChild(el);
          V.labels.push({ p, el, local: o.geometry.boundingBox.getCenter(new T.Vector3()) });
        }
      });
      V.present = present;
      dk("med").hidden = !present.has("zone");
      // la respiration n'a de sens que s'il y a des côtes à animer
      dk("anim").hidden = !(breathKind() || hbOk() || pathsOf().length);
      toursLoad();
      if (V.tool) toolPanel(V.tool, true);
      if (!present.has("muscle")) V.opSys = "organe";
      atlasIndexSave(model.id, V.parts, V.fiches);
      pinsBuild();
      vis();
      grid();
      materials(true);
      fxBuild();
      if (V.qMode == "eco") qualityApply(2, true);
      if (V.ortho) setOrtho(true, false);
      setView("front", false);
      V.hist = [];
      need();
      if ($("atmsg")) $("atmsg").remove();
      V.focusBy = (n) => {
        V.focusName = n;
        const t = atNorm(n),
          p = V.parts.find((x) => atNorm(x.meta.fr) === t) || search(n)[0];
        if (p) setTimeout(() => focusPart(p), 300);
      };
      if (focusName) V.focusBy(focusName);
      // révision du jour : quiz lancé tout seul sur les structures à retravailler
      if (ATL.auto) {
        ATL.auto = null;
        setTimeout(() => ATL.v === V && quizStart("nom"), 700);
      }
    },
    (e) => {
      if ($("atmsg")) $("atmsg").textContent = "Fichier 3D illisible : " + (e && e.message ? e.message : "erreur");
    },
  );

  // ---------- caméra : perspective ou orthographique, vues, zoom, historique ----------
  const VIEWS = { front: [0, 0, 1], back: [0, 0, -1], side: [1, 0, 0], left: [1, 0, 0], right: [-1, 0, 0], q34: [0.8, 0.35, 0.9], persp: [0.55, 1, 0.75], top: [0, 1, 0.0001], bottom: [0, -1, 0.0001] };
  const fitDist = (r) => {
    const vf = T.MathUtils.degToRad(camP.fov / 2),
      hf = Math.atan(Math.tan(vf) * camP.aspect);
    return (r / Math.sin(Math.min(vf, hf))) * 0.95;
  };
  const orthoZoomFor = (r) => camO.top / (r * Math.max(1, 1 / camP.aspect) * 1.02);
  function histPush() {
    const s = { pos: V.cam.position.clone(), target: controls.target.clone(), zoom: V.cam.zoom },
      l = V.hist[V.hist.length - 1];
    if (l && l.pos.distanceTo(s.pos) < 1e-4 && l.target.distanceTo(s.target) < 1e-4 && l.zoom === s.zoom) return;
    V.hist.push(s);
    if (V.hist.length > 40) V.hist.shift();
  }
  function moveCam(pos, target, smooth = true, zoom, noHist, dur) {
    if (!noHist) histPush();
    const C = V.cam,
      z1 = zoom ?? C.zoom;
    if (!smooth) {
      C.position.copy(pos);
      controls.target.copy(target);
      C.zoom = z1;
      C.updateProjectionMatrix();
      controls.update();
      return need();
    }
    const fp = C.position.clone(),
      ft = controls.target.clone(),
      z0 = C.zoom,
      t0 = performance.now();
    V.anim = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / (dur || 500))),
        // longs déplacements (parcours) : départ et arrivée en douceur
        e = dur ? (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) : 1 - Math.pow(1 - k, 3);
      C.position.lerpVectors(fp, pos, e);
      controls.target.lerpVectors(ft, target, e);
      C.zoom = z0 + (z1 - z0) * e;
      C.updateProjectionMatrix();
      if (k === 1) {
        V.anim = null;
        need();
      }
    };
  }
  const curR = () => (V.mode == "cote" ? V.radius + (V.gridR - V.radius) * V.f : V.radius * (1 + V.f * 0.9));
  function setView(v, smooth = true) {
    V.view = v;
    document.querySelectorAll("#atl .atv button").forEach((x) => x.classList.toggle("on", x.dataset.v === v));
    const r = curR();
    moveCam(new T.Vector3(...VIEWS[v]).normalize().multiplyScalar(fitDist(r)), ORIGIN, smooth, V.ortho ? orthoZoomFor(r) : 1);
  }
  V.setView = setView;
  document.querySelectorAll("#atl .atv button").forEach((b) => (b.onclick = () => setView(b.dataset.v)));
  function setOrtho(on, keep = true) {
    V.ortho = on;
    const from = V.cam,
      to = on ? camO : camP;
    if (from !== to) {
      to.position.copy(from.position);
      to.quaternion.copy(from.quaternion);
      if (on) {
        const d = from.position.distanceTo(controls.target),
          hh = d * Math.tan(T.MathUtils.degToRad(camP.fov / 2));
        camO.zoom = camO.top / hh;
      }
      to.updateProjectionMatrix();
      V.cam = to;
      controls.object = to;
      controls.update();
      if (composer) fxBuild();
    }
    if (keep) need();
  }
  function zoomBy(k, noHist) {
    if (!noHist) histPush();
    if (V.ortho) {
      V.cam.zoom = Math.min(400, Math.max(0.05, V.cam.zoom * k));
      V.cam.updateProjectionMatrix();
    } else {
      const t = controls.target,
        d = V.cam.position.clone().sub(t);
      V.cam.position.copy(t).add(d.multiplyScalar(1 / k));
    }
    controls.update();
    need();
  }
  $("atzi").onclick = () => zoomBy(1.3);
  $("atzo").onclick = () => zoomBy(1 / 1.3);
  $("atreset").onclick = () => {
    V.anim = null;
    setView("front");
  };
  $("atback").onclick = () => {
    const s = V.hist.pop();
    if (s) moveCam(s.pos, s.target, true, s.zoom, true);
  };

  // ---------- position de chaque structure : éclaté (orienté, ciblé), côte à côte, respiration ----------
  const tq = new T.Quaternion(),
    tv = new T.Vector3();
  function exTarget(p) {
    if (V.exScope == "all" || !V.sels.size) return true;
    if (V.exScope == "sel") return V.sels.has(p);
    return [...V.sels].some((s) => s.meta.systeme == p.meta.systeme);
  }
  function pose() {
    const B = V.breath,
      s = B.on ? B.s : 0;
    for (const p of V.parts) {
      const m = p.mesh;
      m.position.copy(p.base);
      m.quaternion.copy(p.q0);
      m.scale.copy(p.s0);
      if (V.hb.on && p.hb) {
        const k = p.hb.g == "a" ? V.hb.ka : 1 - (1 - V.hb.kv) * p.hb.w;
        m.position.sub(p.hb.C).multiplyScalar(k).add(p.hb.C);
        m.scale.multiplyScalar(k);
      } else if (s && p.br) {
        const b = p.br;
        if (b.kind == "rot") {
          tq.setFromAxisAngle(b.axis, b.ang * s);
          m.position.sub(b.P).applyQuaternion(tq).add(b.P);
          m.quaternion.premultiply(tq);
          if (b.v) m.position.addScaledVector(b.v, s);
        } else if (b.kind == "an") {
          // dilatation non uniforme autour d'un point fixe (haut de la trachée)
          tv.copy(b.sv).multiplyScalar(s).addScalar(1);
          if (b.rigid) tv.setScalar((tv.x + tv.y + tv.z) / 3);
          m.position.sub(b.A).multiply(tv).add(b.A);
          m.scale.multiply(tv);
        } else if (b.kind == "tr") m.position.addScaledVector(b.v, s);
        else if (b.kind == "sc") {
          const k = 1 + b.k * s;
          m.position.sub(p.c).multiplyScalar(k).add(p.c);
          m.scale.multiplyScalar(k);
        }
      } else if (V.f && exTarget(p)) {
        if (V.mode == "cote") m.position.add(tv.copy(p.grid).sub(p.c).multiplyScalar(V.f));
        else {
          tv.copy(p.c).sub(V.mc);
          if (V.exDir != "all") {
            const a = V.exDir;
            tv.set(a == "x" ? tv.x : 0, a == "y" ? tv.y : 0, a == "z" ? tv.z : 0).multiplyScalar(1.7);
          }
          // seulement la sélection : on la sort vers l'avant, hors du reste
          if (V.exScope == "sel" && V.sels.size && V.exDir == "all") tv.add(new T.Vector3(0, 0, V.radius * 0.8));
          m.position.add(tv.multiplyScalar(V.f * 1.2));
        }
      }
    }
    gridFollow();
    need();
  }
  // disposition « côte à côte » : rangées par système
  function grid() {
    const order = Object.keys(ATL.sysFr),
      list = V.parts.slice().sort(
        (a, b) =>
          order.indexOf(a.meta.systeme) - order.indexOf(b.meta.systeme) ||
          String(a.meta.fiche).localeCompare(String(b.meta.fiche)) ||
          a.meta.fr.localeCompare(b.meta.fr, "fr", { numeric: true }),
      ),
      gap = 0.012,
      area = list.reduce((t, p) => t + (p.size.x + gap) * (p.size.y + gap), 0),
      W = Math.sqrt(area * 1.6);
    let x = 0,
      y = 0,
      rowH = 0,
      sys = null,
      maxX = 0;
    for (const p of list) {
      const w = p.size.x,
        h = p.size.y;
      if ((x > 0 && x + w > W) || (sys && p.meta.systeme !== sys && x > 0)) {
        y -= rowH + gap * (p.meta.systeme !== sys ? 3 : 1);
        x = 0;
        rowH = 0;
      }
      sys = p.meta.systeme;
      p.grid = new T.Vector3(x + w / 2, y - h / 2, 0);
      x += w + gap;
      rowH = Math.max(rowH, h);
      maxX = Math.max(maxX, x);
    }
    const minY = y - rowH;
    for (const p of V.parts) p.grid.add(new T.Vector3(V.mc.x - maxX / 2, V.mc.y - minY / 2, V.mc.z));
    V.gridR = Math.hypot(maxX, minY) / 2;
  }
  function exSet(f, nopose) {
    if (V.breath.on) breathStop();
    V.f = f;
    const r = $("atex");
    if (r) {
      r.value = Math.round(f * 100);
      $("atp").textContent = Math.round(f * 100) + " %";
    }
    dockState();
    if (!nopose) pose();
  }
  function exMode(m) {
    V.mode = m;
    if (V.breath.on) breathStop();
    if (!V.f) exSet(1, true);
    if (V.tool == "ex") toolPanel("ex", true);
    pose();
    setView(V.mode == "cote" ? "front" : V.view);
  }

  // ---------- visibilité : systèmes, structures masquées, isolement, couches ----------
  // structures « en retrait » : transparentes, ou masquées si l'appareil est lent (moins de calcul)
  const visible = (p) =>
    !V.hSys.has(p.meta.systeme) && !V.hOne.has(p) && (!V.iso || V.iso.has(p)) && p.layer >= V.layer && !(V.ghost && V.q.lvl >= 1 && !V.ghost.has(p));
  const vis = () => {
    for (const p of V.parts) p.mesh.visible = visible(p);
    capObjs.forEach((o) => o.userData.sys && (o.visible = !V.hSys.has(o.userData.sys)));
    if (V.sel && !V.sel.mesh.visible) select(null);
    if (V.tool == "struct") treePaint();
    isoBar();
    dockState();
    gridFollow();
    need();
  };
  V.vis = vis;
  const sysBtns = () => document.querySelectorAll("#atl .atsys button");
  function sysToggle(s, hide) {
    if (hide === undefined) hide = !V.hSys.has(s);
    hide ? V.hSys.add(s) : V.hSys.delete(s);
    sysBtns().forEach((b) => b.dataset.s == s && b.classList.toggle("off", hide));
  }
  sysBtns().forEach(
    (b) =>
      (b.onclick = () => {
        sysToggle(b.dataset.s);
        vis();
      }),
  );
  function labToggle() {
    V.showLbl = !V.showLbl;
    $("atlbl").hidden = !V.showLbl || !!V.quiz;
    dockState();
    need();
  }
  function showAll() {
    V.hSys.clear();
    V.hOne = new Set(V.parts.filter((p) => p.zone || p.meta.fiche == "pleura"));
    V.iso = null;
    V.layer = 0;
    sysBtns().forEach((b) => b.classList.remove("off"));
    if (V.tool == "lay") toolPanel("lay", true);
    vis();
  }
  // compartiments du médiastin : affichés ou masqués ensemble
  function medToggle() {
    const zs = V.parts.filter((p) => p.zone),
      on = zs.some((p) => visible(p)),
      lungs = V.parts.filter((p) => /^(rul|rml|rll|lul|lll|pleura)$/.test(p.meta.fiche));
    zs.forEach((p) => (on ? V.hOne.add(p) : V.hOne.delete(p)));
    if (!on) {
      // on retire la paroi et les poumons pour voir le médiastin, et on les rend en quittant
      V.medPrev = { layer: V.layer, lungs: lungs.filter((p) => !V.hOne.has(p)) };
      lungs.forEach((p) => V.hOne.add(p));
      V.layer = V.LN.length - 1; // « Médiastin seul »
      sysToggle("zone", false);
      toast("Médiastin (schématique) : supérieur en violet, antérieur en vert, moyen en rose, postérieur en jaune. Touche une zone pour sa fiche.");
    } else if (V.medPrev) {
      V.layer = V.medPrev.layer;
      V.medPrev.lungs.forEach((p) => V.hOne.delete(p));
      V.medPrev = null;
    }
    if (V.tool == "lay") toolPanel("lay", true);
    vis();
  }
  // isolement : seulement la sélection, puis ses voisines
  function isolate(set) {
    V.iso = new Set(set);
    vis();
  }
  // voisines : structures dont la surface passe à quelques millimètres de celle d'une structure isolée
  function samplePts(p, max) {
    const m = p.mesh,
      pos = m.geometry.attributes.position,
      step = Math.max(1, Math.floor(pos.count / max)),
      out = [],
      v = new T.Vector3();
    m.updateWorldMatrix(true, false);
    for (let i = 0; i < pos.count; i += step) out.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
    return out;
  }
  function neighbours() {
    if (!V.iso) return;
    const cell = 0.004,
      key = (x, y, z) => x + "," + y + "," + z,
      grid = new Set();
    for (const p of V.iso)
      for (const v of samplePts(p, 1500)) {
        const cx = Math.floor(v.x / cell), cy = Math.floor(v.y / cell), cz = Math.floor(v.z / cell);
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) grid.add(key(cx + i, cy + j, cz + k));
      }
    const box = new T.Box3();
    [...V.iso].forEach((p) => box.expandByObject(p.mesh));
    box.expandByScalar(0.01);
    const add = V.parts.filter(
      (p) =>
        !V.iso.has(p) && !V.hSys.has(p.meta.systeme) && box.intersectsBox(new T.Box3().setFromObject(p.mesh)) &&
        samplePts(p, 800).some((v) => grid.has(key(Math.floor(v.x / cell), Math.floor(v.y / cell), Math.floor(v.z / cell)))),
    );
    add.forEach((p) => V.iso.add(p));
    toast(add.length ? add.length + " structure" + (add.length > 1 ? "s" : "") + " voisine" + (add.length > 1 ? "s" : "") + " ajoutée" + (add.length > 1 ? "s" : "") : "Aucune autre structure au contact");
    vis();
  }
  function isoBar() {
    let b = $("atiso");
    if (!V.iso || V.tour) return b && b.remove();
    if (!b) {
      b = document.createElement("div");
      b.id = "atiso";
      b.className = "atb";
      $("atl").appendChild(b);
    }
    b.innerHTML =
      "<span>Isolement : " + V.iso.size + " structure" + (V.iso.size > 1 ? "s" : "") + '</span><button id="atisn">＋ Voisines</button><button id="atisx">Quitter</button>';
    $("atisn").onclick = neighbours;
    $("atisx").onclick = () => {
      V.iso = null;
      vis();
    };
  }

  // ---------- barre d'outils (dock) : un bouton par outil, l'état « allumé » suit le modèle ----------
  function dockState() {
    const on = {
      struct: V.tool == "struct" || V.hSys.size > 0 || !!V.iso,
      disp: V.tool == "disp",
      ex: V.tool == "ex" || V.f > 0,
      cut: V.tool == "cut" || !!V.clip.axis,
      lay: V.tool == "lay" || V.layer > 0,
      tr: V.tool == "tr" || V.opac < 1,
      mes: V.meas.on,
      med: V.parts.some((p) => p.zone && p.mesh.visible),
      anim: V.tool == "anim" || V.breath.on || V.hb.on || !!V.path,
      tour: V.tool == "tour" || !!V.tour,
      lab: V.showLbl,
      quiz: !!V.quiz,
      more: V.tool == "more",
      vues: V.tool == "vues",
      pres: !!V.pres,
    };
    document.querySelectorAll("#atdock button").forEach((b) => {
      const v = !!on[b.dataset.k];
      b.classList.toggle("on", v);
      b.setAttribute("aria-pressed", String(v));
    });
  }
  V.dockState = dockState;
  const DOCK = {
    struct: () => toolPanel("struct"),
    disp: () => toolPanel("disp"),
    ex: () => toolPanel("ex"),
    cut: () => toolPanel("cut"),
    lay: () => toolPanel("lay"),
    tr: () => toolPanel("tr"),
    more: () => toolPanel("more"),
    vues: () => toolPanel("vues"),
    pres: () => presToggle(true),
    lab: () => labToggle(),
    med: () => medToggle(),
    br: () => (V.breath.on ? breathStop() : breathStart()),
    anim: () => toolPanel("anim"),
    tour: () => toolPanel("tour"),
    mes: () => measToggle(),
    quiz: () => quizMenu(),
    help: () => helpToggle(),
    ar: () => arOpen(),
  };
  document.querySelectorAll("#atdock button").forEach((b) => (b.onclick = () => ((V.moreHover = false), DOCK[b.dataset.k] && DOCK[b.dataset.k]())));
  // ordinateur : survoler « Plus » affiche les autres outils, qui se referment quand la souris s'en va
  if (fine) {
    const mb = document.querySelector('#atdock [data-k="more"]'),
      sh = $("atsheet");
    let hT = 0;
    const stay = () => clearTimeout(hT),
      leave = () => {
        clearTimeout(hT);
        hT = setTimeout(() => V.moreHover && V.tool == "more" && ((V.moreHover = false), toolPanel("more")), 350);
      };
    mb.addEventListener("mouseenter", () => {
      stay();
      if (V.tool != "more") {
        toolPanel("more");
        V.moreHover = true;
      }
    });
    mb.addEventListener("mouseleave", leave);
    sh.addEventListener("mouseenter", stay);
    sh.addEventListener("mouseleave", () => V.tool == "more" && leave());
  }

  // ---------- liste des structures ----------
  V.treeOpen = V.treeOpen || {};
  function treePaint() {
    const box = $("attool"),
      sc = box.scrollTop,
      order = Object.keys(ATL.sysFr),
      eye = (on) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (on ? '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>' : '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.2"/>') + "</svg>",
      present = order.filter((s) => s != "zone" && V.parts.some((p) => p.meta.systeme == s));
    box.innerHTML =
      '<div class="atsys" role="group" aria-label="Systèmes">' +
      present
        .map((s) => '<button data-s="' + s + '"' + (V.hSys.has(s) ? ' class="off"' : "") + '><i style="background:#' + ATL.colors[s].toString(16).padStart(6, "0") + '"></i>' + ATL.sysPl[s] + "</button>")
        .join("") +
      '</div><button class="atallb">Tout afficher</button>' +
      order
        .filter((s) => V.parts.some((p) => p.meta.systeme == s))
        .map((s) => {
          const ps = V.parts.filter((p) => p.meta.systeme == s),
            groups = {};
          ps.forEach((p) => (groups[p.meta.fiche || p.meta.fr] = groups[p.meta.fiche || p.meta.fr] || []).push(p));
          const sOn = !V.hSys.has(s);
          return (
            '<details class="attg"' + (V.treeOpen[s] ? " open" : "") + ' data-s="' + s + '"><summary><i style="background:#' +
            ATL.colors[s].toString(16).padStart(6, "0") + '"></i>' + ATL.sysPl[s] + " <small>" + ps.length + '</small><button class="ateye' +
            (sOn ? "" : " off") + '" data-sys="' + s + '" aria-label="Afficher ou masquer">' + eye(sOn) + "</button></summary>" +
            Object.keys(groups)
              .sort((a, b) => ((V.fiches[a] || {}).titre || a).localeCompare((V.fiches[b] || {}).titre || b, "fr", { numeric: true }))
              .map((k) => {
                const g = groups[k].sort((a, b) => a.meta.fr.localeCompare(b.meta.fr, "fr", { numeric: true })),
                  row = (p) =>
                    '<div class="attr' + (V.sels.has(p) ? " sel" : "") + '"><button class="atnm" data-i="' + V.parts.indexOf(p) + '">' + esc(p.meta.fr) +
                    '</button><button class="ateye' + (visible(p) ? "" : " off") + '" data-i="' + V.parts.indexOf(p) + '" aria-label="Afficher ou masquer">' +
                    eye(visible(p)) + "</button></div>";
                return g.length > 1
                  ? '<details class="attsub"><summary>' + esc((V.fiches[k] || {}).titre || k) + " <small>" + g.length + "</small></summary>" + g.map(row).join("") + "</details>"
                  : row(g[0]);
              })
              .join("") +
            "</details>"
          );
        })
        .join("");
    box.scrollTop = sc;
    box.querySelectorAll(".atsys button").forEach(
      (b) =>
        (b.onclick = () => {
          sysToggle(b.dataset.s);
          vis();
        }),
    );
    box.querySelector(".atallb").onclick = showAll;
    box.querySelectorAll(".attg").forEach((d) => (d.ontoggle = () => (V.treeOpen[d.dataset.s] = d.open)));
    box.querySelectorAll(".ateye").forEach(
      (b) =>
        (b.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (b.dataset.sys) sysToggle(b.dataset.sys);
          else {
            const p = V.parts[+b.dataset.i];
            if (visible(p)) V.hOne.add(p);
            else {
              V.hOne.delete(p);
              sysToggle(p.meta.systeme, false);
              if (V.iso) V.iso.add(p);
              if (p.layer < V.layer) V.layer = p.layer;
            }
          }
          vis();
        }),
    );
    box.querySelectorAll(".atnm").forEach((b) => (b.onclick = () => focusPart(V.parts[+b.dataset.i])));
  }

  // ---------- fenêtres d'outils (une seule ouverte, repliable avec la flèche) ----------
  const sw = (id, label, on, hint) =>
    '<label class="atsw"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + "><span>" + label + (hint ? "<small>" + hint + "</small>" : "") + "</span></label>";
  const TITLES = { anim: "Animations", tour: "Parcours guidés", vues: "Vues enregistrées", struct: "Structures", disp: "Affichage", ex: "Écarter les structures", cut: "Coupe", lay: "Couches", tr: "Transparence", more: "Plus d’outils" };
  const sheet = $("atsheet");
  function sheetMin(m) {
    sheet.classList.toggle("min", m);
    $("atshc").setAttribute("aria-label", m ? "Déplier" : "Réduire");
    $("atshc").title = m ? "Déplier" : "Réduire";
  }
  $("atshc").onclick = () => sheetMin(!sheet.classList.contains("min"));
  $("atshx").onclick = () => toolPanel(V.tool);
  sheet.querySelector(".atsh-h b").onclick = () => sheet.classList.contains("min") && sheetMin(false);
  function toolPanel(t, keep) {
    if (!keep) {
      V.tool = V.tool === t ? "" : t;
      sheetMin(false);
    }
    const box = $("attool");
    sheet.hidden = !V.tool;
    $("atl").classList.toggle("sheet-open", !!V.tool);
    $("atsht").textContent = TITLES[V.tool] || "";
    sheet.dataset.t = V.tool;
    dockState();
    if (V.tool == "struct") return treePaint();
    if (V.tool == "vues") return viewsPaint(box);
    if (V.tool == "anim") return animPaint(box);
    if (V.tool == "tour") return toursPaint(box);
    if (V.tool == "more") {
      const items = [...document.querySelectorAll("#atdock [data-x], #atdock [data-y]")]
        .filter((b) => !b.hidden && b.offsetParent === null) // seulement ceux qui ne sont pas déjà dans la barre
        .map((b) => [b.dataset.k, b.querySelector("span").textContent]);
      items.push(["help", "Raccourcis et aide"]);
      if (V.ar) items.push(["ar", "Voir en réalité augmentée"]);
      box.innerHTML =
        '<div class="atmore">' +
        items.map(([k, t]) => '<button data-k="' + k + '" class="' + (dk(k) && dk(k).classList.contains("on") ? "on" : "") + '">' + atIco(ATI[k] ? k : "help") + "<span>" + t + "</span></button>").join("") +
        "</div>";
      box.querySelectorAll(".atmore button").forEach(
        (b) =>
          (b.onclick = () => {
            const k = b.dataset.k;
            V.moreHover = false;
            if (["lay", "tr", "vues", "anim", "tour"].includes(k)) return toolPanel(k);
            if (!["lab", "br", "med"].includes(k)) toolPanel("more");
            DOCK[k]();
            if (V.tool == "more") toolPanel("more", true);
          }),
      );
      return;
    }
    if (V.tool == "disp") {
      box.innerHTML =
        '<div class="atr atwrap"><span class="atlbl2">Couleurs</span><div class="atseg" id="atcol"><button data-c="sys"' + (V.real ? "" : ' class="on"') +
        '>Par système</button><button data-c="real"' + (V.real ? ' class="on"' : "") + ">Réalistes</button></div></div>" +
        '<div class="atr atwrap"><span class="atlbl2">Qualité</span><div class="atseg" id="atqual">' +
        [["auto", "Automatique"], ["high", "Haute"], ["eco", "Économie"]].map((q) => '<button data-q="' + q[0] + '"' + (V.qMode == q[0] ? ' class="on"' : "") + ">" + q[1] + "</button>").join("") +
        "</div></div>" +
        '<div class="atsws">' +
        sw("atsrel", "Relief des tissus", V.relief, "avec les couleurs réalistes") +
        sw("atsao", "Ombres de contact", V.ao, "plus réaliste, mais gourmand : à éviter sur un appareil modeste") +
        sw("atsout", "Contour de la sélection", V.outline) +
        sw("atsfoc", "Mode focus", V.focus, "le reste devient translucide") +
        sw("atsxr", "Rayons X", V.xray) +
        sw("atsort", "Vue orthographique", V.ortho, "sans perspective, comme un atlas") +
        sw("atsgr", "Quadrillage 3D", V.grid) +
        "</div>";
      box.querySelectorAll("#atqual button").forEach(
        (b) =>
          (b.onclick = () => {
            V.qMode = b.dataset.q;
            prefSave();
            if (V.qMode == "eco") qualityApply(2, true);
            else if (V.qMode == "high") qualityApply(0, true);
            toolPanel("disp", true);
          }),
      );
      box.querySelectorAll("#atcol button").forEach(
        (b) =>
          (b.onclick = () => {
            V.real = b.dataset.c == "real";
            box.querySelectorAll("#atcol button").forEach((x) => x.classList.toggle("on", x === b));
            prefSave();
            materials(true);
            caps();
          }),
      );
      const on = (id, fn) => ($(id).onchange = (e) => (fn(e.target.checked), prefSave()));
      on("atsrel", (v) => ((V.relief = v), materials(true)));
      on("atsao", (v) => ((V.ao = v), fxBuild()));
      on("atsout", (v) => ((V.outline = v), fxBuild()));
      on("atsfoc", (v) => ((V.focus = v), materials()));
      on("atsxr", (v) => ((V.xray = v), materials()));
      on("atsort", (v) => setOrtho(v));
      on("atsgr", (v) => gridToggle(v));
    } else if (V.tool == "lay")
      box.innerHTML =
        '<div class="atr"><label for="atly">Couches</label><input id="atly" type="range" min="0" max="' + (V.LN.length - 1) + '" value="' + V.layer +
        '"></div><p class="atlyn">' + V.LN[V.layer] + "</p>";
    else if (V.tool == "tr")
      box.innerHTML =
        '<div class="atr atwrap"><span class="atlbl2">Rendre transparents</span><div class="atseg" id="atops">' +
        ["muscle", "os", "organe", "artere", "veine"]
          .filter((s) => V.parts.some((p) => p.meta.systeme == s))
          .map((s) => '<button data-s="' + s + '"' + (V.opSys == s ? ' class="on"' : "") + ">" + ATL.sysPl[s] + "</button>")
          .join("") +
        '</div></div><div class="atr"><label for="atop">Opacité</label><input id="atop" type="range" min="10" max="100" value="' + Math.round(V.opac * 100) +
        '"><span>' + Math.round(V.opac * 100) + " %</span></div>";
    else if (V.tool == "cut")
      box.innerHTML =
        '<div class="atr atwrap"><div class="atseg atcax">' +
        [["", "Aucune"], ["y", "Horizontale"], ["z", "Frontale"], ["x", "Sagittale"]]
          .map((a) => '<button data-a="' + a[0] + '"' + (V.clip.axis === a[0] ? ' class="on"' : "") + ">" + a[1] + "</button>")
          .join("") +
        "</div></div>" +
        '<div class="atr" id="atcpr"' + (V.clip.axis ? "" : " hidden") + '><label for="atcp">Position</label><input id="atcp" type="range" min="-100" max="100" value="' +
        V.clip.pos + '"></div><div class="atsws">' + sw("atcap", "Coupe pleine", V.clip.caps, "remplit la surface coupée") + "</div>" +
        (cutPresets().length
          ? '<details class="atpre"' + (V.preOpen ? " open" : "") + '><summary>Coupes de référence</summary><div class="atprel">' +
            cutPresets().map((c, i) => '<button data-i="' + i + '"><b>' + esc(c.n) + "</b>" + (c.d ? "<small>" + esc(c.d) + "</small>" : "") + "</button>").join("") +
            "</div></details>"
          : "");
    else if (V.tool == "ex")
      box.innerHTML =
        '<div class="atr"><label for="atex">Écart</label><input id="atex" type="range" min="0" max="100" value="' + Math.round(V.f * 100) +
        '"><span id="atp">' + Math.round(V.f * 100) + " %</span></div>" +
        '<div class="atr atwrap"><span class="atlbl2">Disposition</span><div class="atseg" id="atexm">' +
        [["eclate", "Éclaté"], ["cote", "Côte à côte"]].map((a) => '<button data-m="' + a[0] + '"' + (V.mode == a[0] ? ' class="on"' : "") + ">" + a[1] + "</button>").join("") +
        "</div></div>" +
        (V.mode == "eclate"
          ? '<div class="atr atwrap"><span class="atlbl2">Direction</span><div class="atseg" id="atexd">' +
            [["all", "Toutes"], ["z", "Avant-arrière"], ["y", "Haut-bas"], ["x", "Gauche-droite"]]
              .map((a) => '<button data-d="' + a[0] + '"' + (V.exDir == a[0] ? ' class="on"' : "") + ">" + a[1] + "</button>")
              .join("") +
            '</div></div><div class="atr atwrap"><span class="atlbl2">Écarter</span><div class="atseg" id="atexs">' +
            [["all", "Tout"], ["sel", "La sélection"], ["sys", "Son système"]]
              .map((a) => '<button data-s="' + a[0] + '"' + (V.exScope == a[0] ? ' class="on"' : "") + ">" + a[1] + "</button>")
              .join("") +
            "</div></div>" +
            (V.exScope != "all" && !V.sels.size ? '<p class="atnote">Sélectionne d’abord une structure.</p>' : "")
          : "");
    else box.innerHTML = "";
    if ($("atex")) {
      $("atex").oninput = (e) => exSet(e.target.value / 100);
      $("atex").onchange = () => V.mode == "cote" && V.f > 0.5 && setView("front");
    }
    box.querySelectorAll("#atexm button").forEach((b) => (b.onclick = () => exMode(b.dataset.m)));
    if ($("atly"))
      $("atly").oninput = (e) => {
        V.layer = +e.target.value;
        box.querySelector(".atlyn").textContent = V.LN[V.layer];
        vis();
      };
    box.querySelectorAll("#atops button").forEach(
      (b) =>
        (b.onclick = () => {
          V.opSys = b.dataset.s;
          box.querySelectorAll("#atops button").forEach((x) => x.classList.toggle("on", x === b));
          materials();
        }),
    );
    if ($("atop"))
      $("atop").oninput = (e) => {
        V.opac = e.target.value / 100;
        e.target.nextElementSibling.textContent = e.target.value + " %";
        dockState();
        materials();
      };
    const pre = box.querySelector(".atpre");
    if (pre) {
      pre.ontoggle = () => (V.preOpen = pre.open);
      pre.querySelectorAll("button").forEach((b) => (b.onclick = () => cutApply(cutPresets()[+b.dataset.i])));
    }
    box.querySelectorAll(".atcax button").forEach(
      (b) =>
        (b.onclick = () => {
          V.clip.axis = b.dataset.a;
          box.querySelectorAll(".atcax button").forEach((x) => x.classList.toggle("on", x === b));
          $("atcpr").hidden = !V.clip.axis;
          clip();
        }),
    );
    if ($("atcap"))
      $("atcap").onchange = (e) => {
        V.clip.caps = e.target.checked;
        clip();
      };
    if ($("atcp"))
      $("atcp").oninput = (e) => {
        V.clip.pos = +e.target.value;
        clip();
      };
    box.querySelectorAll("#atexd button").forEach(
      (b) =>
        (b.onclick = () => {
          V.exDir = b.dataset.d;
          if (!V.f) exSet(0.6, true);
          toolPanel("ex", true);
          pose();
        }),
    );
    box.querySelectorAll("#atexs button").forEach(
      (b) =>
        (b.onclick = () => {
          V.exScope = b.dataset.s;
          toolPanel("ex", true);
          pose();
        }),
    );
  }

  // ---------- coupes de référence : niveaux classiques des cours ----------
  const byEn = (en) => V.parts.find((p) => p.meta.en == en),
    byFi = (re) => V.parts.filter((p) => re.test(p.meta.fiche || "")),
    restC = (ps) => {
      const v = new T.Vector3();
      ps.forEach((p) => v.add(V.root.localToWorld(p.c.clone())));
      return v.multiplyScalar(1 / ps.length);
    };
  function cutPresets() {
    if (V.presets) return V.presets;
    const L = [],
      add = (n, d, axis, ps) => ps.length && ps.every(Boolean) && L.push({ n, d, axis, at: restC(ps)[axis] });
    // thorax : niveaux vertébraux
    add("T4-T5 : angle sternal (de Louis)", "bifurcation trachéale, crosse de l’aorte", "y", [byEn("intervertebral disk of fourth thoracic vertebra")]);
    add("T8 : orifice de la veine cave inférieure", "", "y", [byEn("eighth thoracic vertebra")]);
    add("T10 : hiatus œsophagien", "", "y", [byEn("tenth thoracic vertebra")]);
    add("T12 : hiatus aortique", "", "y", [byEn("twelfth thoracic vertebra")]);
    add("Sagittale médiane", "par le sternum", "x", [byEn("body of sternum")]);
    // abdomen : niveaux lombaux
    const byFr = (n) => V.parts.find((p) => p.meta.fr == n);
    if (!L.length && byFr("Vertèbre L1")) {
      add("L1 : plan transpylorique", "pylore, col du pancréas, hiles rénaux, origine de l’AMS", "y", [byFr("Vertèbre L1")]);
      add("L3 : artère mésentérique inférieure", "", "y", [byFr("Vertèbre L3")]);
      add("L4 : bifurcation aortique", "plan des crêtes iliaques", "y", [byFr("Vertèbre L4")]);
      add("Sagittale médiane", "", "x", [byFr("Vertèbre L3")]);
      add("Frontale par les reins", "", "z", V.parts.filter((p) => p.meta.fiche == "kidney"));
      return (V.presets = L);
    }
    const thx = L.length > 0;
    if (!thx) {
      // poumons
      add("Horizontale par les hiles", "bronches principales", "y", byFi(/^main bronchus$/));
      add("Sagittale médiane", "par la trachée", "x", byFi(/^trachea$/));
    }
    add("Frontale par la trachée", "", "z", byFi(/^trachea$/));
    if (!byFi(/^trachea$/).length) {
      // cœur
      add("Horizontale par les valves", "plan des orifices", "y", V.parts.filter((p) => p.meta.systeme == "valve"));
      add("Frontale par les ventricules", "proche de la coupe « 4 cavités »", "z", byFi(/ventricle$/));
      add("Sagittale par le septum", "entre les deux ventricules", "x", byFi(/ventricle$/));
    }
    return (V.presets = L);
  }
  function cutApply(c) {
    if (!c) return;
    V.clip.axis = c.axis;
    V.clip.pos = Math.max(-100, Math.min(100, Math.round((c.at / (V.ext[c.axis] * 1.05)) * 100)));
    clip();
    if (V.tool == "cut") toolPanel("cut", true);
    setView({ y: "top", z: "front", x: "left" }[c.axis]);
    toast("Coupe : " + c.n + (c.d ? " (" + c.d + ")" : ""));
  }

  // ---------- vues enregistrées (synchronisées) ----------
  function viewsOf() {
    S.atv = S.atv || {};
    return (S.atv[model.id] = S.atv[model.id] || []);
  }
  function viewSnap(n) {
    const fr = (set) => [...set].map((p) => p.meta.fr);
    return {
      n, t: Date.now(),
      cam: { p: V.cam.position.toArray(), t: controls.target.toArray(), z: V.cam.zoom, o: V.ortho, v: V.view },
      hid: fr(V.hOne), hs: [...V.hSys], iso: V.iso ? fr(V.iso) : null, layer: V.layer,
      clip: { a: V.clip.axis, p: V.clip.pos, c: V.clip.caps }, opac: V.opac, opSys: V.opSys,
      f: V.f, mode: V.mode, exDir: V.exDir, exScope: V.exScope, sel: fr(V.sels),
    };
  }
  function viewApply(v) {
    const byFr = new Map(V.parts.map((p) => [p.meta.fr, p])),
      ps = (a) => new Set((a || []).map((n) => byFr.get(n)).filter(Boolean));
    if (V.breath.on) breathStop();
    V.hOne = ps(v.hid);
    V.hSys = new Set(v.hs || []);
    V.iso = v.iso ? ps(v.iso) : null;
    V.layer = v.layer || 0;
    V.clip.axis = v.clip.a;
    V.clip.pos = v.clip.p;
    V.clip.caps = v.clip.c;
    V.opac = v.opac ?? 1;
    V.opSys = v.opSys || V.opSys;
    Object.assign(V, { f: v.f || 0, mode: v.mode || "eclate", exDir: v.exDir || "all", exScope: v.exScope || "all" });
    clip();
    pose();
    fadeTo(650);
    isoBar();
    if (!!v.cam.o !== V.ortho) setOrtho(!!v.cam.o);
    V.view = v.cam.v || V.view;
    moveCam(new T.Vector3(...v.cam.p), new T.Vector3(...v.cam.t), true, v.cam.z, false, V.tour ? 1300 : 800);
    const sel = [...ps(v.sel)];
    V.sels = new Set(sel);
    V.sel = sel[0] || null;
    materials();
    panel();
  }
  function viewsPaint(box) {
    const L = viewsOf();
    box.innerHTML =
      '<div class="atvsave"><input id="atvn" type="text" maxlength="60" placeholder="Nom (ex. Médiastin de profil)" aria-label="Nom de la vue"><button class="b p" id="atvok">Enregistrer</button></div>' +
      (L.length
        ? '<div class="atvl">' +
          L.map(
            (v, i) =>
              '<div class="atvr"><button class="atvo" data-i="' + i + '"><b>' + esc(v.n) + "</b><small>" +
              new Date(v.t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + (v.sel && v.sel.length ? " · " + esc(v.sel[0]) : "") +
              '</small></button><button class="atvx" data-i="' + i + '" aria-label="Supprimer la vue">✕</button></div>',
          ).join("") +
          "</div>"
        : '<p class="atnote">Enregistre l’angle, les structures affichées, la coupe et la sélection pour les retrouver en un clic, sur tous tes appareils.</p>');
    const ok = () => {
      const n = $("atvn").value.trim() || "Vue du " + new Date().toLocaleDateString("fr-FR");
      viewsOf().unshift(viewSnap(n));
      if (viewsOf().length > 40) viewsOf().length = 40;
      save();
      viewsPaint(box);
      toast("Vue enregistrée ✔");
    };
    $("atvok").onclick = ok;
    $("atvn").onkeydown = (e) => e.key == "Enter" && (e.preventDefault(), ok());
    box.querySelectorAll(".atvo").forEach((b) => (b.onclick = () => viewApply(viewsOf()[+b.dataset.i])));
    box.querySelectorAll(".atvx").forEach(
      (b) =>
        (b.onclick = () => {
          viewsOf().splice(+b.dataset.i, 1);
          save();
          viewsPaint(box);
        }),
    );
  }

  // ---------- mode présentation : plein écran, sans boutons, rotation lente ----------
  function presToggle(on) {
    V.pres = on;
    $("atl").classList.toggle("pres", on);
    if (V.tool) toolPanel(V.tool);
    controls.autoRotate = on;
    controls.autoRotateSpeed = 0.8;
    if (on) {
      select(null);
      try {
        if ($("atl").requestFullscreen && !document.fullscreenElement) $("atl").requestFullscreen().catch(() => {});
      } catch (e) {}
      toast("Présentation : Échap ou « Quitter » pour revenir.");
    } else if (document.fullscreenElement)
      try {
        document.exitFullscreen();
      } catch (e) {}
    dockState();
    need();
  }
  $("atpresx").onclick = () => presToggle(false);
  // sortie du plein écran par le navigateur (Échap) : on quitte aussi la présentation
  document.onfullscreenchange = () => !document.fullscreenElement && ATL.v === V && V.pres && presToggle(false);

  // ---------- coupes (avec remplissage optionnel de la surface coupée) ----------
  const capObjs = [];
  function capsClear() {
    for (const o of capObjs) {
      o.removeFromParent();
      if (o.userData.own) o.geometry.dispose();
      if (o.material) o.material.dispose();
    }
    capObjs.length = 0;
  }
  // surface fermée ? (presque toutes les arêtes partagées par deux triangles)
  function isClosed(p) {
    if (p.closed !== undefined) return p.closed;
    const g = p.mesh.geometry,
      pos = g.attributes.position,
      idx = g.index,
      n = idx ? idx.count : pos.count,
      // clé numérique (bien plus rapide qu'une chaîne) : coordonnées arrondies au 1/20 de mm
      key = (i) => (Math.round(pos.getX(i) * 2e4) + 32768) * 4294967296 + (Math.round(pos.getY(i) * 2e4) + 32768) * 65536 + (Math.round(pos.getZ(i) * 2e4) + 32768),
      ids = new Map(),
      vid = (i) => {
        const k = key(i);
        let v = ids.get(k);
        if (v === undefined) ids.set(k, (v = ids.size));
        return v;
      },
      edges = new Map();
    for (let t = 0; t < n; t += 3) {
      const a = vid(idx ? idx.getX(t) : t),
        b = vid(idx ? idx.getX(t + 1) : t + 1),
        c = vid(idx ? idx.getX(t + 2) : t + 2);
      for (const [u, v] of [[a, b], [b, c], [c, a]]) {
        const k = u < v ? u * 4194304 + v : v * 4194304 + u;
        edges.set(k, (edges.get(k) || 0) + 1);
      }
    }
    let open = 0;
    edges.forEach((c) => c == 1 && open++);
    return (p.closed = open / Math.max(1, edges.size) < 0.004);
  }
  function caps() {
    capsClear();
    if (!V.clip.axis || !V.clip.caps) return need();
    const P = V.clip.plane;
    Object.keys(ATL.sysFr).forEach((s, gi) => {
      const ps = V.parts.filter((p) => p.meta.systeme == s);
      if (!ps.length) return;
      const mk = (side, op) =>
        new T.MeshBasicMaterial({
          side, clippingPlanes: [P], colorWrite: false, depthWrite: false, depthTest: false,
          stencilWrite: true, stencilFunc: T.AlwaysStencilFunc, stencilFail: op, stencilZFail: op, stencilZPass: op,
        });
      for (const p of ps) {
        // une surface ouverte (paroi fine, vaisseau mal fermé) donnerait des formes parasites : pas de remplissage
        if (!isClosed(p)) continue;
        const b = new T.Mesh(p.mesh.geometry, mk(T.BackSide, T.IncrementWrapStencilOp)),
          f = new T.Mesh(p.mesh.geometry, mk(T.FrontSide, T.DecrementWrapStencilOp));
        b.renderOrder = f.renderOrder = gi * 2 + 1;
        b.raycast = f.raycast = () => {};
        p.mesh.add(b, f);
        capObjs.push(b, f);
      }
      const col = V.real ? ATL_REAL.sys[s] : ATL.colors[s],
        pm = new T.MeshStandardMaterial({
          color: new T.Color(col).lerp(new T.Color(0xffffff), 0.12).multiplyScalar(0.92), roughness: 0.95, metalness: 0,
          stencilWrite: true, stencilRef: 0, stencilFunc: T.NotEqualStencilFunc,
          stencilFail: T.ReplaceStencilOp, stencilZFail: T.ReplaceStencilOp, stencilZPass: T.ReplaceStencilOp,
        }),
        plane = new T.Mesh(new T.PlaneGeometry(4, 4), pm);
      plane.userData.own = 1;
      plane.userData.sys = s;
      plane.renderOrder = gi * 2 + 1.5;
      plane.raycast = () => {};
      plane.onAfterRender = (r) => r.clearStencil();
      P.coplanarPoint(plane.position);
      plane.lookAt(plane.position.clone().sub(P.normal));
      plane.visible = !V.hSys.has(s);
      scene.add(plane);
      capObjs.push(plane);
    });
    need();
  }
  function clip() {
    const a = V.clip.axis,
      P = V.clip.plane,
      on = !!a;
    if (on) {
      P.normal.set(...{ x: [-1, 0, 0], y: [0, -1, 0], z: [0, 0, -1] }[a]);
      P.constant = (V.clip.pos / 100) * V.ext[a] * 1.05;
    }
    for (const p of V.parts) {
      const mt = p.mesh.material,
        had = !!(mt.clippingPlanes && mt.clippingPlanes.length);
      mt.clippingPlanes = on ? [P] : null;
      mt.side = on ? T.DoubleSide : T.FrontSide;
      if (had !== on) mt.needsUpdate = true;
    }
    dockState();
    caps();
  }

  // ---------- quadrillage 3D gradué et directions anatomiques ----------
  let gridObj = null;
  const gdirs = [["Crânial", [0, 1, 0]], ["Caudal", [0, -1, 0]], ["Antérieur", [0, 0, 1]], ["Postérieur", [0, 0, -1]], ["Gauche", [1, 0, 0]], ["Droite", [-1, 0, 0]]];
  // le quadrillage entoure ce qui est affiché, dans sa position actuelle (éclaté, côte à côte…)
  function gridBox() {
    const b = new T.Box3(),
      t = new T.Box3();
    for (const p of V.parts) if (p.mesh.visible) b.union(t.setFromObject(p.mesh));
    if (b.isEmpty()) b.setFromCenterAndSize(new T.Vector3(), V.ext.clone().multiplyScalar(2));
    return b;
  }
  function gridToggle(on, quiet) {
    V.grid = on;
    $("atgrid").classList.toggle("on", on);
    $("atgrid").setAttribute("aria-pressed", String(on));
    if (gridObj) {
      gridObj.removeFromParent();
      gridObj.children.forEach((c) => (c.geometry.dispose(), c.material.dispose()));
      gridObj = null;
    }
    if (!on) $("atgl").innerHTML = "";
    if (on) {
      const b = gridBox(),
        // bornes arrondies au centimètre, avec une marge de 3 cm
        lo = b.min.clone().multiplyScalar(100).floor().subScalar(3),
        hi = b.max.clone().multiplyScalar(100).ceil().addScalar(3),
        minor = [],
        major = [],
        L = (arr, a, c) => arr.push(a[0] / 100, a[1] / 100, a[2] / 100, c[0] / 100, c[1] / 100, c[2] / 100);
      // un sol et deux murs, placés du côté opposé à la caméra (ils ne passent jamais devant le modèle)
      const C0 = lo.clone().add(hi).multiplyScalar(0.005),
        cp = V.cam.position,
        sx = cp.x > C0.x ? -1 : 1,
        sy = cp.y > C0.y ? -1 : 1,
        sz = cp.z > C0.z ? -1 : 1,
        X = sx < 0 ? lo.x : hi.x,
        Y = sy < 0 ? lo.y : hi.y,
        Z = sz < 0 ? lo.z : hi.z;
      V.gside = sx + "," + sy + "," + sz;
      for (let x = lo.x; x <= hi.x; x++) {
        const arr = x % 5 ? minor : major;
        L(arr, [x, Y, lo.z], [x, Y, hi.z]);
        L(arr, [x, lo.y, Z], [x, hi.y, Z]);
      }
      for (let z = lo.z; z <= hi.z; z++) {
        const arr = z % 5 ? minor : major;
        L(arr, [lo.x, Y, z], [hi.x, Y, z]);
        L(arr, [X, lo.y, z], [X, hi.y, z]);
      }
      for (let y = lo.y; y <= hi.y; y++) {
        const arr = y % 5 ? minor : major;
        L(arr, [lo.x, y, Z], [hi.x, y, Z]);
        L(arr, [X, y, lo.z], [X, y, hi.z]);
      }
      gridObj = new T.Group();
      [
        [minor, 0x26303b],
        [major, 0x3c4a5c],
      ].forEach(([a, c]) => {
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.Float32BufferAttribute(a, 3));
        const l = new T.LineSegments(g, new T.LineBasicMaterial({ color: c, transparent: true, opacity: 0.8 }));
        l.raycast = () => {};
        gridObj.add(l);
      });
      scene.add(gridObj);
      const C = lo.clone().add(hi).multiplyScalar(0.005),
        H = hi.clone().sub(lo).multiplyScalar(0.005);
      V.gdist = { X: H.x, Y: H.y, Z: H.z, C };
      if (!$("atgl").children.length) $("atgl").innerHTML = gdirs.map((d) => '<span class="atgd">' + d[0] + "</span>").join("");
      if (!quiet) toast("Quadrillage : 1 carreau = 1 cm (traits plus marqués tous les 5 cm).");
    }
    need();
  }
  // reconstruit le quadrillage quand la disposition change (sans le faire à chaque image)
  let gridT = 0;
  function gridFollow() {
    if (!V.grid || V.breath.on || V.hb.on) return;
    clearTimeout(gridT);
    gridT = setTimeout(() => V.grid && gridToggle(true, true), 90);
  }
  $("atgrid").onclick = () => {
    gridToggle(!V.grid);
    if (V.tool == "disp") toolPanel("disp", true);
  };

  // ---------- respiration (schématique) ----------
  // quel type de respiration montrer : cage thoracique (côtes), poumons seuls, ou cœur seul (il suit le diaphragme)
  function breathKind() {
    if (V.parts.some((p) => / rib$/.test(p.meta.en || ""))) return "cage";
    if (V.parts.some((p) => AT_LUNG.test(p.meta.fiche || ""))) return "poumons";
    if (V.parts.some((p) => /^(right|left) ventricle$/.test(p.meta.fiche || ""))) return "coeur";
    return "";
  }
  function breathSetup() {
    const B = V.breath,
      kind = breathKind();
    B.kind = kind;
    if (kind == "poumons") {
      // les poumons se gonflent : vers le bas (diaphragme), vers l'avant et sur les côtés ; l'arbre bronchique s'allonge avec eux
      const A = new T.Vector3(V.mc.x, V.mc.y + V.ext.y, V.mc.z - V.ext.z * 0.6);
      for (const p of V.parts) p.br = { kind: "an", A, sv: new T.Vector3(0.05, 0.09, 0.06), rigid: p.q0.lengthSq() && Math.abs(p.q0.w) < 0.9999 };
      B.ready = true;
      return;
    }
    if (kind == "coeur") {
      // le cœur suit le diaphragme : il descend et se verticalise un peu à l'inspiration
      const P = new T.Vector3(V.mc.x, V.mc.y + V.ext.y, V.mc.z);
      for (const p of V.parts) p.br = { kind: "rot", P, axis: new T.Vector3(0, 0, 1), ang: -0.07, v: new T.Vector3(0, -0.01, 0.002) };
      B.ready = true;
      return;
    }
    const 
      ord = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"],
      amp = (n) => T.MathUtils.degToRad(n == 1 ? 2 : n <= 7 ? 4.5 : n <= 10 ? 5 : 3),
      ribs = {},
      v = new T.Vector3();
    for (const p of V.parts) {
      const r = /^(right|left) (\w+) rib$/.exec(p.meta.en || "");
      if (!r) continue;
      const n = ord.indexOf(r[2]) + 1,
        m = p.mesh,
        pos = m.geometry.attributes.position;
      m.position.copy(p.base);
      m.quaternion.copy(p.q0);
      m.scale.copy(p.s0);
      m.updateMatrix();
      let head = null,
        back = null,
        tip = null;
      for (let i = 0; i < pos.count; i += 2) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrix);
        if (!head || Math.abs(v.x - V.mc.x) < Math.abs(head.x - V.mc.x)) head = v.clone();
        if (!back || v.z < back.z) back = v.clone();
        if (!tip || v.z > tip.z) tip = v.clone();
      }
      const axis = back.clone().sub(head).setY(0);
      if (axis.lengthSq() < 1e-8) axis.set(1, 0, 0);
      axis.normalize();
      let ang = amp(n);
      tq.setFromAxisAngle(axis, ang);
      if (tip.clone().sub(head).applyQuaternion(tq).add(head).y < tip.y) ang = -ang;
      tq.setFromAxisAngle(axis, ang);
      const moved = tip.clone().sub(head).applyQuaternion(tq).add(head);
      p.br = { kind: "rot", P: head, axis, ang };
      ribs[r[1] + n] = { br: p.br, d: moved.sub(tip) };
    }
    for (const p of V.parts) {
      const e = p.meta.en || "",
        c = /^(right|left) (\w+) costal cartilage$/.exec(e);
      if (c) {
        const R = ribs[c[1] + (ord.indexOf(c[2]) + 1)];
        if (R) p.br = R.br;
      } else if (/^(manubrium|body of sternum|xiphoid process)$/.test(e) && ribs.right4 && ribs.left4)
        p.br = { kind: "tr", v: ribs.right4.d.clone().add(ribs.left4.d).multiplyScalar(0.5) };
      else if (e == "diaphragm") p.br = { kind: "tr", v: new T.Vector3(0, -0.016, 0.002) };
      else if (/^(right|left) lung$/.test(e) || /^(rul|rml|rll|lul|lll|pleura)$/.test(p.meta.fiche)) p.br = { kind: "sc", k: 0.05 };
    }
    B.ready = true;
  }
  function breathStart() {
    if (V.hb.on) hbStop();
    if (!V.breath.ready) breathSetup();
    // cage thoracique : on garde nettes les structures qui bougent, le reste devient transparent
    if (V.breath.kind == "cage") {
      V.ghost = new Set(V.parts.filter((p) => p.br));
      fadeTo(500);
    }
    exSet(0, true);
    V.breath.on = true;
    V.breath.t0 = performance.now();
    dockState();
    toast(
      {
        poumons: "Respiration schématique : les poumons se gonflent vers le bas, l’avant et les côtés ; l’arbre bronchique s’allonge avec eux.",
        coeur: "Respiration schématique : à l’inspiration, le diaphragme descend et entraîne le cœur, qui se verticalise légèrement.",
      }[V.breath.kind] || "Respiration schématique : les côtes s’élèvent, le sternum avance, le diaphragme descend et les poumons se remplissent.",
    );
  }
  function breathStop() {
    if (V.breath.kind == "cage" && V.ghost && !V.path && !V.tour) {
      V.ghost = null;
      fadeTo(500);
    }
    V.breath.on = false;
    V.breath.s = 0;
    dockState();
    pose();
  }

  // ---------- recherche : structures affichées d'abord ----------
  let sugI = -1,
    sug = [];
  function search(q) {
    const t = atNorm(q).trim();
    if (!t) return [];
    const words = t.split(/\s+/),
      seen = new Set();
    return V.parts
      .filter((p) => words.every((w) => p.key.includes(w)))
      .map((p) => {
        const fr = atNorm(p.meta.fr);
        return { p, v: visible(p) ? 0 : 1, sc: fr.startsWith(t) ? 0 : fr.split(/[\s'’()-]+/).some((w) => w.startsWith(words[0])) ? 1 : 2 };
      })
      .sort((a, b) => a.v - b.v || a.sc - b.sc || a.p.meta.fr.localeCompare(b.p.meta.fr, "fr", { numeric: true }))
      .filter((x) => !seen.has(x.p.meta.fr) && seen.add(x.p.meta.fr))
      .slice(0, 10)
      .map((x) => x.p);
  }
  V.search = search;
  function sugPaint() {
    const box = $("atsug");
    box.innerHTML =
      sug
        .map(
          (p, i) =>
            '<button role="option" data-i="' + i + '" class="' + (i === sugI ? "on " : "") + (visible(p) ? "" : "hid") + '"><i style="background:#' +
            (ATL.colors[p.meta.systeme] || 0xcccccc).toString(16).padStart(6, "0") + '"></i><span>' + esc(p.meta.fr) + "</span><small>" +
            (visible(p) ? esc(ATL.sysFr[p.meta.systeme] || "") : "masqué") + "</small></button>",
        )
        .join("") || ($("atq").value.trim() ? '<p class="atnone">Aucune structure trouvée</p>' : "");
    box.classList.toggle("show", !!box.innerHTML);
    box.querySelectorAll("button").forEach((b) => (b.onmousedown = (e) => (e.preventDefault(), pick(sug[+b.dataset.i]))));
  }
  function pick(p) {
    if (!p) return;
    $("atq").value = "";
    sug = [];
    sugI = -1;
    sugPaint();
    $("atq").blur();
    focusPart(p);
  }
  $("atq").oninput = (e) => {
    sug = search(e.target.value);
    sugI = sug.length ? 0 : -1;
    sugPaint();
  };
  $("atq").onkeydown = (e) => {
    if (e.key == "ArrowDown" || e.key == "ArrowUp") {
      e.preventDefault();
      if (sug.length) sugI = (sugI + (e.key == "ArrowDown" ? 1 : -1) + sug.length) % sug.length;
      sugPaint();
    } else if (e.key == "Enter") {
      e.preventDefault();
      pick(sug[Math.max(0, sugI)]);
    } else if (e.key == "Escape") {
      e.stopPropagation();
      if (!$("atq").value) return $("atq").blur();
      $("atq").value = "";
      sug = [];
      sugPaint();
    }
  };
  $("atq").onblur = () => setTimeout(() => $("atsug") && $("atsug").classList.remove("show"), 120);
  $("atq").onfocus = () => sug.length && sugPaint();
  // montrer une structure : on la réaffiche si besoin, on la sélectionne et on tourne autour d'elle
  function focusPart(p) {
    if (V.hSys.has(p.meta.systeme)) sysToggle(p.meta.systeme, false);
    V.hOne.delete(p);
    if (V.iso) V.iso.add(p);
    if (p.layer < V.layer) {
      V.layer = p.layer;
      if (V.tool == "lay") toolPanel("lay", true);
    }
    vis();
    select(p);
    orbitOn(p);
    // cachée derrière d'autres structures ? on passe en mode focus (le reste devient translucide)
    setTimeout(() => {
      if (ATL.v !== V || V.focus || V.sel !== p) return;
      const c = new T.Box3().setFromObject(p.mesh).getCenter(new T.Vector3()),
        d = V.cam.position.distanceTo(c);
      lray.set(V.cam.position, c.clone().sub(V.cam.position).normalize());
      lray.far = d;
      const hit = lray.intersectObjects(V.parts.filter((x) => x.mesh.visible && x.mesh.material.opacity > 0.5 && !x.zone).map((x) => x.mesh), false)[0];
      if (hit && hit.object !== p.mesh && hit.distance < d * 0.85) {
        V.focus = true;
        materials();
        toast("Structure cachée par d’autres : mode focus activé (Affichage pour le désactiver).");
      }
    }, 650);
  }
  V.focusPart = focusPart;
  function frameParts(ps, mult, dir, dur) {
    if (!ps.length) return;
    const bx = new T.Box3();
    ps.forEach((p) => bx.expandByObject(p.mesh));
    const c = bx.getCenter(new T.Vector3()),
      r = Math.max(bx.getSize(new T.Vector3()).length() / 2, 0.05),
      d = (dir || V.cam.position.clone().sub(controls.target)).clone().normalize();
    moveCam(c.clone().addScaledVector(d, fitDist(r * (mult || 2.2))), c, true, V.ortho ? orthoZoomFor(r * (mult || 2.2)) : 1, false, dur);
  }
  V.frameParts = frameParts;
  function orbitOn(p) {
    const b = new T.Box3().setFromObject(p.mesh),
      c = b.getCenter(new T.Vector3()),
      r = Math.max(b.getSize(new T.Vector3()).length() / 2, 0.05),
      dir = V.cam.position.clone().sub(controls.target).normalize();
    moveCam(c.clone().addScaledVector(dir, fitDist(r * 2.2)), c, true, V.ortho ? orthoZoomFor(r * 2.2) : 1);
  }

  // ---------- sélection (simple ou multiple) et fiche ----------
  function select(p, add) {
    if (!p) {
      V.sels.clear();
      V.sel = null;
    } else if (add || V.multi) {
      if (V.sels.has(p) && V.sels.size > 1) {
        V.sels.delete(p);
        if (V.sel === p) V.sel = [...V.sels].pop();
      } else {
        V.sels.add(p);
        V.sel = p;
      }
    } else {
      V.sels = new Set([p]);
      V.sel = p;
    }
    materials();
    panel();
    if (V.tool == "ex") toolPanel("ex", true);
    if (V.tool == "struct") treePaint();
    // une structure choisie : la fenêtre d'outils ouverte se replie pour laisser voir le modèle
    if (p && V.tool && !$("atsheet").classList.contains("min")) sheetMin(true);
  }
  V.select = select;
  // noms des autres structures dans le texte d'une fiche → liens qui les montrent sur le modèle
  let LINKS = null;
  function linkIndex() {
    if (LINKS) return LINKS;
    const m = new Map(),
      add = (n, p) => {
        const k = String(n || "").trim().toLowerCase();
        if (k.length >= 4 && !m.has(k)) m.set(k, p);
      };
    for (const p of V.parts) if (!p.zone) add(p.meta.fr, p);
    for (const p of V.parts) if (!p.zone && V.fiches[p.meta.fiche]) add(V.fiches[p.meta.fiche].titre, p);
    const rx = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      names = [...m.keys()].sort((a, b) => b.length - a.length);
    LINKS = { m, re: names.length ? new RegExp("(^|[^\\p{L}])(" + names.map(rx).join("|") + ")(?![\\p{L}])", "giu") : null };
    return LINKS;
  }
  function linkText(t, self) {
    t = String(t || "");
    const { m, re } = linkIndex();
    if (!re) return esc(t);
    let out = "",
      last = 0,
      x;
    re.lastIndex = 0;
    while ((x = re.exec(t))) {
      const st = x.index + x[1].length,
        nm = x[2],
        p = m.get(nm.toLowerCase());
      if (!p || p === self || (self && p.meta.fiche && p.meta.fiche === self.meta.fiche)) continue;
      out += esc(t.slice(last, st)) + '<button class="atlk" data-i="' + V.parts.indexOf(p) + '">' + esc(nm) + "</button>";
      last = st + nm.length;
    }
    return out + esc(t.slice(last));
  }
  // comparaison de deux structures : leurs fiches rubrique par rubrique
  function comparePanel(pan) {
    const [a, b] = [V.sel, [...V.sels].find((x) => x !== V.sel)],
      fa = V.fiches[a.meta.fiche] || { rows: [] },
      fb = V.fiches[b.meta.fiche] || { rows: [] },
      labels = [...new Set([...fa.rows.map((r) => r[0]), ...fb.rows.map((r) => r[0])])],
      val = (f, l) => ((f.rows.find((r) => r[0] == l) || [])[1] || "—");
    pan.innerHTML =
      '<button class="atpx" aria-label="Fermer la comparaison">✕</button><small class="atpc">Comparaison</small>' +
      '<div class="atcmp"><div class="atcmh"><span></span><b>' + esc(a.meta.fr) + "</b><b>" + esc(b.meta.fr) + "</b></div>" +
      '<div class="atcmr"><span>En bref</span><p>' + esc(fa.desc || "—") + "</p><p>" + esc(fb.desc || "—") + "</p></div>" +
      labels.map((l) => '<div class="atcmr"><span>' + esc(l) + "</span><p>" + esc(val(fa, l)) + "</p><p>" + esc(val(fb, l)) + "</p></div>").join("") +
      (fa.note || fb.note ? '<div class="atcmr"><span>À retenir</span><p>' + esc(fa.note || "—") + "</p><p>" + esc(fb.note || "—") + "</p></div>" : "") +
      '</div><div class="atpb"><button class="b" id="atcmx">Retour à la fiche</button></div>';
    pan.querySelector(".atpx").onclick = () => ((V.cmp = false), select(null));
    $("atcmx").onclick = () => ((V.cmp = false), panel());
  }
  function panel() {
    const pan = $("atpan"),
      p = V.sel;
    $("atl").classList.toggle("pan-open", !!p);
    if (!p) {
      pan.classList.remove("show");
      return;
    }
    if (V.cmp && V.sels.size > 1) {
      comparePanel(pan);
      pan.scrollTop = 0;
      pan.classList.add("show");
      return;
    }
    V.cmp = false;
    const f = V.fiches[p.meta.fiche],
      chips =
        V.sels.size > 1
          ? '<div class="atchips">' +
            [...V.sels]
              .map(
                (s) =>
                  '<span class="atchip' + (s === p ? " on" : "") + '"><button data-i="' + V.parts.indexOf(s) + '">' + esc(s.meta.fr) +
                  '</button><button class="atchx" data-x="' + V.parts.indexOf(s) + '" aria-label="Retirer">×</button></span>',
              )
              .join("") +
            "</div>"
          : "";
    pan.innerHTML =
      '<button class="atpx" aria-label="Fermer la fiche">✕</button>' + chips +
      '<small class="atpc">' + esc(f ? f.cat : ATL.sysFr[p.meta.systeme] || "") + "</small><h3>" + esc(p.meta.fr) + "</h3>" +
      (f && atNorm(f.titre) != atNorm(p.meta.fr) ? '<small class="atpf">Fiche : ' + esc(f.titre) + "</small>" : "") +
      // atlas plus détaillé pour cette structure : on le propose en évidence
      Object.keys(ATL.detail)
        .filter((m) => m !== model.id && ATL.detail[m].includes(p.meta.fiche))
        .map((m) => {
          const mm = ATL.models.find((x) => x.id == m) || { titre: m };
          return (
            '<button class="atdet" data-m="' + m + '" data-f="' + esc(p.meta.fr) + '"><span class="atgi">' + atlasIco(m) + "</span><span><small>Atlas détaillé disponible</small><b>Ouvrir l’atlas « " +
            esc(mm.titre) + " »</b></span>" + icn("chev") + "</button>"
          );
        })
        .join("") +
      '<div class="atpb atpa"><button class="b" id="atiso1">Isoler' + (V.sels.size > 1 ? " la sélection" : "") +
      '</button><button class="b" id="atnei">Voir les voisines</button><button class="b" id="atmul">' + (V.multi ? "✓ Sélection multiple" : "＋ Sélectionner d’autres") +
      '</button><button class="b" id="atorb">Tourner autour</button>' +
      (V.sels.size > 1 ? '<button class="b p" id="atcmp">' + atIco("cmp") + " Comparer</button>" : "") +
      "</div>" +
      (f
        ? '<p class="atpd">' + linkText(f.desc, p) + "</p><dl>" + f.rows.map((r) => "<dt>" + esc(r[0]) + "</dt><dd>" + linkText(r[1], p) + "</dd>").join("") + "</dl>" +
          (f.note ? '<div class="atpn"><b>À retenir</b>' + linkText(f.note, p) + "</div>" : "")
        : '<p class="atpd">Pas encore de fiche pour cette structure.</p>') +
      '<small class="atpe">' + esc(p.meta.en || "") + '</small><div class="atpb">' +
      (f ? '<button class="b p" id="atfc">' + icn("cards") + " Créer des flashcards</button>" : "") +
      '<button class="b" id="atsnap">' + icn("image") + " Flashcard image" + (V.sels.size > 1 ? " (" + V.sels.size + ")" : "") + "</button>" +
      '<button class="b" id="athide">Masquer</button></div><div id="atfcs"></div>' +
      '<div class="atnotes"><label for="atnt">' + icn("pen") + " Mes notes</label>" +
      '<textarea id="atnt" rows="3" placeholder="Une astuce, une remarque du prof, un moyen mnémotechnique…">' + esc(noteGet(p)) + "</textarea></div>";
    pan.scrollTop = 0;
    pan.style.setProperty("--sc", "#" + (ATL.colors[p.meta.systeme] || 0x5fd4c8).toString(16).padStart(6, "0"));
    pan.classList.add("show");
    // téléphone : la fiche prend la place de la fenêtre d'outils
    if (V.tool && matchMedia("(max-width: 760px), (orientation: landscape) and (max-height: 500px)").matches) toolPanel(V.tool);
    pan.querySelector(".atpx").onclick = () => select(null);
    pan.querySelectorAll(".atchip button[data-i]").forEach((b) => (b.onclick = () => ((V.sel = V.parts[+b.dataset.i]), materials(), panel())));
    pan.querySelectorAll(".atchx").forEach((b) => (b.onclick = () => select(V.parts[+b.dataset.x], true)));
    $("athide").onclick = () => {
      V.sels.forEach((s) => V.hOne.add(s));
      select(null);
      vis();
    };
    $("atiso1").onclick = () => isolate(V.sels);
    $("atmul").onclick = () => {
      V.multi = !V.multi;
      panel();
      toast(V.multi ? "Touche d’autres structures pour les ajouter (sur ordinateur : Maj + clic)." : "Sélection simple");
    };
    $("atorb").onclick = () => orbitOn(p);
    pan.querySelectorAll(".atdet").forEach((b) => (b.onclick = () => (V.overlay ? atlasOpen(b.dataset.m, b.dataset.f, true) : atlasGo(b.dataset.m, b.dataset.f))));
    // voisines : on isole la sélection puis on ajoute les structures à son contact
    $("atnei").onclick = () => {
      isolate(V.sels);
      neighbours();
    };
    if ($("atfc")) $("atfc").onclick = () => atlasCardsForm(f);
    if ($("atcmp")) $("atcmp").onclick = () => ((V.cmp = true), panel());
    pan.querySelectorAll(".atlk").forEach((b) => (b.onclick = () => focusPart(V.parts[+b.dataset.i])));
    $("atsnap").onclick = snapCards;
    let nt = 0;
    $("atnt").oninput = (e) => {
      clearTimeout(nt);
      nt = setTimeout(() => noteSet(p, e.target.value), 500);
    };
  }

  // ---------- notes personnelles (synchronisées) et épingles sur le modèle ----------
  const noteKey = (p) => p.mesh.name || p.meta.fr;
  function noteGet(p) {
    return (S.atn && S.atn[model.id] && S.atn[model.id][noteKey(p)]) || "";
  }
  function noteSet(p, txt) {
    S.atn = S.atn || {};
    const m = (S.atn[model.id] = S.atn[model.id] || {}),
      t = String(txt || "").slice(0, 2000).trim();
    if (t) m[noteKey(p)] = t;
    else delete m[noteKey(p)];
    save();
    pinsBuild();
  }
  function pinsBuild() {
    V.labels = V.labels.filter((Lb) => {
      if (Lb.pin) Lb.el.remove();
      return !Lb.pin;
    });
    for (const p of V.parts) {
      if (!noteGet(p)) continue;
      p.mesh.geometry.computeBoundingBox();
      const el = document.createElement("button");
      el.className = "atlb atpin";
      el.title = noteGet(p);
      el.innerHTML = "<i></i><em></em><span>✎ " + esc(p.meta.fr) + "</span>";
      el.onclick = () => (V.quiz ? null : select(p));
      $("atlbl").appendChild(el);
      V.labels.push({ p, el, pin: 1, local: p.mesh.geometry.boundingBox.getCenter(new T.Vector3()) });
    }
    need();
  }

  // ---------- flashcard-image : capture de la vue avec un repère numéroté par structure sélectionnée ----------
  function snapCards() {
    const list = [...V.sels];
    if (!list.length) return;
    // capture sans la surbrillance de la sélection
    const keep = V.sels;
    V.sels = new Set();
    materials();
    draw();
    const W = canvas.width,
      H = canvas.height,
      sc = Math.min(1, 960 / W),
      c2 = document.createElement("canvas");
    c2.width = Math.round(W * sc);
    c2.height = Math.round(H * sc);
    const g = c2.getContext("2d");
    g.drawImage(canvas, 0, 0, c2.width, c2.height);
    V.sels = keep;
    materials();
    const cw = canvas.clientWidth,
      ch = canvas.clientHeight,
      k = c2.width / cw,
      R = Math.max(12, Math.round(c2.width / 55));
    list.forEach((p, i) => {
      const b = new T.Box3().setFromObject(p.mesh),
        xy = proj(b.getCenter(new T.Vector3()), cw, ch);
      if (!xy) return;
      const x = xy[0] * k,
        y = xy[1] * k;
      g.beginPath();
      g.arc(x, y, R, 0, Math.PI * 2);
      g.fillStyle = "#ffd33d";
      g.fill();
      g.lineWidth = Math.max(2, R / 6);
      g.strokeStyle = "#111";
      g.stroke();
      g.fillStyle = "#111";
      g.font = "700 " + Math.round(R * 1.15) + "px Inter, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(i + 1), x, y + 1);
    });
    const img = c2.toDataURL("image/jpeg", 0.82),
      titre = model.titre;
    atlasChapterForm(
      list.map((p, i) => ({
        recto: "Atlas 3D, " + titre + " : quelle est la structure n° " + (i + 1) + " ?",
        verso: p.meta.fr,
        img,
        key: "img|" + p.meta.fr,
      })),
      "flashcard-image",
    );
  }

  // ---------- quiz 3D ----------
  const QN = 10;
  function quizStart(mode) {
    mode = mode || (V.quiz && V.quiz.mode) || "touche";
    if (V.breath.on) breathStop();
    select(null);
    // les structures souvent ratées (ou jamais vues) reviennent plus souvent
    const st = (S.atq && S.atq.s) || {},
      weight = (p) => {
        const o = st[model.id + "|" + p.meta.fr];
        return Math.random() + (o ? (1.6 * o.k) / o.n : 0.5);
      },
      pool = V.parts.filter((p) => p.mesh.visible && !p.zone && (mode != "fiche" || ficheQ(p))),
      seen = new Set(),
      list = [];
    for (const p of pool.map((p) => [weight(p), p]).sort((a, b) => b[0] - a[0]).map((x) => x[1])) {
      if (list.length >= QN) break;
      const key = mode == "fiche" ? p.meta.fiche : p.meta.fr;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(p);
    }
    if (list.length < 3) return toast(mode == "fiche" ? "Pas assez de fiches parmi les structures affichées." : "Affiche au moins 3 structures pour lancer un quiz.");
    V.quiz = { list, i: 0, ok: 0, wait: false, mode, qs: mode == "fiche" ? list.map(ficheQ) : null };
    if (V.tool) toolPanel(V.tool);
    dockState();
    $("atlbl").hidden = true;
    quizPaint();
  }
  function quizPaint(msg, cls) {
    const Q = V.quiz,
      box = $("atquiz");
    if (!Q) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (Q.i >= Q.list.length) {
      const pc = Math.round((Q.ok / Q.list.length) * 100);
      box.innerHTML =
        '<div class="atqz"><b>Quiz terminé : ' + Q.ok + " / " + Q.list.length + "</b><small>" +
        (pc >= 80 ? "Excellent, tu maîtrises cette région." : pc >= 50 ? "Pas mal : refais-le pour ancrer les noms." : "Révise les fiches, puis retente.") +
        "</small></div>" +
        (typeof MIX != "undefined" && MIX && MIX.live && (MIX.steps[MIX.i] || {}).k == "atlas"
          ? '<div class="atpb"><button class="b p" id="atqmix">Terminer la révision du jour</button></div>'
          : '<div class="atpb"><button class="b p" id="atqre">Recommencer</button><button class="b" id="atqend">Fermer</button></div>');
      if ($("atqmix")) {
        $("atqmix").onclick = () => {
          quizStop();
          mixDone();
        };
        return;
      }
      $("atqre").onclick = () => quizStart(Q.mode);
      $("atqend").onclick = quizStop;
      return;
    }
    const p = Q.list[Q.i];
    if (Q.mode == "nom") return quizNamePaint(Q, p, msg, cls);
    if (Q.mode == "fiche") return quizFichePaint(Q, p, msg, cls);
    box.innerHTML =
      '<div class="atqz' + (cls ? " " + cls : "") + '"><small>Question ' + (Q.i + 1) + " / " + Q.list.length + " · " + Q.ok + " bonne" + (Q.ok > 1 ? "s" : "") +
      "</small><b>" + (msg || "Touche : " + esc(p.meta.fr)) +
      '</b></div><div class="atpb"><button class="b" id="atqskip">Passer</button><button class="b" id="atqend">Arrêter</button></div>';
    $("atqskip").onclick = () => quizAnswer(null);
    $("atqend").onclick = quizStop;
  }
  function quizAnswer(hit) {
    const Q = V.quiz;
    if (!Q || Q.wait || Q.i >= Q.list.length) return;
    const want = Q.list[Q.i],
      good = !!hit && hit.meta.fr === want.meta.fr;
    if (good) Q.ok++;
    qStat(want, good);
    Q.wait = true;
    if (hit && !good) hit.mesh.material.emissive.setHex(0x7a1010);
    want.mesh.material.emissive.setHex(0x1f7a3a);
    need();
    quizPaint(good ? "✔ Bravo : " + esc(want.meta.fr) : (hit ? "✘ Tu as touché : " + esc(hit.meta.fr) + ". " : "") + "C’était ici, en vert.", good ? "ok" : "ko");
    setTimeout(
      () => {
        if (V.quiz !== Q || ATL.v !== V) return;
        want.mesh.material.emissive.setHex(0);
        if (hit) hit.mesh.material.emissive.setHex(0);
        Q.wait = false;
        Q.i++;
        need();
        if (Q.i >= Q.list.length) quizSave(Q);
        quizPaint();
      },
      good ? 900 : 1800,
    );
  }
  // mode « Nomme la structure » : la structure s'allume, on écrit son nom (avec suggestions)
  function quizNamePaint(Q, p, msg, cls) {
    const box = $("atquiz");
    if (!msg) {
      V.parts.forEach((x) => x.mesh.material.emissive.setHex(0));
      p.mesh.material.emissive.setHex(0x2f7fb3);
      orbitOn(p);
    }
    box.innerHTML =
      '<div class="atqz' + (cls ? " " + cls : "") + '"><small>Question ' + (Q.i + 1) + " / " + Q.list.length + " · " + Q.ok + " bonne" + (Q.ok > 1 ? "s" : "") +
      "</small><b>" + (msg || "Quelle est la structure en bleu ?") + "</b></div>" +
      (msg ? "" : '<div class="ats atqin"><input id="atqa" type="text" autocomplete="off" placeholder="Écris son nom…" aria-label="Ta réponse"><div id="atqsug"></div></div>') +
      '<div class="atpb">' + (msg ? "" : '<button class="b p" id="atqok">Valider</button>') + '<button class="b" id="atqskip">Passer</button><button class="b" id="atqend">Arrêter</button></div>';
    $("atqskip").onclick = () => quizNameAnswer(null);
    $("atqend").onclick = quizStop;
    if (msg) return;
    const inp = $("atqa"),
      sg = $("atqsug");
    let cur = [];
    inp.oninput = () => {
      cur = inp.value.trim().length > 1 ? search(inp.value).slice(0, 6) : [];
      sg.innerHTML = cur.map((x, i) => '<button data-i="' + i + '">' + esc(x.meta.fr) + "</button>").join("");
      sg.querySelectorAll("button").forEach((b) => (b.onmousedown = (e) => (e.preventDefault(), (inp.value = cur[+b.dataset.i].meta.fr), (sg.innerHTML = ""))));
    };
    inp.onkeydown = (e) => e.key == "Enter" && (e.preventDefault(), quizNameAnswer(inp.value));
    $("atqok").onclick = () => quizNameAnswer(inp.value);
    setTimeout(() => inp.focus(), 50);
  }
  function quizNameAnswer(txt) {
    const Q = V.quiz;
    if (!Q || Q.wait) return;
    const want = Q.list[Q.i],
      good = !!txt && atNorm(txt).trim() === atNorm(want.meta.fr);
    if (good) Q.ok++;
    qStat(want, good);
    Q.wait = true;
    want.mesh.material.emissive.setHex(good ? 0x1f7a3a : 0x7a1010);
    need();
    quizNamePaint(Q, want, good ? "✔ Bravo : " + esc(want.meta.fr) : "✘ C’était : " + esc(want.meta.fr), good ? "ok" : "ko");
    setTimeout(
      () => {
        if (V.quiz !== Q || ATL.v !== V) return;
        want.mesh.material.emissive.setHex(0);
        Q.wait = false;
        Q.i++;
        if (Q.i >= Q.list.length) quizSave(Q);
        quizPaint();
      },
      good ? 1000 : 2200,
    );
  }
  // statistiques par structure (pour la répétition espacée du quiz)
  function qStat(p, good) {
    S.atq = S.atq || { hist: [] };
    const s = (S.atq.s = S.atq.s || {}),
      k = model.id + "|" + p.meta.fr,
      o = (s[k] = s[k] || { n: 0, k: 0 });
    o.n++;
    if (!good) o.k++;
    o.t = Date.now();
  }
  // question sur la fiche : une rubrique (innervation, action…) et 4 réponses dont 3 prises dans d'autres fiches
  function ficheQ(p) {
    const f = V.fiches[p.meta.fiche];
    if (!f || !f.rows || !f.rows.length) return null;
    const opts = f.rows
      .map((r) => {
        const others = [
          ...new Set(
            Object.keys(V.fiches)
              .filter((k) => k != p.meta.fiche)
              .map((k) => ((V.fiches[k].rows || []).find((x) => x[0] == r[0]) || [])[1])
              .filter((v) => v && v != r[1]),
          ),
        ];
        return others.length >= 3 ? { label: r[0], ans: r[1], wrong: others } : null;
      })
      .filter(Boolean);
    if (!opts.length) return null;
    const q = opts[Math.floor(Math.random() * opts.length)],
      wrong = q.wrong.sort(() => Math.random() - 0.5).slice(0, 3);
    return { titre: f.titre || p.meta.fr, label: q.label, ans: q.ans, choices: [q.ans, ...wrong].sort(() => Math.random() - 0.5) };
  }
  function quizFichePaint(Q, p, msg, cls) {
    const box = $("atquiz"),
      q = Q.qs[Q.i];
    if (!msg) {
      V.parts.forEach((x) => x.mesh.material.emissive.setHex(0));
      p.mesh.material.emissive.setHex(0x2f7fb3);
      orbitOn(p);
    }
    box.innerHTML =
      '<div class="atqz' + (cls ? " " + cls : "") + '"><small>Question ' + (Q.i + 1) + " / " + Q.list.length + " · " + Q.ok + " bonne" + (Q.ok > 1 ? "s" : "") +
      "</small><b>" + esc(q.titre) + " (en bleu) : " + esc(q.label.toLowerCase()) + " ?</b></div>" +
      '<div class="atqcs">' +
      q.choices
        .map((c, i) => '<button class="atqc' + (msg ? (c == q.ans ? " ok" : c == Q.pick ? " ko" : "") : "") + '" data-i="' + i + '"' + (msg ? " disabled" : "") + ">" + esc(c) + "</button>")
        .join("") +
      '</div><div class="atpb">' + (msg ? "" : '<button class="b" id="atqskip">Passer</button>') + '<button class="b" id="atqend">Arrêter</button></div>';
    $("atqend").onclick = quizStop;
    if (msg) return;
    const answer = (c) => {
      if (Q.wait) return;
      const good = c === q.ans;
      Q.pick = c;
      if (good) Q.ok++;
      qStat(p, good);
      Q.wait = true;
      quizFichePaint(Q, p, good ? "ok" : "ko", good ? "ok" : "ko");
      setTimeout(
        () => {
          if (V.quiz !== Q || ATL.v !== V) return;
          p.mesh.material.emissive.setHex(0);
          Q.wait = false;
          Q.pick = null;
          Q.i++;
          if (Q.i >= Q.list.length) quizSave(Q);
          quizPaint();
        },
        good ? 1100 : 2600,
      );
    };
    box.querySelectorAll(".atqc").forEach((b) => (b.onclick = () => answer(q.choices[+b.dataset.i])));
    $("atqskip").onclick = () => answer(null);
  }
  function quizSave(Q) {
    S.atq = S.atq || { hist: [] };
    S.atq.hist.push({ d: day(), t: Date.now(), m: model.id, n: Q.list.length, ok: Q.ok, mode: Q.mode });
    if (S.atq.hist.length > 300) S.atq.hist = S.atq.hist.slice(-300);
    save();
  }
  function quizStop() {
    if (V.quiz) save();
    if (V.quiz && V.quiz.tm) clearInterval(V.quiz.tm);
    V.quiz = null;
    dockState();
    $("atlbl").hidden = !V.showLbl;
    quizPaint();
    materials();
  }
  function quizMenu() {
    if (V.quiz) return quizStop();
    if (!$("atquiz").hidden) return ($("atquiz").hidden = true);
    const box = $("atquiz");
    box.hidden = false;
    box.innerHTML =
      '<div class="atqz"><b>Quiz 3D</b><small>10 questions sur les structures affichées</small></div><div class="atpb">' +
      '<button class="b p" id="atqm1">Touche la structure</button><button class="b p" id="atqm2">Nomme la structure</button><button class="b p" id="atqm3">Questions sur les fiches</button><button class="b p" id="atqm4">Examen 3D noté sur 20</button><button class="b" id="atqm0">Annuler</button></div>' +
      '<small class="atqhint">Les structures que tu rates reviennent plus souvent.</small>';
    $("atqm1").onclick = () => quizStart("touche");
    $("atqm3").onclick = () => quizStart("fiche");
    $("atqm4").onclick = () => examStart();
    $("atqm2").onclick = () => quizStart("nom");
    $("atqm0").onclick = () => (box.hidden = true);
  }

  // ---------- bandeau du bas pour les animations et les parcours ----------
  function bar(html) {
    let b = $("atanim");
    if (!html) return b && b.remove();
    if (!b) {
      b = document.createElement("div");
      b.id = "atanim";
      b.className = "atb";
      b.setAttribute("aria-live", "polite");
      $("atl").appendChild(b);
    }
    b.innerHTML = html;
    return b;
  }

  // ---------- battement cardiaque (schématique) avec les bruits B1 et B2 ----------
  const hbOk = () => V.parts.some((p) => /^(right|left) ventricle$/.test(p.meta.fiche || ""));
  let actx = null;
  function thump(f, dur, g) {
    if (!V.hb.snd) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(),
        v = actx.createGain(),
        t = actx.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, t + dur);
      v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(g, t + 0.012);
      v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(v).connect(actx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function hbSetup() {
    const grp = (re) => V.parts.filter((p) => re.test(p.meta.fiche || "")),
      ctr = (ps) => ps.reduce((v, p) => v.add(p.c), new T.Vector3()).multiplyScalar(1 / Math.max(1, ps.length)),
      A = grp(/atrium$/),
      Vn = grp(/ventricle$/),
      Ca = ctr(A),
      Cv = ctr(Vn);
    for (const p of V.parts) p.hb = null;
    A.forEach((p) => (p.hb = { g: "a", C: Ca }));
    Vn.forEach((p) => (p.hb = { g: "v", C: Cv, w: 1 }));
    grp(/^papillary/).forEach((p) => (p.hb = { g: "v", C: Cv, w: 1 }));
    // vaisseaux coronaires : ils suivent la surface des ventricules
    V.parts
      .filter((p) => /coronary|interventricular|circumflex|marginal|septal|cardiac vein|coronary sinus|inferior vein lv/.test(p.meta.fiche || ""))
      .forEach((p) => (p.hb = { g: "v", C: Cv, w: 0.8 }));
    V.hb.av = V.parts.filter((p) => /^(tricuspid|mitral) valve$/.test(p.meta.fiche || ""));
    V.hb.sl = V.parts.filter((p) => /^(aortic|pulmonary) valve$/.test(p.meta.fiche || ""));
    V.hb.ready = true;
  }
  const HB_PH = [
    ["Systole auriculaire", "Les atriums se contractent et finissent de remplir les ventricules."],
    ["Systole ventriculaire · B1", "Fermeture des valves mitrale et tricuspide (B1), puis ouverture des valves aortique et pulmonaire : éjection."],
    ["Diastole · B2", "Fermeture des valves aortique et pulmonaire (B2), ouverture des valves atrio-ventriculaires : les ventricules se remplissent."],
  ];
  function hbBar(full) {
    const ph = HB_PH[Math.max(0, V.hb.ph || 0)];
    // mise à jour du texte seulement : les boutons restent en place (sinon ils sont difficiles à toucher)
    if (!full && $("athbx")) {
      $("atanim").querySelector("b").textContent = ph[0];
      $("atanim").querySelector(".atanh small").textContent = ph[1];
      return;
    }
    bar(
      '<div class="atanh"><span class="atanic">' + atIco("hb") + '</span><div><b>' + ph[0] + "</b><small>" + ph[1] + "</small></div></div>" +
        '<div class="atanb"><button id="athbs">' + (V.hb.speed < 1 ? "Vitesse normale" : "Ralenti") + '</button><button id="athbm">' + (V.hb.snd ? "Son : oui" : "Son : non") +
        '</button><button id="athbx">Arrêter</button></div>',
    );
    $("athbs").onclick = () => {
      V.hb.speed = V.hb.speed < 1 ? 1 : 0.35;
      hbBar(true);
    };
    $("athbm").onclick = () => {
      V.hb.snd = !V.hb.snd;
      hbBar(true);
    };
    $("athbx").onclick = hbStop;
  }
  function hbStart() {
    if (V.breath.on) breathStop();
    if (V.path) pathStop();
    if (!V.hb.ready) hbSetup();
    exSet(0, true);
    bar("");
    // atlas du thorax : le cœur et ses gros vaisseaux restent nets, le reste passe en retrait
    if (V.parts.some((p) => !p.hb && p.meta.systeme == "os")) {
      V.ghost = new Set(V.parts.filter((p) => p.hb || /valve|aorta|pulmonary|vena cava/.test(p.meta.fiche || "")));
      fadeTo(500);
    }
    Object.assign(V.hb, { on: true, t0: performance.now(), ph: -1, cyc: 0, last: 0 });
    dockState();
    if (V.tool == "anim") toolPanel("anim", true);
  }
  function hbStop() {
    V.hb.on = false;
    bar("");
    pose();
    if (V.ghost && !V.tour) V.ghost = null;
    fadeTo(500);
    dockState();
    if (V.tool == "anim") toolPanel("anim", true);
  }
  function hbTick(now) {
    const H = V.hb,
      T0 = 1.05; // un cycle ≈ 57 battements par minute
    H.cyc += ((now - (H.last || now)) / 1000) * H.speed;
    H.last = now;
    const t = (H.cyc / T0) % 1,
      e = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
    H.ka = t < 0.13 ? 1 - 0.07 * Math.sin((Math.PI * t) / 0.13) : 1;
    H.kv = t < 0.13 ? 1 : t < 0.3 ? 1 - 0.1 * e((t - 0.13) / 0.17) : t < 0.45 ? 0.9 : t < 0.7 ? 0.9 + 0.1 * e((t - 0.45) / 0.25) : 1;
    const ph = t < 0.13 ? 0 : t < 0.45 ? 1 : 2;
    if (ph !== H.ph) {
      if (ph == 1) thump(62, 0.16, 0.5);
      if (ph == 2) thump(88, 0.11, 0.35);
      H.ph = ph;
      hbBar();
      // valves fermées en surbrillance : AV pendant la systole ventriculaire, sigmoïdes pendant la diastole
      const closed = ph == 1 ? H.av : ph == 2 ? H.sl : [],
        open = ph == 1 ? H.sl : ph == 2 ? H.av : [...H.av, ...H.sl];
      closed.forEach((p) => p.mesh.material.emissive.setHex(0x5a3a08));
      open.forEach((p) => p.mesh.material.emissive.setHex(0));
    }
    pose();
  }

  // ---------- trajets animés : circulation, air, nerfs ----------
  const PATHS = [
    {
      id: "circ", n: "Circulation sanguine", d: "Petite puis grande circulation, à travers le cœur.",
      steps: [
        ["Veine cave supérieure", "line"], ["Atrium droit"], ["Valve tricuspide"], ["Ventricule droit"], ["Valve pulmonaire"], ["Tronc pulmonaire"],
        ["Artère pulmonaire droite", "line"], ["Veine pulmonaire supérieure droite", "line", "ox"], ["Atrium gauche", "", "ox"], ["Valve mitrale"], ["Ventricule gauche"],
        ["Valve aortique"], ["Aorte ascendante", "line"], ["Arc de l'aorte (crosse)", "line"], ["Aorte thoracique descendante", "line"],
      ],
      hint: { "Artère pulmonaire droite": "→ capillaires pulmonaires : le sang se charge en oxygène (hématose)" },
    },
    {
      id: "air-d", n: "Trajet de l’air : lobe inférieur droit", d: "De la trachée jusqu’au segment basal postérieur (B10).",
      steps: [["Trachée", "line"], ["Bronche principale droite", "line"], ["Bronche intermédiaire (droite)", "line"], ["Bronche lobaire inférieure droite", "line"],
        ["Bronche segmentaire basale postérieure droite (B10)", "line"], ["Lobe inférieur du poumon droit"], ["Lobe inf. droit"]],
    },
    {
      id: "air-g", n: "Trajet de l’air : lobe supérieur gauche", d: "De la trachée jusqu’au segment apico-postérieur (B1+2).",
      steps: [["Trachée", "line"], ["Bronche principale gauche", "line"], ["Bronche lobaire supérieure gauche", "line"],
        ["Bronche segmentaire apico-postérieure gauche (B1+2)", "line"], ["Lobe supérieur du poumon gauche"], ["Lobe sup. gauche"]],
    },
    {
      id: "vag-g", n: "Nerf vague gauche", d: "Croise la face antérieure de l’arc de l’aorte (naissance du nerf laryngé récurrent gauche), passe derrière le pédicule pulmonaire puis rejoint l’œsophage.",
      steps: [["Nerf vague gauche (X)", "line"]],
    },
    {
      id: "vag-d", n: "Nerf vague droit", d: "Croise l’artère subclavière droite (récurrent droit), longe la trachée, passe derrière le pédicule pulmonaire droit puis rejoint l’œsophage.",
      steps: [["Nerf vague droit (X)", "line"]],
    },
  ];
  // parties correspondant à une étape : nom exact, sinon début du nom (ex. « Valve tricuspide : … »)
  const stepParts = (n) => {
    const t = atNorm(n),
      ex = V.parts.filter((p) => atNorm(p.meta.fr) === t);
    return ex.length ? ex : V.parts.filter((p) => atNorm(p.meta.fr).startsWith(t));
  };
  function pathsOf() {
    if (V.pathList) return V.pathList;
    return (V.pathList = PATHS.map((P) => {
      const seen = new Set(),
        steps = P.steps
          .map(([n, kind, ox]) => ({ n, kind, ox, ps: stepParts(n) }))
          .filter((st) => st.ps.length && !seen.has(st.ps[0]) && seen.add(st.ps[0]));
      return { ...P, steps };
    }).filter((P) => P.steps.length >= (P.steps.length == 1 && P.steps[0].kind == "line" ? 1 : 3)));
  }
  // ligne centrale d'une structure allongée : moyenne des sommets par tranche le long de son grand axe
  function centerline(p, from) {
    const pos = p.mesh.geometry.attributes.position,
      m = p.mesh,
      v = new T.Vector3(),
      pts = [];
    m.updateWorldMatrix(true, false);
    const step = Math.max(1, Math.floor(pos.count / 4000));
    for (let i = 0; i < pos.count; i += step) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
    const box = new T.Box3().setFromPoints(pts),
      sz = box.getSize(new T.Vector3()),
      ax = sz.x >= sz.y && sz.x >= sz.z ? "x" : sz.y >= sz.z ? "y" : "z",
      N = Math.max(4, Math.min(14, Math.round(sz[ax] / 0.012))),
      bins = Array.from({ length: N }, () => new T.Box3());
    // centre de la boîte de chaque tranche (plus stable que la moyenne des sommets pour un tube)
    for (const q of pts) bins[Math.min(N - 1, Math.floor(((q[ax] - box.min[ax]) / (sz[ax] || 1)) * N))].expandByPoint(q);
    let line = bins.filter((b) => !b.isEmpty()).map((b) => b.getCenter(new T.Vector3()));
    // lissage léger
    line = line.map((q, i) => (i == 0 || i == line.length - 1 ? q : q.clone().multiplyScalar(0.5).addScaledVector(line[i - 1], 0.25).addScaledVector(line[i + 1], 0.25)));
    if (from && line.length > 1 && line[0].distanceTo(from) > line[line.length - 1].distanceTo(from)) line.reverse();
    // une structure verticale isolée se parcourt de haut en bas
    if (!from && line.length > 1 && line[0].y < line[line.length - 1].y) line.reverse();
    return line;
  }
  const wc = (ps) => ps.reduce((v, p) => v.add(new T.Box3().setFromObject(p.mesh).getCenter(new T.Vector3())), new T.Vector3()).multiplyScalar(1 / ps.length);
  function pathStart(P) {
    if (V.breath.on) breathStop();
    if (V.hb.on) hbStop();
    if (V.path) pathStop(true);
    bar("");
    select(null);
    const pts = [],
      marks = [];
    let last = null;
    for (const st of P.steps) {
      marks.push(pts.length);
      if (st.kind == "line") for (const q of centerline(st.ps[0], last)) pts.push(q);
      else pts.push(wc(st.ps));
      last = pts[pts.length - 1];
    }
    // points trop proches (ou invalides) : la courbe deviendrait indéfinie
    for (let k = pts.length - 1; k > 0; k--)
      if (!isFinite(pts[k].x + pts[k].y + pts[k].z) || pts[k].distanceTo(pts[k - 1]) < 0.0015) {
        pts.splice(k, 1);
        for (let m = 0; m < marks.length; m++) if (marks[m] >= k) marks[m] = Math.max(0, marks[m] - 1);
      }
    if (pts.length < 2) return toast("Trajet indisponible dans cet atlas.");
    const curve = new T.CatmullRomCurve3(pts, false, "centripetal"),
      lens = curve.getLengths(pts.length * 8),
      total = lens[lens.length - 1],
      // position (0..1) du début de chaque étape le long du trajet
      at = marks.map((i) => {
        let d = 0;
        for (let k = 1; k <= i; k++) d += pts[k].distanceTo(pts[k - 1]);
        return d;
      }),
      dtot = at.length ? pts.reduce((d, q, k) => (k ? d + q.distanceTo(pts[k - 1]) : 0), 0) : 1,
      dot = new T.Mesh(new T.SphereGeometry(0.003, 16, 12), new T.MeshBasicMaterial({ color: 0x5aa2ff, depthTest: false, transparent: true })),
      halo = new T.Mesh(new T.SphereGeometry(0.0065, 16, 12), new T.MeshBasicMaterial({ color: 0x5aa2ff, depthTest: false, transparent: true, opacity: 0.25 })),
      tube = new T.Mesh(new T.TubeGeometry(curve, Math.min(400, pts.length * 6), 0.0012, 6, false), new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.25 }));
    [dot, halo, tube].forEach((o) => ((o.renderOrder = 998), (o.raycast = () => {}), scene.add(o)));
    V.path = { P, curve, at: at.map((d) => d / (dtot || 1)), dur: Math.min(22, Math.max(7, total * 55)) * 1000, t0: performance.now(), dot, halo, tube, st: -1, paused: false, u: 0 };
    V.ghost = new Set(P.steps.flatMap((st) => st.ps));
    fadeTo(600);
    const b = new T.Box3().setFromPoints(pts),
      c = b.getCenter(new T.Vector3()),
      r = Math.max(0.05, b.getSize(new T.Vector3()).length() / 2);
    moveCam(c.clone().add(new T.Vector3(0, 0.15, 1).normalize().multiplyScalar(fitDist(r * 1.15))), c, true, V.ortho ? orthoZoomFor(r * 1.15) : 1);
    dockState();
    if (V.tool) toolPanel(V.tool);
  }
  function pathBar(full) {
    const Pa = V.path,
      st = Pa.P.steps[Math.max(0, Pa.st)],
      hint = (Pa.P.hint || {})[st.n];
    if (!full && $("attrx")) {
      const box = $("atanim").querySelector(".atanh > div");
      box.innerHTML =
        "<small>" + esc(Pa.P.n) + " · étape " + (Pa.st + 1) + " / " + Pa.P.steps.length + "</small><b>" + esc(st.ps[0] && st.n.length > 40 ? st.ps[0].meta.fr : st.n) + "</b>" +
        (hint ? "<small>" + esc(hint) + "</small>" : Pa.P.steps.length == 1 ? "<small>" + esc(Pa.P.d) + "</small>" : "");
      $("attrp").textContent = Pa.paused ? "Reprendre" : "Pause";
      return;
    }
    bar(
      '<div class="atanh"><span class="atanic">' + atIco("trj") + "</span><div><small>" + esc(Pa.P.n) + " · étape " + (Pa.st + 1) + " / " + Pa.P.steps.length +
        "</small><b>" + esc(st.ps[0] && st.n.length > 40 ? st.ps[0].meta.fr : st.n) + "</b>" + (hint ? "<small>" + esc(hint) + "</small>" : Pa.P.steps.length == 1 ? "<small>" + esc(Pa.P.d) + "</small>" : "") +
        '</div></div><div class="atanb"><button id="attrp">' + (Pa.paused ? "Reprendre" : "Pause") + '</button><button id="attrr">Rejouer</button><button id="attrx">Arrêter</button></div>',
    );
    $("attrp").onclick = () => {
      Pa.paused = !Pa.paused;
      if (!Pa.paused) Pa.t0 = performance.now() - Pa.u * Pa.dur;
      pathBar(true);
    };
    $("attrr").onclick = () => pathStart(Pa.P);
    $("attrx").onclick = () => pathStop();
  }
  function pathTick(now) {
    const Pa = V.path;
    // l'horloge de l'animation peut être un peu en retard sur performance.now() : on borne entre 0 et 1
    if (!Pa.paused) Pa.u = Math.min(1, Math.max(0, (now - Pa.t0) / Pa.dur));
    const u = Pa.u,
      q = Pa.curve.getPointAt(u);
    Pa.dot.position.copy(q);
    Pa.halo.position.copy(q);
    Pa.halo.scale.setScalar(1 + 0.25 * Math.sin(now / 160));
    let st = 0;
    Pa.at.forEach((a, i) => u >= a - 1e-6 && (st = i));
    if (st !== Pa.st) {
      const prev = Pa.P.steps[Pa.st];
      if (prev) prev.ps.forEach((p) => p.mesh.material.emissive.setHex(0));
      Pa.st = st;
      const cur = Pa.P.steps[st];
      cur.ps.forEach((p) => p.mesh.material.emissive.copy(selEm));
      // sang : bleu (pauvre en oxygène) puis rouge après les poumons
      const red = Pa.P.id == "circ" && Pa.P.steps.slice(0, st + 1).some((x) => x.ox),
        col = Pa.P.id == "circ" ? (red ? 0xff4a3d : 0x5aa2ff) : Pa.P.id.startsWith("air") ? 0xe8f4ff : 0xffd33d;
      Pa.dot.material.color.setHex(col);
      Pa.halo.material.color.setHex(col);
      pathBar();
    }
    if (u >= 1 && !Pa.paused) {
      Pa.paused = true;
      pathBar();
    }
    V.dirty = true;
  }
  function pathStop(quiet) {
    const Pa = V.path;
    if (!Pa) return;
    [Pa.dot, Pa.halo, Pa.tube].forEach((o) => (o.removeFromParent(), o.geometry.dispose(), o.material.dispose()));
    V.path = null;
    if (!V.tour) V.ghost = null;
    fadeTo(500);
    if (!quiet) bar("");
    dockState();
  }
  function animPaint(box) {
    const rows = [];
    if (breathKind()) rows.push(["br", "Respiration", "Inspiration et expiration, en boucle.", V.breath.on]);
    if (hbOk()) rows.push(["hb", "Battement cardiaque", "Systole et diastole, avec les bruits B1 et B2.", V.hb.on]);
    box.innerHTML =
      (rows.length
        ? '<div class="atprel">' +
          rows.map((r) => '<button data-a="' + r[0] + '"' + (r[3] ? ' class="on"' : "") + "><b>" + (r[3] ? "■ " : "▶ ") + r[1] + "</b><small>" + r[2] + "</small></button>").join("") +
          "</div>"
        : "") +
      (pathsOf().length
        ? '<p class="atlbl2" style="margin:14px 0 6px">Trajets animés</p><div class="atprel">' +
          pathsOf().map((P, i) => '<button data-p="' + i + '"' + (V.path && V.path.P.id == P.id ? ' class="on"' : "") + "><b>▶ " + esc(P.n) + "</b><small>" + esc(P.d) + "</small></button>").join("") +
          "</div>"
        : "");
    box.querySelectorAll("[data-a]").forEach(
      (b) =>
        (b.onclick = () => {
          if (b.dataset.a == "br") V.breath.on ? breathStop() : (V.hb.on && hbStop(), V.path && pathStop(), breathStart());
          else V.hb.on ? hbStop() : hbStart();
          // téléphone : on ferme la fenêtre pour laisser voir l'animation et son bandeau
          if (matchMedia("(max-width: 760px), (orientation: landscape) and (max-height: 500px)").matches) toolPanel("anim");
          else animPaint(box);
        }),
    );
    box.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => pathStart(pathsOf()[+b.dataset.p])));
  }

  // ---------- parcours guidés : intégrés (rédigés) + créés par l'administrateur (parcours.json, lisible par les membres) ----------
  const TOURS = {
    thorax: [
      {
        id: "med", n: "Le médiastin en 6 étapes",
        steps: [
          { t: "Vue d’ensemble", x: "Le médiastin est l’espace entre les deux poumons, du sternum en avant au rachis en arrière, de l’orifice supérieur du thorax au diaphragme.", view: "front", all: 1 },
          { t: "Ses compartiments", x: "On le divise par un plan passant par l’angle sternal (T4-T5) : médiastin supérieur au-dessus ; en dessous, médiastin antérieur, moyen et postérieur.", view: "front", med: 1 },
          { t: "Médiastin supérieur", x: "Contient le thymus, l’arc de l’aorte et ses branches, la veine cave supérieure et les troncs brachiocéphaliques, la trachée, l’œsophage, les nerfs vagues et phréniques, le conduit thoracique.", view: "q34", med: 1, sel: ["zone sup"] },
          { t: "Médiastin antérieur", x: "Entre le sternum et le péricarde : reliquats du thymus, graisse, ligaments sterno-péricardiques.", view: "side", med: 1, sel: ["zone ant"] },
          { t: "Médiastin moyen", x: "Le cœur dans son péricarde, l’aorte ascendante, le tronc pulmonaire, la terminaison de la veine cave supérieure, les nerfs phréniques.", view: "q34", med: 1, sel: ["zone moy"] },
          { t: "Médiastin postérieur", x: "En arrière du péricarde : aorte thoracique descendante, œsophage, veines azygos et hémi-azygos, conduit thoracique, nerfs vagues, troncs sympathiques.", view: "back", med: 1, sel: ["zone post"] },
        ],
      },
      {
        id: "coeur-thx", n: "Le cœur et les gros vaisseaux",
        steps: [
          { t: "Le cœur dans le thorax", x: "Le cœur occupe le médiastin moyen, posé sur le diaphragme, deux tiers à gauche de la ligne médiane.", view: "front", iso: ["right atrium", "left atrium", "right ventricle", "left ventricle", "ascending aorta", "arch of aorta", "pulmonary trunk", "pulmonary artery", "superior vena cava", "inferior vena cava", "sternum", "body of sternum", "manubrium", "diaphragm"] },
          { t: "Le ventricule droit", x: "Le plus antérieur : il forme l’essentiel de la face antérieure du cœur et éjecte dans le tronc pulmonaire.", view: "front", iso: ["right atrium", "left atrium", "right ventricle", "left ventricle", "ascending aorta", "pulmonary trunk", "superior vena cava"], sel: ["right ventricle"] },
          { t: "Le ventricule gauche", x: "Il forme l’apex et le bord gauche ; sa paroi est la plus épaisse. Il éjecte dans l’aorte ascendante.", view: "q34", iso: ["right atrium", "left atrium", "right ventricle", "left ventricle", "ascending aorta", "pulmonary trunk", "superior vena cava"], sel: ["left ventricle"] },
          { t: "L’arc de l’aorte", x: "Il passe au-dessus de la bifurcation du tronc pulmonaire et de la bronche principale gauche, et donne le tronc brachiocéphalique, la carotide commune gauche et la subclavière gauche.", view: "q34", iso: ["ascending aorta", "arch of aorta", "descending thoracic aorta", "brachiocephalic trunk", "common carotid artery", "subclavian artery", "pulmonary trunk", "trachea", "main bronchus"], sel: ["arch of aorta"] },
        ],
      },
    ],
    coeur: [
      {
        id: "cav", n: "Cavités et valves",
        steps: [
          { t: "Les quatre cavités", x: "Deux atriums reçoivent le sang, deux ventricules l’éjectent. Le cœur droit envoie le sang vers les poumons, le cœur gauche vers tout l’organisme.", view: "front", all: 1 },
          { t: "Atrium droit", x: "Il reçoit les veines caves supérieure et inférieure et le sinus coronaire.", view: "q34", sel: ["right atrium"] },
          { t: "Valve tricuspide", x: "Entre atrium et ventricule droits ; ses cuspides sont tenues par les cordages et les muscles papillaires.", view: "front", sysOnly: ["valve", "muscle"], sel: ["tricuspid valve"] },
          { t: "Ventricule droit", x: "Il éjecte dans le tronc pulmonaire, à travers la valve pulmonaire.", view: "front", sel: ["right ventricle"] },
          { t: "Atrium gauche", x: "Le plus postérieur : il reçoit les quatre veines pulmonaires. Il répond à l’œsophage en arrière.", view: "back", sel: ["left atrium"] },
          { t: "Valve mitrale", x: "Deux cuspides, entre atrium et ventricule gauches ; elle se ferme au début de la systole (B1).", view: "front", sysOnly: ["valve", "muscle"], sel: ["mitral valve"] },
          { t: "Valve aortique", x: "Trois valvules semi-lunaires ; les artères coronaires naissent des sinus droit et gauche. Elle se ferme au début de la diastole (B2).", view: "front", sysOnly: ["valve"], sel: ["aortic valve"] },
        ],
      },
      {
        id: "cor", n: "Les artères coronaires",
        steps: [
          { t: "Vue d’ensemble", x: "Deux artères coronaires naissent de l’aorte ascendante, juste au-dessus de la valve aortique.", view: "front", all: 1 },
          { t: "Coronaire droite", x: "Elle chemine dans le sillon atrio-ventriculaire droit et donne la branche marginale droite.", view: "front", sel: ["right coronary artery"] },
          { t: "Coronaire gauche", x: "Un tronc court qui se divise en interventriculaire antérieure (IVA) et circonflexe.", view: "q34", sel: ["left coronary artery"] },
          { t: "IVA", x: "Elle descend dans le sillon interventriculaire antérieur et donne les branches septales.", view: "front", sel: ["anterior interventricular artery"] },
          { t: "Circonflexe", x: "Elle contourne le bord gauche dans le sillon atrio-ventriculaire gauche.", view: "back", sel: ["circumflex artery"] },
        ],
      },
    ],
    abdomen: [
      {
        id: "etages", n: "Les étages de l’abdomen",
        steps: [
          { t: "La paroi", x: "En avant, les deux muscles droits de part et d’autre de la ligne blanche ; sur les côtés, trois muscles larges superposés : oblique externe, oblique interne, transverse.", view: "front", all: 1 },
          { t: "La cavité ouverte", x: "Sous la paroi, le grand omentum recouvre les anses grêles comme un tablier, tendu depuis la grande courbure de l’estomac.", view: "front", layer: 3 },
          { t: "Étage sus-mésocolique", x: "Au-dessus du côlon transverse et de son méso : foie et voies biliaires, estomac, rate, premier duodénum.", view: "front", layer: 4, sel: ["liver", "stomach", "spleen"] },
          { t: "Étage sous-mésocolique", x: "Sous le mésocôlon transverse : jéjunum et iléon encadrés par le côlon (ascendant, transverse, descendant), puis le sigmoïde.", view: "front", layer: 4, sel: ["jejunum", "ascending colon", "descending colon"] },
          { t: "Le rétropéritoine", x: "Derrière le péritoine pariétal : reins et surrénales, pancréas, duodénum (D2-D4), aorte abdominale et veine cave inférieure, uretères.", view: "front", layer: 5, sel: ["kidney", "pancreas"] },
          { t: "La veine porte", x: "Formée derrière le col du pancréas par la veine splénique et la veine mésentérique supérieure, elle monte vers le hile du foie.", view: "front", layer: 4, sel: ["portal vein", "splenic vein", "mesenteric veins"] },
          { t: "Le tronc cœliaque", x: "Né de l’aorte à T12 : artère gastrique gauche, artère hépatique commune et artère splénique.", view: "front", layer: 5, sel: ["coeliac trunk", "left gastric artery", "common hepatic artery", "splenic artery"] },
        ],
      },
      {
        id: "seg", n: "Les segments du foie",
        steps: [
          { t: "Huit segments", x: "La segmentation de Couinaud découpe le foie en 8 segments, chacun avec son pédicule portal.", view: "front", iso: ["liver segments", "gallbladder", "portal vein", "hepatic veins", "ivc abdominal"], sel: ["liver segments"] },
          { t: "Foie gauche", x: "Segments II, III et IV, à gauche de la ligne qui va de la vésicule à la veine cave inférieure.", view: "front", iso: ["liver segments", "gallbladder", "ivc abdominal"], sel: ["Foie : segment II", "Foie : segment III", "Foie : segment IV"] },
          { t: "Foie droit", x: "Segments V, VI, VII et VIII.", view: "q34", iso: ["liver segments", "gallbladder", "ivc abdominal"], sel: ["Foie : segment V", "Foie : segment VI", "Foie : segment VII", "Foie : segment VIII"] },
          { t: "Le lobe caudé", x: "Le segment I, en arrière contre la veine cave inférieure, se draine directement dans la VCI.", view: "back", iso: ["liver segments", "ivc abdominal"], sel: ["Foie : segment I (lobe caudé)"] },
        ],
      },
    ],
    poumons: [
      {
        id: "lob", n: "Lobes et arbre bronchique",
        steps: [
          { t: "Deux poumons", x: "Le poumon droit a trois lobes (supérieur, moyen, inférieur), le gauche deux (supérieur avec la lingula, inférieur).", view: "front", all: 1 },
          { t: "Lobe moyen", x: "Limité par la scissure horizontale en haut et la scissure oblique en bas ; il n’existe qu’à droite.", view: "side", sel: ["rml"] },
          { t: "La trachée", x: "Elle se divise en deux bronches principales au niveau de T4-T5 (carène).", view: "front", sysOnly: ["organe"], iso: ["trachea", "main bronchus", "intermediate bronchus", "lobar bronchi", "segmental bronchi"], sel: ["trachea"] },
          { t: "Bronche principale droite", x: "Plus courte, plus large et plus verticale que la gauche : un corps étranger inhalé y va plus souvent.", view: "front", iso: ["trachea", "main bronchus", "intermediate bronchus", "lobar bronchi", "segmental bronchi"], sel: ["main bronchus"] },
          { t: "Bronches segmentaires", x: "Chaque bronche lobaire se divise en bronches segmentaires (10 à droite, 8 à 10 à gauche selon les descriptions) : chacune ventile un segment.", view: "front", iso: ["trachea", "main bronchus", "intermediate bronchus", "lobar bronchi", "segmental bronchi"], sel: ["segmental bronchi"] },
        ],
      },
    ],
  };
  ATL.custom = ATL.custom || null; // parcours créés par l'administrateur (tous les atlas)
  async function toursLoad(force) {
    if (ATL.custom && !force) return;
    try {
      const { data, error } = await SY.sb.storage.from("atlas").download("parcours.json");
      ATL.custom = !error && data ? JSON.parse(await data.text()) : [];
    } catch (e) {
      ATL.custom = [];
    }
    if (ATL.v === V && V.tool == "tour") toolPanel("tour", true);
  }
  async function toursPublish() {
    const blob = new Blob([JSON.stringify(ATL.custom)], { type: "model/gltf-binary" });
    const { error } = await SY.sb.storage.from("atlas").upload("parcours.json", blob, { upsert: true, contentType: "model/gltf-binary", cacheControl: "60" });
    toast(error ? esc(syTr(error.message)) : "Parcours publiés : tous les membres qui ont l’atlas les voient ✔");
  }
  const toursOf = () => [...(TOURS[model.id] || []), ...(ATL.custom || []).filter((t) => t.model == model.id)];
  function toursPaint(box) {
    const L = toursOf(),
      ed = V.tourEd;
    box.innerHTML =
      (L.length
        ? '<div class="atprel">' +
          L.map(
            (t, i) =>
              '<div class="attrow"><button data-t="' + i + '"><b>▶ ' + esc(t.n) + "</b><small>" + t.steps.length + " étapes" + (t.custom ? " · créé par l’administrateur" : "") + "</small></button>" +
              (t.custom && SY.role == "admin" ? '<button class="atvx" data-d="' + esc(t.id) + '" aria-label="Supprimer">✕</button>' : "") + "</div>",
          ).join("") +
          "</div>"
        : '<p class="atnote">Aucun parcours pour cet atlas.</p>') +
      (SY.role == "admin"
        ? ed
          ? '<div class="atted"><p class="atlbl2">Nouveau parcours : ' + esc(ed.n) + " (" + ed.steps.length + " étape" + (ed.steps.length > 1 ? "s" : "") + ")</p>" +
            '<input id="attet" maxlength="80" placeholder="Titre de l’étape"><textarea id="attex" rows="3" maxlength="600" placeholder="Explication affichée à cette étape"></textarea>' +
            '<div class="atpb"><button class="b p" id="attea">Ajouter l’étape (vue actuelle)</button><button class="b" id="attes"' + (ed.steps.length ? "" : " disabled") + '>Publier</button><button class="b" id="attec">Annuler</button></div>' +
            '<p class="atnote">Place le modèle comme tu veux (angle, structures, coupe, sélection), puis ajoute l’étape.</p></div>'
          : '<div class="atpb"><button class="b" id="atten">＋ Créer un parcours</button></div>'
        : "");
    box.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => tourStart(L[+b.dataset.t])));
    box.querySelectorAll("[data-d]").forEach(
      (b) =>
        (b.onclick = () =>
          ask("Supprimer ce parcours pour tous les membres ?", async () => {
            ATL.custom = (ATL.custom || []).filter((t) => t.id != b.dataset.d);
            await toursPublish();
            toursPaint(box);
          })),
    );
    if ($("atten"))
      $("atten").onclick = () => {
        const n = prompt("Titre du parcours");
        if (!n) return;
        V.tourEd = { n: n.slice(0, 80), steps: [] };
        toursPaint(box);
      };
    if ($("attea"))
      $("attea").onclick = () => {
        const t = $("attet").value.trim();
        if (!t) return toast("Donne un titre à l’étape.");
        ed.steps.push({ t, x: $("attex").value.trim(), snap: viewSnap(t) });
        toast("Étape " + ed.steps.length + " ajoutée");
        toursPaint(box);
      };
    if ($("attec")) $("attec").onclick = () => ((V.tourEd = null), toursPaint(box));
    if ($("attes"))
      $("attes").onclick = async () => {
        await toursLoad(true);
        ATL.custom = ATL.custom || [];
        ATL.custom.push({ id: "c" + Date.now().toString(36), model: model.id, n: ed.n, custom: 1, steps: ed.steps });
        V.tourEd = null;
        await toursPublish();
        toursPaint(box);
      };
  }
  function tourStart(t) {
    if (V.path) pathStop();
    if (V.hb.on) hbStop();
    if (V.breath.on) breathStop();
    V.tour = { t, i: 0, prev: { layer: V.layer, hOne: new Set(V.hOne), hSys: new Set(V.hSys), iso: V.iso } };
    if (V.tool) toolPanel(V.tool);
    tourStep(0);
  }
  function tourStep(i) {
    const Tr = V.tour,
      st = Tr.t.steps[i];
    Tr.i = i;
    if (st.snap) viewApply(st.snap);
    else {
      const byF = (keys) => V.parts.filter((p) => keys.includes(p.meta.fiche) || keys.includes(p.meta.fr));
      V.hSys.clear();
      sysBtns().forEach((b) => b.classList.remove("off"));
      V.iso = null;
      V.layer = st.layer || 0;
      V.hOne = new Set(V.parts.filter((p) => (p.zone && !st.med) || p.meta.fiche == "pleura"));
      if (st.med) {
        V.parts.filter((p) => /^(rul|rml|rll|lul|lll|pleura|right lung|left lung)$/.test(p.meta.fiche || "")).forEach((p) => V.hOne.add(p));
        V.layer = V.LN.length - 1;
      }
      if (st.sysOnly) V.parts.forEach((p) => !st.sysOnly.includes(p.meta.systeme) && V.hOne.add(p));
      const sel = st.sel ? byF(st.sel) : [];
      sel.forEach((p) => V.hOne.delete(p));
      // les structures hors sujet passent en retrait (transparentes) au lieu de disparaître d'un coup
      const keep = st.iso ? [...byF(st.iso), ...sel] : null;
      V.ghost = keep ? new Set(keep) : null;
      V.sels = new Set(sel);
      V.sel = sel[0] || null;
      fadeTo(750);
      panel();
      // téléphone : on laisse la place au texte du parcours (la fiche reste accessible en touchant la structure)
      if (matchMedia("(max-width: 760px), (orientation: landscape) and (max-height: 500px)").matches) {
        $("atpan").classList.remove("show");
        $("atl").classList.remove("pan-open");
      }
      // déplacement continu de la caméra vers l'angle et le cadrage de l'étape
      const dir = new T.Vector3(...VIEWS[st.view || "front"]),
        target = sel.length ? sel : keep || V.parts.filter((p) => visible(p));
      V.view = st.view || V.view;
      document.querySelectorAll("#atl .atv button").forEach((x) => x.classList.toggle("on", x.dataset.v === V.view));
      frameParts(target, sel.length ? (sel.length == 1 ? 2.4 : 1.5) : 1.05, dir, 1300);
    }
    const n = Tr.t.steps.length;
    bar(
      '<div class="attour"><small>' + esc(Tr.t.n) + " · " + (i + 1) + " / " + n + "</small><b>" + esc(st.t) + "</b>" + (st.x ? "<p>" + esc(st.x) + "</p>" : "") +
        '<div class="attdots">' + Tr.t.steps.map((_, k) => "<i" + (k == i ? ' class="on"' : "") + "></i>").join("") + "</div></div>" +
        '<div class="atanb"><button id="attpv"' + (i ? "" : " disabled") + '>‹ Précédent</button><button id="attnx" class="p">' + (i < n - 1 ? "Suivant ›" : "Terminer") +
        '</button><button id="attqx">Quitter</button></div>',
    ).classList.add("tour");
    $("attpv").onclick = () => tourStep(i - 1);
    $("attnx").onclick = () => (i < n - 1 ? tourStep(i + 1) : tourStop());
    $("attqx").onclick = () => tourStop();
  }
  function tourStop() {
    const Tr = V.tour;
    if (!Tr) return;
    V.tour = null;
    V.ghost = null;
    bar("");
    V.layer = Tr.prev.layer;
    V.hOne = Tr.prev.hOne;
    V.hSys = Tr.prev.hSys;
    V.iso = Tr.prev.iso;
    select(null);
    fadeTo(600);
    isoBar();
    dockState();
  }

  // ---------- examen 3D : 20 questions mélangées, chronométrées, sans correction avant la fin, note sur 20 ----------
  const EXN = 20,
    EXT = 20; // secondes par question
  function examStart() {
    if (V.breath.on) breathStop();
    if (V.hb.on) hbStop();
    if (V.path) pathStop();
    select(null);
    const pool = V.parts.filter((p) => p.mesh.visible && !p.zone).sort(() => Math.random() - 0.5),
      seen = new Set(),
      qs = [];
    for (const p of pool) {
      if (qs.length >= EXN) break;
      if (seen.has(p.meta.fr)) continue;
      seen.add(p.meta.fr);
      const r = Math.random(),
        fq = r < 0.34 ? ficheQ(p) : null;
      qs.push(fq ? { p, type: "fiche", q: fq } : { p, type: r < 0.67 ? "touche" : "nom" });
    }
    if (qs.length < 5) return toast("Affiche au moins 5 structures pour lancer un examen.");
    V.quiz = { mode: "examen", qs, list: qs.map((q) => q.p), i: 0, ok: 0, res: [], t0: Date.now() };
    setView(V.view);
    $("atlbl").hidden = true;
    if (V.tool) toolPanel(V.tool);
    dockState();
    examPaint();
  }
  function examPaint() {
    const Q = V.quiz,
      box = $("atquiz");
    clearInterval(Q.tm);
    if (Q.i >= Q.qs.length) return examEnd();
    const q = Q.qs[Q.i],
      head = '<div class="atqz"><small>Examen 3D · question ' + (Q.i + 1) + " / " + Q.qs.length + ' · <span id="atqt">' + EXT + " s</span></small>";
    V.parts.forEach((x) => x.mesh.material.emissive.setHex(0));
    box.hidden = false;
    if (q.type == "touche") {
      box.innerHTML = head + "<b>Touche : " + esc(q.p.meta.fr) + "</b></div>";
      if (Q.i && Q.qs[Q.i - 1].type != "touche") setView(V.view);
    }
    else {
      q.p.mesh.material.emissive.setHex(0x2f7fb3);
      orbitOn(q.p);
      if (q.type == "nom")
        box.innerHTML =
          head + "<b>Quelle est la structure en bleu ?</b></div>" +
          '<div class="ats atqin"><input id="atqa" type="text" autocomplete="off" placeholder="Écris son nom…" aria-label="Ta réponse"><div id="atqsug"></div></div>';
      else
        box.innerHTML =
          head + "<b>" + esc(q.q.titre) + " (en bleu) : " + esc(q.q.label.toLowerCase()) + " ?</b></div><div class=\"atqcs\">" +
          q.q.choices.map((c, i) => '<button class="atqc" data-i="' + i + '">' + esc(c) + "</button>").join("") + "</div>";
    }
    box.innerHTML += '<div class="atpb">' + (q.type == "nom" ? '<button class="b p" id="atqok">Valider</button>' : "") + '<button class="b" id="atqskip">Passer</button><button class="b" id="atqend">Abandonner</button></div>';
    $("atqskip").onclick = () => examAnswer(false, "passée");
    $("atqend").onclick = quizStop;
    if (q.type == "nom") {
      const inp = $("atqa"),
        sg = $("atqsug");
      let cur = [];
      inp.oninput = () => {
        cur = inp.value.trim().length > 1 ? search(inp.value).slice(0, 6) : [];
        sg.innerHTML = cur.map((x, i) => '<button data-i="' + i + '">' + esc(x.meta.fr) + "</button>").join("");
        sg.querySelectorAll("button").forEach((b) => (b.onmousedown = (e) => (e.preventDefault(), (inp.value = cur[+b.dataset.i].meta.fr), (sg.innerHTML = ""))));
      };
      const go = () => examAnswer(atNorm(inp.value).trim() === atNorm(q.p.meta.fr), inp.value.trim() || "—");
      inp.onkeydown = (e) => e.key == "Enter" && (e.preventDefault(), go());
      $("atqok").onclick = go;
      setTimeout(() => inp.focus(), 50);
    }
    if (q.type == "fiche") box.querySelectorAll(".atqc").forEach((b) => (b.onclick = () => examAnswer(q.q.choices[+b.dataset.i] === q.q.ans, q.q.choices[+b.dataset.i])));
    let left = EXT;
    Q.tm = setInterval(() => {
      if (V.quiz !== Q || ATL.v !== V) return clearInterval(Q.tm);
      left--;
      if ($("atqt")) $("atqt").textContent = left + " s";
      if (left <= 0) examAnswer(false, "temps écoulé");
    }, 1000);
  }
  function examTouch(p) {
    const Q = V.quiz,
      q = Q.qs[Q.i];
    if (q && q.type == "touche") examAnswer(p.meta.fr === q.p.meta.fr, p.meta.fr);
  }
  function examAnswer(good, said) {
    const Q = V.quiz;
    if (!Q || Q.i >= Q.qs.length) return;
    clearInterval(Q.tm);
    const q = Q.qs[Q.i];
    if (good) Q.ok++;
    qStat(q.p, good);
    Q.res.push({ q, good, said });
    Q.i++;
    examPaint();
  }
  function examEnd() {
    const Q = V.quiz,
      note = Math.round((Q.ok / Q.qs.length) * 200) / 10,
      box = $("atquiz");
    V.parts.forEach((x) => x.mesh.material.emissive.setHex(0));
    S.atq = S.atq || { hist: [] };
    S.atq.hist.push({ d: day(), t: Date.now(), m: model.id, n: Q.qs.length, ok: Q.ok, mode: "examen", note, dur: Math.round((Date.now() - Q.t0) / 1000) });
    save();
    const wrong = Q.res.filter((r) => !r.good);
    box.innerHTML =
      '<div class="atqz ' + (note >= 10 ? "ok" : "ko") + '"><small>Examen 3D terminé</small><b>' + String(note).replace(".", ",") + " / 20</b><small>" + Q.ok + " bonne" + (Q.ok > 1 ? "s" : "") + " réponse" + (Q.ok > 1 ? "s" : "") + " sur " + Q.qs.length + "</small></div>" +
      (wrong.length
        ? '<div class="atexr"><p class="atlbl2">À revoir (touche pour la voir)</p>' +
          wrong.map((r) => '<button data-i="' + V.parts.indexOf(r.q.p) + '"><b>' + esc(r.q.p.meta.fr) + "</b><small>" + (r.q.type == "fiche" ? esc(r.q.q.label) + " : " + esc(r.q.q.ans) : "Ta réponse : " + esc(r.said || "—")) + "</small></button>").join("") +
          "</div>"
        : "") +
      '<div class="atpb"><button class="b p" id="atqre">Nouvel examen</button><button class="b" id="atqend">Fermer</button></div>';
    box.querySelectorAll(".atexr button").forEach((b) => (b.onclick = () => focusPart(V.parts[+b.dataset.i])));
    $("atqre").onclick = examStart;
    $("atqend").onclick = quizStop;
    Q.done = true;
  }

  // ---------- mesure entre deux points ----------
  const measObjs = [];
  function measClear() {
    measObjs.forEach((o) => (o.removeFromParent(), o.geometry.dispose(), o.material.dispose()));
    measObjs.length = 0;
    V.meas.pts = [];
    $("atmeas").innerHTML = "";
    need();
  }
  function measAdd(pt) {
    if (V.meas.pts.length >= 2) measClear();
    V.meas.pts.push(pt.clone());
    const dot = new T.Mesh(new T.SphereGeometry(0.0025, 12, 8), new T.MeshBasicMaterial({ color: 0xffd33d, depthTest: false }));
    dot.position.copy(pt);
    dot.renderOrder = 999;
    dot.raycast = () => {};
    scene.add(dot);
    measObjs.push(dot);
    if (V.meas.pts.length == 2) {
      const g = new T.BufferGeometry().setFromPoints(V.meas.pts),
        l = new T.Line(g, new T.LineBasicMaterial({ color: 0xffd33d, depthTest: false }));
      l.renderOrder = 999;
      l.raycast = () => {};
      scene.add(l);
      measObjs.push(l);
      const d = V.meas.pts[0].distanceTo(V.meas.pts[1]) * 100;
      $("atmeas").innerHTML = '<span class="atml">' + String(d < 10 ? d.toFixed(1) : Math.round(d)).replace(".", ",") + " cm</span>";
    } else $("atmeas").innerHTML = "";
    need();
  }
  function measToggle() {
    V.meas.on = !V.meas.on;
    dockState();
    if (!V.meas.on) measClear();
    else toast("Touche deux points sur le modèle pour mesurer la distance.");
  }

  // ---------- toucher : sélection, double-toucher, quiz, mesure ----------
  const ray = new T.Raycaster(),
    ptr = new T.Vector2();
  function pickAt(x, y) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, V.cam);
    const hits = ray.intersectObjects(
      V.parts.filter((p) => p.mesh.visible && !(p.mesh.material.opacity < 0.15)).map((p) => p.mesh),
      false,
    );
    const ok = hits.filter((h) => !V.clip.axis || V.clip.plane.distanceToPoint(h.point) >= -1e-4);
    return ok.find((h) => !h.object.userData.part.zone && h.object.userData.part.meta.fiche != "pleura") || ok[0] || null;
  }
  let down = null,
    lastTap = { t: 0, p: null };
  canvas.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const hit = pickAt(e.clientX, e.clientY),
      p = hit ? hit.object.userData.part : null;
    if (V.meas.on) return hit && measAdd(hit.point);
    if (V.quiz && V.quiz.mode == "examen") return p && examTouch(p);
    if (V.quiz) return V.quiz.mode == "touche" && p && quizAnswer(p);
    const now = performance.now();
    if (p && lastTap.p === p && now - lastTap.t < 350) {
      lastTap = { t: 0, p: null };
      return focusPart(p);
    }
    lastTap = { t: now, p };
    const add = e.shiftKey || e.ctrlKey || e.metaKey;
    select(p, add);
    if (p && !V.path && !V.tour) frameParts(add || V.multi ? [...V.sels] : [p], 2.4, null, 650);
  });
  // survol sur ordinateur : nom sous la souris
  let hovT = 0;
  if (fine)
    canvas.addEventListener("pointermove", (e) => {
      const h = $("athov");
      if (e.buttons || V.quiz) return (h.hidden = true);
      if (performance.now() - hovT < 70) return;
      hovT = performance.now();
      const hit = pickAt(e.clientX, e.clientY);
      h.hidden = !hit;
      canvas.style.cursor = hit ? "pointer" : "";
      if (hit) {
        h.textContent = hit.object.userData.part.meta.fr;
        h.style.transform = "translate(" + (e.clientX + 14) + "px," + (e.clientY + 12) + "px)";
      }
    });
  canvas.addEventListener("pointerleave", () => ($("athov").hidden = true));

  // ---------- raccourcis clavier ----------
  const KEYS = [
    ["F", "Face"], ["D", "Dos"], ["P", "Profil"], ["3", "Vue 3/4"], ["V", "Perspective"], ["← → ↑ ↓", "Tourner"], ["+ −", "Zoomer"],
    ["R", "Réinitialiser la vue"], ["Retour arrière", "Vue précédente"], ["O", "Orthographique"], ["G", "Quadrillage"], ["E", "Étiquettes"],
    ["I", "Isoler la sélection"], ["H", "Masquer la sélection"], ["A", "Tout réafficher"], ["L", "Liste des structures"], ["/", "Rechercher"], ["Échap", "Désélectionner, puis fermer"],
  ];
  function helpToggle() {
    const b = $("athelpbox");
    b.hidden = !b.hidden;
    b.innerHTML =
      '<button class="atpx" aria-label="Fermer">✕</button><b>Raccourcis clavier</b><dl>' + KEYS.map((k) => "<dt>" + k[0] + "</dt><dd>" + k[1] + "</dd>").join("") +
      '</dl><p class="atnote">Maj + clic : sélection multiple · double-clic : tourner autour</p>';
    b.querySelector(".atpx").onclick = () => (b.hidden = true);
  }
  function rotate(dx, dy) {
    const off = V.cam.position.clone().sub(controls.target),
      r = off.length();
    let th = Math.atan2(off.x, off.z) + dx,
      ph = Math.min(Math.PI - 0.05, Math.max(0.05, Math.acos(Math.min(1, Math.max(-1, off.y / r))) + dy));
    off.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th));
    V.cam.position.copy(controls.target).add(off);
    V.cam.lookAt(controls.target);
    controls.update();
    need();
  }
  const HOLD = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"]);
  V.keys = new Set();
  V.kv = { x: 0, y: 0, z: 0 };
  V.onKeyUp = (e) => V.keys.delete(e.key);
  V.onBlur = () => V.keys.clear();
  // vitesse de rotation (rad/s) et de zoom, qui accélère et ralentit en douceur
  function keyMotion(dt) {
    const K = V.keys,
      tx = (K.has("ArrowRight") ? 1 : 0) - (K.has("ArrowLeft") ? 1 : 0),
      ty = (K.has("ArrowDown") ? 1 : 0) - (K.has("ArrowUp") ? 1 : 0),
      tz = (K.has("+") || K.has("=") ? 1 : 0) - (K.has("-") ? 1 : 0),
      a = (t, v) => Math.min(1, dt * (t ? 9 : 5)),
      kv = V.kv;
    kv.x += (tx * 2.0 - kv.x) * a(tx, kv.x);
    kv.y += (ty * 1.6 - kv.y) * a(ty, kv.y);
    kv.z += (tz * 1.5 - kv.z) * a(tz, kv.z);
    let moved = false;
    if (Math.abs(kv.x) + Math.abs(kv.y) > 1e-3) {
      rotate(kv.x * dt, kv.y * dt);
      moved = true;
    } else kv.x = kv.y = 0;
    if (Math.abs(kv.z) > 1e-3) {
      zoomBy(Math.exp(kv.z * dt), true);
      moved = true;
    } else kv.z = 0;
    return moved;
  }
  V.onKey = (e) => {
    const ae = document.activeElement || {},
      typing = /INPUT|TEXTAREA|SELECT/.test(ae.tagName || "") && ae.type != "range" && ae.type != "checkbox";
    if (e.key == "Escape") {
      if (typing) return;
      if (V.pres) return presToggle(false);
      if (V.tour) return tourStop();
      if (V.path) return pathStop();
      if (!$("athelpbox").hidden) return ($("athelpbox").hidden = true);
      if (!$("atmlist").hidden) return ($("atmlist").hidden = true);
      if (V.meas.on) return measToggle();
      if (V.tool) return toolPanel(V.tool);
      if (!$("atquiz").hidden && !V.quiz) return ($("atquiz").hidden = true);
      if (V.sel) return select(null);
      return atlasExit();
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    // flèches et +/− : mouvement continu et amorti tant que la touche est enfoncée (voir la boucle d'animation)
    if (HOLD.has(e.key)) {
      e.preventDefault();
      if (!e.repeat) {
        if (!V.keys.size) histPush();
        V.anim = null;
        V.keys.add(e.key);
        need();
      }
      return;
    }
    const k = e.key.length == 1 ? e.key.toLowerCase() : e.key,
      act = {
        f: () => setView("front"), d: () => setView("back"), p: () => setView("side"), 3: () => setView("q34"), v: () => setView("persp"),
        r: () => $("atreset").click(), Backspace: () => $("atback").click(),
        o: () => (setOrtho(!V.ortho), prefSave(), V.tool == "disp" && toolPanel("disp", true)),
        g: () => $("atgrid").click(), e: labToggle, i: () => V.sels.size && isolate(V.sels), h: () => $("athide") && $("athide").click(),
        a: showAll, l: () => toolPanel("struct"), "?": helpToggle, "/": () => $("atq").focus(),
      }[k];
    if (act) {
      e.preventDefault();
      act();
    }
  };

  // ---------- réalité augmentée (iPhone : AR Quick Look) ----------
  async function arOpen() {
    {
      toast("Préparation de la réalité augmentée…", 1);
      try {
        const grp = new T.Group();
        for (const p of V.parts)
          if (p.mesh.visible) {
            const m = new T.Mesh(p.mesh.geometry, new T.MeshStandardMaterial({ color: p.mesh.material.color, roughness: 0.6, metalness: 0 }));
            p.mesh.updateWorldMatrix(true, false);
            m.applyMatrix4(p.mesh.matrixWorld);
            grp.add(m);
          }
        grp.position.y += V.ext.y; // posé sur la table
        const data = await new L.USDZExporter().parseAsync(grp),
          url = URL.createObjectURL(new Blob([data], { type: "model/vnd.usdz+zip" })),
          a = document.createElement("a");
        a.rel = "ar";
        a.href = url;
        a.download = model.id + ".usdz";
        a.appendChild(document.createElement("img"));
        document.body.appendChild(a);
        a.click();
        setTimeout(() => (a.remove(), URL.revokeObjectURL(url)), 60000);
        grp.children.forEach((m) => m.material.dispose());
      } catch (err) {
        toast("Réalité augmentée impossible : " + esc(err.message || err));
      }
    }
  }

  // ---------- étiquettes, échelle, cube d'orientation (mis à jour à chaque image) ----------
  const lray = new T.Raycaster(),
    wp = new T.Vector3(),
    sp = new T.Vector3();
  const proj = (v, w, h) => (sp.copy(v).project(V.cam), sp.z <= 1 ? [Math.round(((sp.x + 1) / 2) * w), Math.round(((1 - sp.y) / 2) * h)] : null);
  function overlays() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    w0 = w;
    h0 = h;
    if (V.showLbl && !V.quiz) {
      const shown = [];
      for (const Lb of V.labels) {
        let xy = null;
        if (Lb.p.mesh.visible) {
          Lb.p.mesh.localToWorld(wp.copy(Lb.local));
          if (!V.clip.axis || V.clip.plane.distanceToPoint(wp) >= 0) xy = proj(wp, w, h);
        }
        Lb.xy = xy;
        const show = !!xy;
        if (show !== Lb.shown) {
          Lb.el.style.display = show ? "" : "none";
          Lb.shown = show;
        }
        if (xy) {
          Lb.el.style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)";
          shown.push(Lb);
        }
      }
      // étiquettes qui se chevauchent : on décale le texte (avec un trait vers la structure), sinon on le masque
      if (!V.moving || !V.lblDone) labelLayout(shown);
    }
    if (V.grid && V.gdist) {
      const Cg = V.gdist.C,
        cp = V.cam.position,
        side = (cp.x > Cg.x ? -1 : 1) + "," + (cp.y > Cg.y ? -1 : 1) + "," + (cp.z > Cg.z ? -1 : 1);
      if (side !== V.gside) {
        V.gside = side;
        gridFollow();
      }
    }
    if (V.grid && V.gdist) {
      const G = V.gdist,
        els = $("atgl").children;
      gdirs.forEach((d, i) => {
        const xy = proj(new T.Vector3(G.C.x + d[1][0] * (G.X + 0.03), G.C.y + d[1][1] * (G.Y + 0.03), G.C.z + d[1][2] * (G.Z + 0.03)), w, h),
          el = els[i];
        if (!el) return;
        el.style.display = xy ? "" : "none";
        if (xy) el.style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)";
      });
    }
    if (V.meas.pts.length == 2 && $("atmeas").firstChild) {
      const xy = proj(V.meas.pts[0].clone().add(V.meas.pts[1]).multiplyScalar(0.5), w, h);
      if (xy) $("atmeas").firstChild.style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)";
    }
    // échelle : exacte à la profondeur du point visé
    const d = V.cam.position.distanceTo(controls.target),
      ppm = V.ortho ? h / ((camO.top - camO.bottom) / camO.zoom) : h / (2 * d * Math.tan(T.MathUtils.degToRad(camP.fov / 2))),
      Lm = [0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2].find((s) => s * ppm >= 50) || 0.2;
    $("atscale").firstChild.style.width = Math.round(Lm * ppm) + "px";
    $("atscale").lastChild.textContent = Lm < 0.01 ? Math.round(Lm * 1000) + " mm" : Math.round(Lm * 100) + " cm";
    gizmo();
  }
  // ---------- boussole anatomique : 6 directions qui suivent la caméra, touchables ----------
  const GZ = [
    ["G", "Gauche", [1, 0, 0], "#ff6b7a", "left"], ["D", "Droite", [-1, 0, 0], "#ff6b7a", "right"],
    ["Cr", "Crânial", [0, 1, 0], "#7be495", "top"], ["Ca", "Caudal", [0, -1, 0], "#7be495", "bottom"],
    ["A", "Antérieur", [0, 0, 1], "#6cb8ff", "front"], ["P", "Postérieur", [0, 0, -1], "#6cb8ff", "back"],
  ];
  const giz = $("atgiz"),
    SVGNS = "http://www.w3.org/2000/svg",
    gq = new T.Quaternion(),
    gv = new T.Vector3();
  giz.innerHTML = '<circle class="atgzbg" r="47"/>';
  const gzEls = GZ.map((g, i) => {
    const line = document.createElementNS(SVGNS, "line"),
      grp = document.createElementNS(SVGNS, "g");
    line.setAttribute("stroke", g[3]);
    line.setAttribute("class", "atgzl" + (i % 2 ? " neg" : ""));
    grp.setAttribute("class", "atgzp" + (i % 2 ? " neg" : ""));
    grp.setAttribute("role", "button");
    grp.setAttribute("tabindex", "0");
    grp.setAttribute("aria-label", "Vue " + g[1].toLowerCase());
    grp.innerHTML = "<title>" + g[1] + '</title><circle r="11" fill="' + g[3] + '"/><text dy="0.35em">' + g[0] + "</text>";
    grp.onclick = () => setView(g[4]);
    grp.onkeydown = (e) => (e.key == "Enter" || e.key == " ") && (e.preventDefault(), setView(g[4]));
    giz.append(line, grp);
    return { line, grp };
  });
  function gizmo() {
    gq.copy(V.cam.quaternion).invert();
    const order = GZ.map((g, i) => {
      gv.set(...g[2]).applyQuaternion(gq);
      return { i, x: gv.x * 32, y: -gv.y * 32, z: gv.z };
    }).sort((a, b) => a.z - b.z);
    for (const o of order) {
      const E = gzEls[o.i];
      E.line.setAttribute("x2", o.x.toFixed(1));
      E.line.setAttribute("y2", o.y.toFixed(1));
      E.grp.setAttribute("transform", "translate(" + o.x.toFixed(1) + " " + o.y.toFixed(1) + ")");
      E.grp.style.opacity = (0.55 + 0.45 * (o.z + 1) / 2).toFixed(2);
      giz.appendChild(E.line);
      giz.appendChild(E.grp);
    }
  }
  function labelLayout(list) {
    V.lblDone = true;
    const H = 16,
      boxes = list.map((Lb) => [Lb.xy[0] - 6, Lb.xy[1] - 6, 12, 12, Lb]),
      over = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3],
      pri = (Lb) => (V.sels.has(Lb.p) ? 0 : Lb.pin ? 1 : Lb.el.classList.contains("occ") ? 3 : 2);
    list.sort((a, b) => pri(a) - pri(b));
    for (const Lb of list) {
      const sp = Lb.sp || (Lb.sp = Lb.el.querySelector("span")),
        ln = Lb.ln || (Lb.ln = Lb.el.querySelector("em")),
        W = Lb.w || (Lb.w = (sp.offsetWidth || 60) + 2),
        [x, y] = Lb.xy,
        C = [[9, -8], [9, -27], [9, 11], [-W - 9, -8], [-W - 9, -27], [-W - 9, 11], [9, -46], [9, 30], [-W / 2, -30], [-W / 2, 14]];
      let pick = null;
      for (const c of C) {
        const b = [x + c[0], y + c[1], W, H];
        if (b[0] < 0 || b[1] < 0 || b[0] + W > w0 || b[1] + H > h0) continue;
        if (!boxes.some((o) => o[4] !== Lb && over(b, o))) {
          pick = c;
          boxes.push([...b, null]);
          break;
        }
      }
      Lb.el.classList.toggle("crowd", !pick);
      if (!pick) continue;
      sp.style.transform = "translate(" + pick[0] + "px," + pick[1] + "px)";
      if (pick === C[0] || pick === C[3]) ln.style.display = "none";
      else {
        const tx = pick[0] < 0 ? pick[0] + W : pick[0],
          ty = pick[1] + H / 2,
          L = Math.hypot(tx, ty);
        ln.style.display = "block";
        ln.style.width = L + "px";
        ln.style.transform = "rotate(" + Math.atan2(ty, tx) + "rad)";
      }
    }
  }
  let w0 = 1,
    h0 = 1;
  function occlusion() {
    if (ATL.v !== V || !V.showLbl || !V.labels.length || V.breath.on) return;
    const visM = V.parts.filter((x) => x.mesh.visible && x.mesh.material.opacity > 0.5).map((x) => x.mesh);
    for (const Lb of V.labels) {
      if (!Lb.p.mesh.visible) continue;
      Lb.p.mesh.localToWorld(wp.copy(Lb.local));
      const d = V.cam.position.distanceTo(wp);
      lray.set(V.cam.position, wp.clone().sub(V.cam.position).normalize());
      lray.far = d;
      const hit = lray.intersectObjects(visM, false).find((h) => !V.clip.axis || V.clip.plane.distanceToPoint(h.point) >= 0);
      Lb.el.classList.toggle("occ", !!(hit && hit.object !== Lb.p.mesh && hit.distance < d - 0.01));
    }
    V.lblDone = false;
    V.dirty = true; // pas need() : il relancerait ce calcul en boucle
  }

  // taille du dessin = taille réelle du canevas (suit aussi la fenêtre d'outils et la rotation du téléphone)
  function resize() {
    const w = canvas.clientWidth || 1,
      h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camP.aspect = w / h;
    camO.left = -w / h;
    camO.right = w / h;
    camO.top = 1;
    camO.bottom = -1;
    for (const c of [camP, camO]) c.updateProjectionMatrix();
    if (composer) fxBuild();
    need();
  }
  V.resize = resize;
  addEventListener("resize", resize);
  if (window.ResizeObserver) {
    V.ro = new ResizeObserver(() => resize());
    V.ro.observe(canvas);
  }
  resize();
  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    // une erreur dans une animation ne doit jamais figer le modèle : on arrête l'animation fautive et on continue
    try {
      frame(now);
    } catch (e) {
      console.error(e);
      V.anim = null;
      FADE = null;
      if (V.path) pathStop();
      if (V.hb.on) hbStop();
      if (V.breath.on) breathStop();
      V.dirty = true;
    }
  });
  function frame(now) {
    const raw = Math.max(0, now - last),
      dt = Math.min(0.05, raw / 1000);
    last = now;
    if ((V.keys.size || V.kv.x || V.kv.y || V.kv.z) && keyMotion(dt)) {
      V.moving = true;
      clearTimeout(V.movT);
      V.movT = setTimeout(() => {
        V.moving = false;
        need();
      }, 150);
    }
    if (V.anim) {
      V.anim(now);
      V.dirty = true;
    }
    if (FADE) fadeTick(now);
    if (V.hb.on) hbTick(now);
    if (V.path) pathTick(now);
    if (V.breath.on) {
      V.breath.s = (1 - Math.cos(((now - V.breath.t0) / 4500) * Math.PI * 2)) / 2;
      pose();
    }
    if (controls.update() && V.pres) V.dirty = true;
    if (!V.dirty) return;
    V.dirty = false;
    const tf = performance.now();
    draw();
    perfTick(tf, Math.min(0.25, raw / 1000));
    overlays();
  }
}

// ---------- fermeture : on libère la mémoire graphique ----------
function atlasClose() {
  const V = ATL.v;
  ATL.v = null;
  if (V) {
    V.alive = false;
    clearTimeout(V.idleT);
    if (V.resize) removeEventListener("resize", V.resize);
    if (V.ro) V.ro.disconnect();
    if (V.renderer) {
      V.renderer.setAnimationLoop(null);
      (V.parts || []).forEach((p) => {
        if (p.mesh.geometry.disposeBoundsTree) p.mesh.geometry.disposeBoundsTree();
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      });
      V.controls.dispose();
      V.renderer.dispose();
    }
  }
  if (ATL.key) removeEventListener("keydown", ATL.key);
  if (ATL.keyup) removeEventListener("keyup", ATL.keyup);
  if (ATL.blur) removeEventListener("blur", ATL.blur);
  document.documentElement.classList.remove("atlon");
  const d = $("atl");
  if (d) d.remove();
}

// ---------- résultats du quiz 3D dans Profil → Progrès ----------
function atlasStats() {
  const h = (S.atq && S.atq.hist) || [];
  if (!h.length) return "";
  const n = h.reduce((t, x) => t + x.n, 0),
    ok = h.reduce((t, x) => t + x.ok, 0),
    best = Math.max(...h.map((x) => Math.round((x.ok / x.n) * 100))),
    last = h[h.length - 1];
  return (
    '<h3>Atlas 3D : quiz</h3><div class="g">' +
    [
      [h.length, "quiz faits"],
      [Math.round((ok / n) * 100) + " %", "de bonnes réponses"],
      [best + " %", "meilleur score"],
      [last.ok + " / " + last.n, "dernier quiz"],
      ...(() => {
        const ex = h.filter((x) => x.mode == "examen");
        if (!ex.length) return [];
        const notes = ex.map((x) => x.note ?? Math.round((x.ok / x.n) * 200) / 10);
        return [
          [String(notes[notes.length - 1]).replace(".", ",") + " / 20", "dernier examen 3D"],
          [String(Math.max(...notes)).replace(".", ",") + " / 20", "meilleur examen 3D"],
        ];
      })(),
    ]
      .map((t) => '<div class="k"><b>' + t[0] + "</b><small>" + t[1] + "</small></div>")
      .join("") +
    "</div>"
  );
}

// ---------- l'administrateur remplace le fichier partagé ----------
async function atlasUpload(id, f, variant, quiet) {
  if (!f) return false;
  if (!/\.glb$/i.test(f.name)) return toast("Choisis un fichier .glb"), false;
  if (f.size > 20 * 1048576) return toast("Fichier trop lourd (20 Mo au plus)"), false;
  // sans variante imposée, le nom du fichier décide du modèle (thorax, coeur, poumons…) ; « hd » = version pour ordinateur
  const base = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    target = variant != null ? id : (ATL.models.find((m) => base.startsWith(m.id)) || {}).id,
    hd = variant != null ? variant == "-hd" : /hd/i.test(base);
  if (!target) return toast("« " + esc(f.name) + " » : nom inconnu (commence par thorax, coeur ou poumons)"), false;
  const name = target + (hd ? "-hd" : "") + ".glb",
    titre = (ATL.models.find((m) => m.id == target) || {}).titre || target;
  if (!quiet) toast("Envoi de « " + esc(titre) + " » (" + (hd ? "ordinateur" : "téléphone") + ")…", 1);
  const { error } = await SY.sb.storage
    .from("atlas")
    // le type est forcé : Windows et iOS ne reconnaissent pas les .glb (sinon refus « mime type not supported »)
    .upload(name, new Blob([f], { type: "model/gltf-binary" }), { upsert: true, contentType: "model/gltf-binary", cacheControl: "60" });
  if (error) return toast(esc(syTr(error.message))), false;
  if (!quiet) toast("« " + esc(titre) + " » (" + (hd ? "ordinateur" : "téléphone") + ") mis à jour ✔");
  atlasFilesLoad();
  return true;
}
async function atlasUploadMany(files) {
  const fs = [...(files || [])];
  if (!fs.length) return;
  let ok = 0;
  for (let i = 0; i < fs.length; i++) {
    toast("Envoi " + (i + 1) + " / " + fs.length + " : " + esc(fs[i].name) + "…", 1);
    if (await atlasUpload(null, fs[i], null, true)) ok++;
  }
  toast(ok + " fichier" + (ok > 1 ? "s" : "") + " envoyé" + (ok > 1 ? "s" : "") + (ok < fs.length ? " · " + (fs.length - ok) + " refusé" + (fs.length - ok > 1 ? "s" : "") : "") + " ✔");
}

// ---------- flashcards à partir d'une fiche ----------
// Une carte par rubrique utile (insertions, innervation, action…) + « À retenir », sans doublon dans le chapitre choisi.
const ATL_CARD_ROWS = ["Origine", "Terminaison", "Innervation", "Vascularisation", "Action", "Articulations", "Repères", "Orifices", "Rapports", "Atypiques"];
function atlasCardsOf(f) {
  const out = f.rows
    .filter((r) => ATL_CARD_ROWS.includes(r[0]))
    .map((r) => ({ recto: f.titre + " : " + r[0].toLowerCase() + " ?", verso: r[1] }));
  if (f.note) out.push({ recto: f.titre + " : à retenir ?", verso: f.note });
  return out;
}
function atlasCardsForm(f) {
  atlasChapterForm(atlasCardsOf(f), "flashcard");
}
// Choix du chapitre puis ajout des cartes (sans doublon pour les cartes de fiche ; les images sont toujours ajoutées)
function atlasChapterForm(cards, kind) {
  const box = $("atfcs");
  if (!box || !cards.length) return;
  let last = "";
  try {
    last = localStorage.getItem("mr_atlas_ch") || "";
  } catch (e) {}
  const opts = S.mat
    .map((m) => {
      const cc = S.chap.filter((c) => c.mid === m.id);
      return cc.length
        ? '<optgroup label="' + esc(m.nom) + '">' + cc.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.titre) + "</option>").join("") + "</optgroup>"
        : "";
    })
    .join("");
  const n = cards.length,
    what = kind == "flashcard-image" ? (n > 1 ? n + " flashcards avec image" : "1 flashcard avec image") : n + " flashcard" + (n > 1 ? "s" : "");
  box.innerHTML =
    '<div class="atfcf">' +
    (cards[0].img ? '<img class="atsnapimg" src="' + cards[0].img + '" alt="Aperçu de l’image">' : "") +
    '<label for="atch">Ajouter ' + what + ' dans le chapitre :</label><select id="atch">' +
    '<option value="__new">➕ Nouveau chapitre « Atlas 3D » (UE Atlas 3D)</option>' +
    opts +
    '</select><div class="atpb"><button class="b p" id="atfcok">Ajouter</button><button class="b" id="atfcno">Annuler</button></div></div>';
  if (last && S.chap.some((c) => c.id === last)) $("atch").value = last;
  $("atfcno").onclick = () => (box.innerHTML = "");
  $("atfcok").onclick = () => {
    let ch = $("atch").value;
    if (ch === "__new") {
      let m = S.mat.find((x) => x.nom === "Atlas 3D");
      if (!m) S.mat.push((m = { id: uid(), ic: "bone", nom: "Atlas 3D", prof: "", couleur: "#2f5d62" }));
      let c = S.chap.find((x) => x.mid === m.id && x.titre === "Atlas 3D");
      if (!c) S.chap.push((c = { id: uid(), mid: m.id, titre: "Atlas 3D", prof: "", info: "Cartes créées depuis l’atlas 3D" }));
      ch = c.id;
    }
    const have = new Set(S.cards.filter((c) => c.ch === ch).map((c) => c.recto)),
      add = cards.filter((c) => c.img || !have.has(c.recto));
    add.forEach((c) => S.cards.push({ id: uid(), ch, recto: c.recto, verso: c.verso, img: c.img || "" }));
    try {
      localStorage.setItem("mr_atlas_ch", ch);
    } catch (e) {}
    save();
    box.innerHTML = "";
    toast(add.length ? add.length + " flashcard" + (add.length > 1 ? "s" : "") + " ajoutée" + (add.length > 1 ? "s" : "") + " ✔" : "Ces flashcards sont déjà dans ce chapitre");
  };
}

// ---------- « Voir en 3D » : liens vers l'atlas dans les livrets et les corrections de QCM ----------
// La liste des noms est gardée sur l'appareil à chaque ouverture d'un modèle (rien n'est envoyé ailleurs).
const ATL_PRIO = ["coeur", "poumons", "thorax"];
function atlasIndexSave(id, parts, fiches) {
  const terms = {},
    addT = (t, fr) => {
      t = String(t || "").toLowerCase().replace(/\s+/g, " ").trim();
      if (t.length >= 4 && !terms[t]) terms[t] = fr;
    };
  for (const p of parts) {
    if (p.zone) continue;
    const fr = p.meta.fr,
      f = fiches[p.meta.fiche] || {};
    [fr, f.titre].forEach((n) => {
      if (!n) return;
      const base = n.replace(/\s*\(.*?\)\s*/g, " ").trim();
      addT(n, fr);
      addT(base, fr);
      addT(base.replace(/^(muscles?|nerfs?|artères?|veines?) /i, ""), fr);
      addT(base.replace(/ (droite?|gauche)s?\b/i, ""), fr);
      addT(base.replace(/^(muscles?|nerfs?) /i, "").replace(/ (droite?|gauche)s?\b/i, ""), fr);
      (n.match(/\(([A-ZÉ]{2,6})\)/g) || []).forEach((a) => addT(a.slice(1, -1), fr));
    });
  }
  try {
    const all = JSON.parse(localStorage.getItem("mr_atlas_idx") || "{}");
    all[id] = terms;
    localStorage.setItem("mr_atlas_idx", JSON.stringify(all));
  } catch (e) {}
  ATL.idx = null;
}
function atlasIdx() {
  if (ATL.idx !== undefined && ATL.idx !== null) return ATL.idx;
  let all = {};
  try {
    all = JSON.parse(localStorage.getItem("mr_atlas_idx") || "{}");
  } catch (e) {}
  const map = {};
  ATL_PRIO.slice()
    .reverse()
    .forEach((m) => Object.entries(all[m] || {}).forEach(([t, fr]) => (map[t] = { m, fr })));
  const terms = Object.keys(map).sort((a, b) => b.length - a.length);
  ATL.idx = terms.length
    ? { map, re: new RegExp("(?<![\\p{L}\\p{N}])(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?![\\p{L}\\p{N}])", "giu") }
    : false;
  return ATL.idx;
}
// Rend cliquables les noms de structures dans un élément (texte seulement, jamais dans les boutons ou les liens)
function atlasLinkify(root) {
  if (!root || !atlasOk()) return [];
  const I = atlasIdx();
  if (!I) return [];
  const found = new Map(),
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest("button,a,h1,.meta,.toc,input,textarea,.at3d,script,style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    }),
    nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  for (const t of nodes) {
    const txt = t.nodeValue;
    I.re.lastIndex = 0;
    if (!I.re.test(txt)) continue;
    I.re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0,
      m;
    while ((m = I.re.exec(txt))) {
      const hit = I.map[m[1].toLowerCase().replace(/\s+/g, " ")];
      if (!hit) continue;
      frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
      const b = document.createElement("button");
      b.className = "at3d";
      b.textContent = m[1];
      b.title = "Voir en 3D : " + hit.fr;
      b.onclick = () => atlasGo(hit.m, hit.fr);
      frag.appendChild(b);
      found.set(hit.fr, hit);
      last = m.index + m[1].length;
    }
    frag.appendChild(document.createTextNode(txt.slice(last)));
    t.parentNode.replaceChild(frag, t);
  }
  return [...found.values()];
}
// Livret ouvert : liens dans le texte + bandeau « Voir en 3D » avec les structures citées
function atlasCourseLinks() {
  const art = document.querySelector("#app .art");
  if (!art || art.dataset.at3d) return;
  art.dataset.at3d = 1;
  const found = atlasLinkify(art);
  if (!found.length) return;
  const bar = document.createElement("div");
  bar.className = "at3dbar";
  bar.innerHTML = "<b>" + icn("bone") + " Voir en 3D</b>";
  found.slice(0, 12).forEach((h) => {
    const b = document.createElement("button");
    b.className = "b";
    b.textContent = h.fr;
    b.onclick = () => atlasGo(h.m, h.fr);
    bar.appendChild(b);
  });
  const h1 = art.querySelector("h1");
  (h1 && h1.nextElementSibling ? h1.nextElementSibling : art.firstChild).after(bar);
}
