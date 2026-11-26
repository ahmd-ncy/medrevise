// ================= Atlas 3D =================
// Modèles anatomiques en 3D (BodyParts3D), ouverts depuis la page Cours.
// Un seul fichier .glb par modèle, dans l'espace privé « atlas » de Supabase, partagé par tous :
// la base ne le donne qu'à l'administrateur et aux membres à qui il a ouvert l'accès (voir supabase.sql).
// Une copie est gardée sur l'appareil (cache « mr-atlas ») pour l'ouvrir hors connexion ; elle est effacée si l'accès est retiré.
const ATL = {
  // modèles : « detail » relie les fiches d'un modèle à un modèle plus détaillé (bouton « Voir en détail »)
  models: [
    { id: "thorax", titre: "Thorax", sous: "Os, muscles, organes, vaisseaux, nerfs et médiastin" },
    { id: "coeur", titre: "Cœur", sous: "Cavités, valves, piliers, coronaires et veines du cœur" },
    { id: "poumons", titre: "Poumons et arbre bronchique", sous: "Lobes, bronches jusqu’aux segments, plèvre et vaisseaux" },
  ],
  detail: {
    coeur: ["right atrium", "left atrium", "right ventricle", "left ventricle"],
    poumons: ["rul", "rml", "rll", "lul", "lll", "right lung", "left lung", "main bronchus", "trachea", "pleura"],
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

// ---------- carte dans la page Cours ----------
function atlasCard() {
  if (!atlasOk()) return "";
  return ATL.models
    .map(
      (m) =>
        '<button class="rs atc" style="--sc:#2f5d62" onclick="atlasOpen(\'' +
        m.id +
        '\')">' +
        icn("bone") +
        "<span style=\"flex:1\"><small>Atlas 3D" +
        (SY.role == "admin" ? " · accès choisi par toi" : "") +
        "</small><br><b>" +
        esc(m.titre) +
        "</b><br><small>" +
        esc(m.sous) +
        "</small></span>" +
        icn("chev") +
        "</button>",
    )
    .join("");
}

// ---------- accès retiré : on efface la copie locale ----------
function atlasForget() {
  try {
    if (window.caches) caches.delete(ATL.cache);
  } catch (e) {}
}

// ---------- fichier du modèle : copie locale à jour, sinon téléchargement ----------
// Deux niveaux de détail : « <id>-hd.glb » (plus fin) pour les ordinateurs s'il existe, sinon « <id>.glb ».
const atlasWantHD = () => matchMedia("(pointer: fine)").matches && Math.min(screen.width, screen.height) >= 700;
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
        hd = atlasWantHD() && fs.find((x) => x.name === id + "-hd.glb"),
        f = hd || fs.find((x) => x.name === id + ".glb");
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

// ---------- ouverture ----------
async function atlasOpen(id, focusName) {
  if (ATL.v) atlasClose();
  const m = ATL.models.find((x) => x.id === id) || ATL.models[0],
    d = document.createElement("div");
  d.id = "atl";
  d.setAttribute("role", "dialog");
  d.setAttribute("aria-modal", "true");
  d.setAttribute("aria-label", "Atlas 3D : " + m.titre);
  const tool = (id, t, on, title) => '<button id="' + id + '"' + (on ? ' class="on"' : "") + (title ? ' title="' + title + '"' : "") + ">" + t + "</button>",
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
    '<div class="atb atop"><button class="atx" onclick="atlasClose()" aria-label="Fermer">✕</button>' +
    '<div class="ats"><input id="atq" type="search" placeholder="Rechercher dans le ' +
    esc(m.titre.toLowerCase()) +
    '…" autocomplete="off" aria-label="Rechercher une structure"><div id="atsug" role="listbox"></div></div>' +
    '<div class="atv">' +
    ATL.views.map((v, i) => '<button data-v="' + v[0] + '"' + (i ? "" : ' class="on"') + ">" + v[1] + "</button>").join("") +
    "</div></div>" +
    '<div id="atcorner"><div id="atcube" title="Orientation : clique une face"><div class="atcb">' +
    [["front", "Ant."], ["back", "Post."], ["left", "G"], ["right", "D"], ["top", "Crân."], ["bottom", "Caud."]]
      .map((f) => '<div class="atcf atcf-' + f[0] + '" data-v="' + f[0] + '">' + f[1] + "</div>")
      .join("") +
    '</div></div><div class="atzm">' +
    '<button id="atzi" title="Zoomer (+)">+</button><button id="atzo" title="Dézoomer (−)">−</button>' +
    '<button id="atback" title="Vue précédente (Retour arrière)">↶</button><button id="atreset" title="Réinitialiser la vue (R)">⟲</button>' +
    '<button id="atgrid" title="Quadrillage 3D (G)">▦</button><button id="athelp" title="Raccourcis clavier">?</button></div>' +
    '<div id="atscale"><i></i><span></span></div></div>' +
    '<div id="athelpbox" class="atb" hidden></div>' +
    '<div id="atquiz" class="atb" hidden></div>' +
    '<aside id="attree" aria-label="Structures"></aside>' +
    '<aside id="atpan" aria-live="polite"></aside>' +
    '<div class="atb abot"><div id="attool" hidden></div>' +
    '<div class="atr"><label for="atex">Écarter</label><input id="atex" type="range" min="0" max="100" value="0"><span id="atp">0 %</span>' +
    '<div class="atseg" role="group" aria-label="Disposition"><button data-m="eclate" class="on">Éclaté</button><button data-m="cote">Côte à côte</button></div>' +
    '<button id="atexo" class="atic" title="Options de l’écartement">⚙</button></div>' +
    '<div class="atrow atsys">' +
    Object.keys(ATL.sysFr)
      .map((s) => '<button data-s="' + s + '" hidden><i style="background:#' + ATL.colors[s].toString(16).padStart(6, "0") + '"></i>' + ATL.sysPl[s] + "</button>")
      .join("") +
    "</div>" +
    '<div class="atrow attools">' +
    tool("attreeb", "☰ Structures") +
    tool("atlab", "Étiquettes", 1) +
    tool("atdisp", "Affichage") +
    tool("atlay", "Couches") +
    tool("attr", "Transparence") +
    tool("atcut", "Coupe") +
    tool("atmes", "Mesurer") +
    '<button id="atmed" hidden>Médiastin</button>' +
    tool("atbr", "Respiration") +
    tool("atqz", "Quiz") +
    tool("atall", "Tout réafficher") +
    (ar ? tool("atar", "Réalité augmentée") : "") +
    (SY.role == "admin" ? tool("atup", "Mettre à jour…", 0, "Fichier .glb (un nom contenant « hd » = version détaillée pour ordinateur)") : "") +
    "</div></div>" +
    '<div id="atmsg">Chargement du modèle…</div>' +
    '<small id="atcr">BodyParts3D © DBCLS · CC BY 4.0</small>' +
    '<input type="file" id="atfile" hidden>';
  document.body.appendChild(d);
  document.documentElement.classList.add("atlon");
  ATL.v = { id, alive: true };
  ATL.key = (e) => ATL.v && ATL.v.onKey && ATL.v.onKey(e);
  addEventListener("keydown", ATL.key);
  if ($("atup")) {
    $("atup").onclick = () => $("atfile").click();
    $("atfile").onchange = (e) => atlasUpload(id, e.target.files[0]);
  }
  try {
    const [lib, buf] = await Promise.all([atlasLib(), atlasFile(id)]);
    if (!ATL.v || ATL.v.id !== id || !ATL.v.alive) return;
    atlasView(lib, buf, m, focusName);
  } catch (e) {
    const k = e && e.message,
      t =
        k == "absent"
          ? "Le fichier du modèle n’est pas encore en ligne. Touche « Mettre à jour… » pour envoyer " + id + ".glb."
          : k == "refuse"
            ? "Tu n’as pas accès à l’atlas 3D. Demande à l’administrateur."
            : k == "horsligne"
              ? "Pas de connexion : le modèle n’a pas encore été téléchargé sur cet appareil."
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
    fine = matchMedia("(pointer: fine)").matches,
    renderer = new T.WebGLRenderer({ canvas, antialias: true, stencil: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, fine ? 2 : 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  const scene = new T.Scene(),
    camP = new T.PerspectiveCamera(35, 1, 0.01, 50),
    camO = new T.OrthographicCamera(-1, 1, 1, -1, 0.01, 50),
    controls = new L.OrbitControls(camP, canvas),
    ORIGIN = new T.Vector3();
  scene.background = new T.Color(0x0e1116);
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
    breath: { on: false, ready: false, t0: 0, s: 0 }, quiz: null, tool: "",
    opSys: "muscle", real: false, relief: true, ao: fine, outline: true, focus: false, xray: false, ortho: false, grid: false,
    hist: [], meas: { on: false, pts: [] },
  });
  try {
    const pr = JSON.parse(localStorage.getItem("mr_atlas_aff") || "{}");
    ["real", "relief", "ao", "outline", "focus", "xray", "ortho"].forEach((k) => typeof pr[k] == "boolean" && (V[k] = pr[k]));
  } catch (e) {}
  const prefSave = () => {
    try {
      localStorage.setItem("mr_atlas_aff", JSON.stringify({ real: V.real, relief: V.relief, ao: V.ao, outline: V.outline, focus: V.focus, xray: V.xray, ortho: V.ortho }));
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
  controls.addEventListener("start", () => histPush());

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
      outline.visibleEdgeColor.set(0x5fd4c8);
      outline.hiddenEdgeColor.set(0x1d5f58);
      composer.addPass(outline);
    }
    composer.addPass(new L.OutputPass());
    composer.setSize(w, h);
    need();
  }
  function draw() {
    if (outline) outline.selectedObjects = [...V.sels].map((p) => p.mesh);
    const useFx = composer && (V.ao || (outline && V.sels.size));
    if (useFx) composer.render();
    else renderer.render(scene, V.cam);
  }

  // ---------- matériaux : couleurs, relief, transparence, rayons X, focus ----------
  const NOISE = `
  float atH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float atN(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(atH(i), atH(i + vec3(1,0,0)), f.x), mix(atH(i + vec3(0,1,0)), atH(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(atH(i + vec3(0,0,1)), atH(i + vec3(1,0,1)), f.x), mix(atH(i + vec3(0,1,1)), atH(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
  function reliefPatch(mt, kind, fiber) {
    mt.onBeforeCompile = (sh) => {
      sh.uniforms.atFib = { value: fiber };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vAtW;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvAtW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      const f =
        kind == "muscle"
          ? "vec3 q = vAtW * 1000.0; float s = dot(q, atFib); vec3 qq = (q - atFib * s) * 0.9; vec3 gr = vec3(atN(qq+vec3(0.31,0,0)), atN(qq+vec3(0,0.31,0)), atN(qq+vec3(0,0,0.31))) - atN(qq); gr -= atFib * dot(gr, atFib); normal = normalize(normal + 1.6 * (viewMatrix * vec4(gr, 0.0)).xyz); diffuseColor.rgb *= 0.93 + 0.14 * atN(qq);"
          : "vec3 q = vAtW * 1600.0; vec3 gr = vec3(atN(q+vec3(0.37,0,0)), atN(q+vec3(0,0.37,0)), atN(q+vec3(0,0,0.37))) - atN(q); normal = normalize(normal + 0.9 * (viewMatrix * vec4(gr, 0.0)).xyz); diffuseColor.rgb *= 0.95 + 0.08 * atN(q * 0.5);";
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vAtW;\nuniform vec3 atFib;" + NOISE)
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n" + f);
    };
    mt.customProgramCacheKey = () => "atrelief-" + kind;
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
  function materials(rebuild) {
    for (const p of V.parts) {
      const sys = p.meta.systeme;
      let mt = p.mesh.material;
      if (rebuild) {
        const old = mt;
        mt = new T.MeshStandardMaterial({ roughness: V.real ? ATL_REAL.rough[sys] ?? 0.6 : 0.65, metalness: 0 });
        if (V.real && V.relief && (sys == "muscle" || sys == "os")) reliefPatch(mt, sys, p.fib);
        mt.clippingPlanes = old.clippingPlanes;
        mt.side = old.side;
        p.mesh.material = mt;
        old.dispose();
      }
      mt.color.setHex(colorOf(p));
      let op = 1;
      if (sys == "zone") op = 0.3;
      else if (sys == "organe" && p.meta.fiche == "pleura") op = 0.35;
      if (V.xray) op = Math.min(op, 0.28);
      if (sys == V.opSys) op = Math.min(op, V.opac);
      if (V.focus && V.sels.size && !V.sels.has(p)) op = Math.min(op, 0.1);
      const tr = op < 0.99;
      if (mt.transparent !== tr) mt.needsUpdate = true;
      mt.transparent = tr;
      mt.opacity = op;
      mt.depthWrite = !tr;
      if (sys == "zone" || p.meta.fiche == "pleura") mt.side = mt.clippingPlanes && mt.clippingPlanes.length ? mt.side : T.DoubleSide;
      mt.emissive.setHex(V.sels.has(p) ? (p === V.sel ? 0x1d5f58 : 0x123f3a) : 0);
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
        o.material = new T.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.65, metalness: 0 });
        o.renderOrder = 100;
        const wb = new T.Box3().setFromObject(o),
          size = wb.getSize(new T.Vector3()),
          p = {
            mesh: o, base: o.position.clone(), q0: o.quaternion.clone(), s0: o.scale.clone(),
            c: root.worldToLocal(wb.getCenter(new T.Vector3())), size, meta: x,
            layer: ATL_LAYER_OF[x.fiche] ?? (x.systeme == "os" || x.systeme == "cartilage" ? 3 : x.systeme == "muscle" ? 1 : 5),
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
          el.innerHTML = '<i style="background:#' + (ATL.colors[x.systeme] || 0xcccccc).toString(16).padStart(6, "0") + '"></i>' + esc(x.repere);
          el.onclick = () => (V.quiz ? null : select(p));
          $("atlbl").appendChild(el);
          V.labels.push({ p, el, local: o.geometry.boundingBox.getCenter(new T.Vector3()) });
        }
      });
      document.querySelectorAll("#atl .atsys button").forEach((b) => (b.hidden = !present.has(b.dataset.s) || b.dataset.s == "zone"));
      if ($("atmed")) $("atmed").hidden = !present.has("zone");
      if (!present.has("muscle")) V.opSys = "organe";
      atlasIndexSave(model.id, V.parts, V.fiches);
      pinsBuild();
      vis();
      grid();
      materials(true);
      fxBuild();
      if (V.ortho) setOrtho(true, false);
      setView("front", false);
      V.hist = [];
      need();
      if ($("atmsg")) $("atmsg").remove();
      if (focusName) {
        const t = atNorm(focusName),
          p = V.parts.find((x) => atNorm(x.meta.fr) === t) || search(focusName)[0];
        if (p) setTimeout(() => focusPart(p), 300);
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
  function moveCam(pos, target, smooth = true, zoom, noHist) {
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
      const k = Math.min(1, (now - t0) / 500),
        e = 1 - Math.pow(1 - k, 3);
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
  function zoomBy(k) {
    histPush();
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
  document.querySelectorAll("#atcube .atcf").forEach((f) => (f.onclick = () => setView(f.dataset.v)));

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
      if (s && p.br) {
        const b = p.br;
        if (b.kind == "rot") {
          tq.setFromAxisAngle(b.axis, b.ang * s);
          m.position.sub(b.P).applyQuaternion(tq).add(b.P);
          m.quaternion.premultiply(tq);
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
  $("atex").oninput = (e) => {
    if (V.breath.on) breathStop();
    V.f = e.target.value / 100;
    $("atp").textContent = e.target.value + " %";
    pose();
  };
  $("atex").onchange = () => V.mode == "cote" && V.f > 0.5 && setView("front");
  const modeBtns = () => document.querySelectorAll('#atl .atseg[aria-label="Disposition"] button');
  modeBtns().forEach(
    (b) =>
      (b.onclick = () => {
        V.mode = b.dataset.m;
        modeBtns().forEach((x) => x.classList.toggle("on", x === b));
        if (V.breath.on) breathStop();
        if (!V.f) {
          V.f = 1;
          $("atex").value = 100;
          $("atp").textContent = "100 %";
        }
        pose();
        setView(V.mode == "cote" ? "front" : V.view);
      }),
  );

  // ---------- visibilité : systèmes, structures masquées, isolement, couches ----------
  const visible = (p) => !V.hSys.has(p.meta.systeme) && !V.hOne.has(p) && (!V.iso || V.iso.has(p)) && p.layer >= V.layer;
  const vis = () => {
    for (const p of V.parts) p.mesh.visible = visible(p);
    capObjs.forEach((o) => o.userData.sys && (o.visible = !V.hSys.has(o.userData.sys)));
    if (V.sel && !V.sel.mesh.visible) select(null);
    if ($("attree").classList.contains("show")) treePaint();
    isoBar();
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
  $("atlab").onclick = (e) => {
    V.showLbl = !V.showLbl;
    e.currentTarget.classList.toggle("on", V.showLbl);
    $("atlbl").hidden = !V.showLbl || !!V.quiz;
    need();
  };
  function showAll() {
    V.hSys.clear();
    V.hOne = new Set(V.parts.filter((p) => p.zone || p.meta.fiche == "pleura"));
    $("atmed").classList.remove("on");
    V.iso = null;
    V.layer = 0;
    sysBtns().forEach((b) => b.classList.remove("off"));
    if (V.tool == "lay") toolPanel("lay", true);
    vis();
  }
  $("atall").onclick = showAll;
  // compartiments du médiastin : affichés ou masqués ensemble
  $("atmed").onclick = () => {
    const zs = V.parts.filter((p) => p.zone),
      on = zs.some((p) => visible(p)),
      lungs = V.parts.filter((p) => /^(rul|rml|rll|lul|lll|pleura)$/.test(p.meta.fiche));
    zs.forEach((p) => (on ? V.hOne.add(p) : V.hOne.delete(p)));
    if (!on) {
      // on retire la paroi et les poumons pour voir le médiastin, et on les rend en quittant
      V.medPrev = { layer: V.layer, lungs: lungs.filter((p) => !V.hOne.has(p)) };
      lungs.forEach((p) => V.hOne.add(p));
      V.layer = ATL_LAYERS.length - 1; // « Médiastin seul »
      sysToggle("zone", false);
      toast("Médiastin (schématique) : supérieur en violet, antérieur en vert, moyen en rose, postérieur en jaune. Touche une zone pour sa fiche.");
    } else if (V.medPrev) {
      V.layer = V.medPrev.layer;
      V.medPrev.lungs.forEach((p) => V.hOne.delete(p));
      V.medPrev = null;
    }
    if (V.tool == "lay") toolPanel("lay", true);
    $("atmed").classList.toggle("on", !on);
    vis();
  };
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
    if (!V.iso) return b && b.remove();
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

  // ---------- liste des structures (menu) ----------
  function treePaint() {
    const box = $("attree"),
      order = Object.keys(ATL.sysFr),
      eye = (on) => (on ? "👁" : "◌");
    box.innerHTML =
      '<div class="atth"><b>Structures</b><button class="atpx" aria-label="Fermer la liste">✕</button></div>' +
      order
        .filter((s) => V.parts.some((p) => p.meta.systeme == s))
        .map((s) => {
          const ps = V.parts.filter((p) => p.meta.systeme == s),
            groups = {};
          ps.forEach((p) => (groups[p.meta.fiche || p.meta.fr] = groups[p.meta.fiche || p.meta.fr] || []).push(p));
          const sOn = !V.hSys.has(s);
          return (
            '<details class="attg"' + (box.dataset["o" + s] ? " open" : "") + ' data-s="' + s + '"><summary><i style="background:#' +
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
    box.querySelector(".atpx").onclick = () => treeToggle(false);
    box.querySelectorAll(".attg").forEach((d) => (d.ontoggle = () => (box.dataset["o" + d.dataset.s] = d.open ? "1" : "")));
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
  function treeToggle(on) {
    const box = $("attree");
    if (on === undefined) on = !box.classList.contains("show");
    if (on) treePaint();
    box.classList.toggle("show", on);
    $("attreeb").classList.toggle("on", on);
    $("atl").classList.toggle("tree-open", on);
  }
  $("attreeb").onclick = () => treeToggle();

  // ---------- panneaux d'outils ----------
  const sw = (id, label, on, hint) =>
    '<label class="atsw"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + "><span>" + label + (hint ? "<small>" + hint + "</small>" : "") + "</span></label>";
  function toolPanel(t, keep) {
    if (!keep) V.tool = V.tool === t ? "" : t;
    ["atdisp:disp", "atlay:lay", "attr:tr", "atcut:cut", "atexo:ex"].forEach((x) => {
      const [id, k] = x.split(":");
      $(id).classList.toggle("on", V.tool == k || (k == "tr" && V.opac < 1) || (k == "cut" && !!V.clip.axis) || (k == "lay" && V.layer > 0));
    });
    const box = $("attool");
    box.hidden = !V.tool;
    if (V.tool == "disp") {
      box.innerHTML =
        '<div class="atr"><span class="atlbl2">Couleurs</span><div class="atseg" id="atcol"><button data-c="sys"' + (V.real ? "" : ' class="on"') +
        '>Par système</button><button data-c="real"' + (V.real ? ' class="on"' : "") + ">Réalistes</button></div></div>" +
        '<div class="atsws">' +
        sw("atsrel", "Relief des tissus", V.relief, "avec les couleurs réalistes") +
        sw("atsao", "Ombres de contact", V.ao, fine ? "" : "peut ralentir le téléphone") +
        sw("atsout", "Contour de la sélection", V.outline) +
        sw("atsfoc", "Mode focus", V.focus, "le reste devient translucide") +
        sw("atsxr", "Rayons X", V.xray) +
        sw("atsort", "Vue orthographique", V.ortho, "sans perspective, comme un atlas") +
        sw("atsgr", "Quadrillage 3D", V.grid) +
        "</div>";
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
        '<div class="atr"><label for="atly">Couches</label><input id="atly" type="range" min="0" max="' + (ATL_LAYERS.length - 1) + '" value="' + V.layer +
        '"><span class="atlyn">' + ATL_LAYERS[V.layer] + "</span></div>";
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
        "</div>" + sw("atcap", "Coupe pleine", V.clip.caps) +
        '</div><div class="atr" id="atcpr"' + (V.clip.axis ? "" : " hidden") + '><label for="atcp">Position</label><input id="atcp" type="range" min="-100" max="100" value="' +
        V.clip.pos + '"></div>';
    else if (V.tool == "ex")
      box.innerHTML =
        '<div class="atr atwrap"><span class="atlbl2">Direction</span><div class="atseg" id="atexd">' +
        [["all", "Toutes"], ["z", "Avant-arrière"], ["y", "Haut-bas"], ["x", "Gauche-droite"]]
          .map((a) => '<button data-d="' + a[0] + '"' + (V.exDir == a[0] ? ' class="on"' : "") + ">" + a[1] + "</button>")
          .join("") +
        '</div></div><div class="atr atwrap"><span class="atlbl2">Écarter</span><div class="atseg" id="atexs">' +
        [["all", "Tout"], ["sel", "La sélection"], ["sys", "Son système"]]
          .map((a) => '<button data-s="' + a[0] + '"' + (V.exScope == a[0] ? ' class="on"' : "") + ">" + a[1] + "</button>")
          .join("") +
        "</div></div>" +
        (V.exScope != "all" && !V.sels.size ? '<p class="atnote">Sélectionne d’abord une structure.</p>' : "");
    else box.innerHTML = "";
    if ($("atly"))
      $("atly").oninput = (e) => {
        V.layer = +e.target.value;
        box.querySelector(".atlyn").textContent = ATL_LAYERS[V.layer];
        $("atlay").classList.add("on");
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
        $("attr").classList.add("on");
        materials();
      };
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
          if (V.mode == "cote") {
            V.mode = "eclate";
            modeBtns().forEach((x) => x.classList.toggle("on", x.dataset.m == "eclate"));
          }
          toolPanel("ex", true);
          if (!V.f) {
            V.f = 0.6;
            $("atex").value = 60;
            $("atp").textContent = "60 %";
          }
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
  $("atdisp").onclick = () => toolPanel("disp");
  $("atlay").onclick = () => toolPanel("lay");
  $("attr").onclick = () => toolPanel("tr");
  $("atcut").onclick = () => toolPanel("cut");
  $("atexo").onclick = () => toolPanel("ex");

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
        const b = new T.Mesh(p.mesh.geometry, mk(T.BackSide, T.IncrementWrapStencilOp)),
          f = new T.Mesh(p.mesh.geometry, mk(T.FrontSide, T.DecrementWrapStencilOp));
        b.renderOrder = f.renderOrder = gi * 2 + 1;
        b.raycast = f.raycast = () => {};
        p.mesh.add(b, f);
        capObjs.push(b, f);
      }
      const col = V.real ? ATL_REAL.sys[s] : ATL.colors[s],
        pm = new T.MeshStandardMaterial({
          color: new T.Color(col).lerp(new T.Color(0xffffff), 0.45), roughness: 0.95, metalness: 0,
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
    $("atcut").classList.toggle("on", V.tool == "cut" || on);
    caps();
  }

  // ---------- quadrillage 3D gradué et directions anatomiques ----------
  let gridObj = null;
  const gdirs = [["Crânial", [0, 1, 0]], ["Caudal", [0, -1, 0]], ["Antérieur", [0, 0, 1]], ["Postérieur", [0, 0, -1]], ["Gauche", [1, 0, 0]], ["Droite", [-1, 0, 0]]];
  function gridToggle(on) {
    V.grid = on;
    $("atgrid").classList.toggle("on", on);
    if (gridObj) {
      gridObj.removeFromParent();
      gridObj.children.forEach((c) => (c.geometry.dispose(), c.material.dispose()));
      gridObj = null;
    }
    $("atgl").innerHTML = "";
    if (on) {
      const e = V.ext,
        X = Math.ceil(e.x * 100 + 4) / 100,
        Y = Math.ceil(e.y * 100 + 4) / 100,
        Z = Math.ceil(e.z * 100 + 4) / 100,
        minor = [],
        major = [],
        line = (arr, a, b) => arr.push(...a, ...b);
      // sol (y = -Y), mur postérieur (z = -Z), mur latéral droit (x = -X), un trait par centimètre
      for (let i = -Math.round(X * 100); i <= Math.round(X * 100); i++) {
        const x = i / 100,
          arr = i % 5 ? minor : major;
        line(arr, [x, -Y, -Z], [x, -Y, Z]);
        line(arr, [x, -Y, -Z], [x, Y, -Z]);
      }
      for (let i = -Math.round(Z * 100); i <= Math.round(Z * 100); i++) {
        const z = i / 100,
          arr = i % 5 ? minor : major;
        line(arr, [-X, -Y, z], [X, -Y, z]);
        line(arr, [-X, -Y, z], [-X, Y, z]);
      }
      for (let i = -Math.round(Y * 100); i <= Math.round(Y * 100); i++) {
        const y = i / 100,
          arr = i % 5 ? minor : major;
        line(arr, [-X, y, -Z], [X, y, -Z]);
        line(arr, [-X, y, -Z], [-X, y, Z]);
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
      V.gdist = { X, Y, Z };
      $("atgl").innerHTML = gdirs.map((d) => '<span class="atgd">' + d[0] + "</span>").join("");
      toast("Quadrillage : 1 carreau = 1 cm (traits plus marqués tous les 5 cm).");
    }
    need();
  }
  $("atgrid").onclick = () => {
    gridToggle(!V.grid);
    if (V.tool == "disp") toolPanel("disp", true);
  };

  // ---------- respiration (schématique) ----------
  function breathSetup() {
    const B = V.breath,
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
    if (!V.breath.ready) breathSetup();
    V.f = 0;
    $("atex").value = 0;
    $("atp").textContent = "0 %";
    V.breath.on = true;
    V.breath.t0 = performance.now();
    $("atbr").classList.add("on");
    toast("Respiration schématique : les côtes s’élèvent, le sternum avance, le diaphragme descend et les poumons se remplissent.");
  }
  function breathStop() {
    V.breath.on = false;
    V.breath.s = 0;
    $("atbr").classList.remove("on");
    pose();
  }
  $("atbr").onclick = () => (V.breath.on ? breathStop() : breathStart());

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
  function orbitOn(p) {
    const b = new T.Box3().setFromObject(p.mesh),
      c = b.getCenter(new T.Vector3()),
      r = Math.max(b.getSize(new T.Vector3()).length() / 2, 0.04),
      dir = V.cam.position.clone().sub(controls.target).normalize();
    moveCam(c.clone().addScaledVector(dir, fitDist(r * 1.5)), c, true, V.ortho ? orthoZoomFor(r * 1.5) : 1);
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
    if ($("attree").classList.contains("show")) treePaint();
  }
  V.select = select;
  function panel() {
    const pan = $("atpan"),
      p = V.sel;
    $("atl").classList.toggle("pan-open", !!p);
    if (!p) {
      pan.classList.remove("show");
      return;
    }
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
      '<div class="atpb atpa"><button class="b" id="atiso1">Isoler' + (V.sels.size > 1 ? " la sélection" : "") +
      '</button><button class="b" id="atmul">' + (V.multi ? "✓ Sélection multiple" : "＋ Sélectionner d’autres") +
      '</button><button class="b" id="atorb">Tourner autour</button>' +
      Object.keys(ATL.detail)
        .filter((m) => m !== model.id && ATL.detail[m].includes(p.meta.fiche))
        .map((m) => '<button class="b p atdet" data-m="' + m + '">Voir en détail : ' + esc((ATL.models.find((x) => x.id == m) || {}).titre || m) + "</button>")
        .join("") +
      "</div>" +
      (f
        ? '<p class="atpd">' + esc(f.desc) + "</p><dl>" + f.rows.map((r) => "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>").join("") + "</dl>" +
          (f.note ? '<div class="atpn"><b>À retenir</b>' + esc(f.note) + "</div>" : "")
        : '<p class="atpd">Pas encore de fiche pour cette structure.</p>') +
      '<small class="atpe">' + esc(p.meta.en || "") + '</small><div class="atpb">' +
      (f ? '<button class="b p" id="atfc">' + icn("cards") + " Créer des flashcards</button>" : "") +
      '<button class="b" id="atsnap">' + icn("image") + " Flashcard image" + (V.sels.size > 1 ? " (" + V.sels.size + ")" : "") + "</button>" +
      '<button class="b" id="athide">Masquer</button></div><div id="atfcs"></div>' +
      '<div class="atnotes"><label for="atnt">' + icn("pen") + " Mes notes</label>" +
      '<textarea id="atnt" rows="3" placeholder="Une astuce, une remarque du prof, un moyen mnémotechnique…">' + esc(noteGet(p)) + "</textarea></div>";
    pan.scrollTop = 0;
    pan.classList.add("show");
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
    pan.querySelectorAll(".atdet").forEach((b) => (b.onclick = () => atlasOpen(b.dataset.m)));
    if ($("atfc")) $("atfc").onclick = () => atlasCardsForm(f);
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
      el.innerHTML = "<i></i>✎ " + esc(p.meta.fr);
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
    const pool = V.parts.filter((p) => p.mesh.visible && !p.zone),
      seen = new Set(),
      list = [];
    for (const p of pool.sort(() => Math.random() - 0.5)) {
      if (list.length >= QN) break;
      if (seen.has(p.meta.fr)) continue;
      seen.add(p.meta.fr);
      list.push(p);
    }
    if (list.length < 3) return toast("Affiche au moins 3 structures pour lancer un quiz.");
    V.quiz = { list, i: 0, ok: 0, wait: false, mode };
    $("atqz").classList.add("on");
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
        '</small></div><div class="atpb"><button class="b p" id="atqre">Recommencer</button><button class="b" id="atqend">Fermer</button></div>';
      $("atqre").onclick = () => quizStart(Q.mode);
      $("atqend").onclick = quizStop;
      return;
    }
    const p = Q.list[Q.i];
    if (Q.mode == "nom") return quizNamePaint(Q, p, msg, cls);
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
  function quizSave(Q) {
    S.atq = S.atq || { hist: [] };
    S.atq.hist.push({ d: day(), t: Date.now(), m: model.id, n: Q.list.length, ok: Q.ok, mode: Q.mode });
    if (S.atq.hist.length > 300) S.atq.hist = S.atq.hist.slice(-300);
    save();
  }
  function quizStop() {
    V.quiz = null;
    $("atqz").classList.remove("on");
    $("atlbl").hidden = !V.showLbl;
    quizPaint();
    materials();
  }
  $("atqz").onclick = () => {
    if (V.quiz) return quizStop();
    const box = $("atquiz");
    box.hidden = false;
    box.innerHTML =
      '<div class="atqz"><b>Quiz 3D</b><small>10 questions sur les structures affichées</small></div><div class="atpb">' +
      '<button class="b p" id="atqm1">Touche la structure</button><button class="b p" id="atqm2">Nomme la structure</button><button class="b" id="atqm0">Annuler</button></div>';
    $("atqm1").onclick = () => quizStart("touche");
    $("atqm2").onclick = () => quizStart("nom");
    $("atqm0").onclick = () => (box.hidden = true);
  };

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
  $("atmes").onclick = () => {
    V.meas.on = !V.meas.on;
    $("atmes").classList.toggle("on", V.meas.on);
    if (!V.meas.on) measClear();
    else toast("Touche deux points sur le modèle pour mesurer la distance.");
  };

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
    if (V.quiz) return p && quizAnswer(p);
    const now = performance.now();
    if (p && lastTap.p === p && now - lastTap.t < 350) {
      lastTap = { t: 0, p: null };
      return focusPart(p);
    }
    lastTap = { t: now, p };
    select(p, e.shiftKey || e.ctrlKey || e.metaKey);
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
  $("athelp").onclick = () => {
    const b = $("athelpbox");
    b.hidden = !b.hidden;
    b.innerHTML =
      '<button class="atpx" aria-label="Fermer">✕</button><b>Raccourcis clavier</b><dl>' + KEYS.map((k) => "<dt>" + k[0] + "</dt><dd>" + k[1] + "</dd>").join("") +
      '</dl><p class="atnote">Maj + clic : sélection multiple · double-clic : tourner autour</p>';
    b.querySelector(".atpx").onclick = () => (b.hidden = true);
  };
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
  V.onKey = (e) => {
    const ae = document.activeElement || {},
      typing = /INPUT|TEXTAREA|SELECT/.test(ae.tagName || "") && ae.type != "range" && ae.type != "checkbox";
    if (e.key == "Escape") {
      if (typing) return;
      if (!$("athelpbox").hidden) return ($("athelpbox").hidden = true);
      if (V.meas.on) return $("atmes").click();
      if (V.sel) return select(null);
      return atlasClose();
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length == 1 ? e.key.toLowerCase() : e.key,
      act = {
        f: () => setView("front"), d: () => setView("back"), p: () => setView("side"), 3: () => setView("q34"), v: () => setView("persp"),
        ArrowLeft: () => rotate(-0.17, 0), ArrowRight: () => rotate(0.17, 0), ArrowUp: () => rotate(0, -0.17), ArrowDown: () => rotate(0, 0.17),
        "+": () => zoomBy(1.3), "=": () => zoomBy(1.3), "-": () => zoomBy(1 / 1.3),
        r: () => $("atreset").click(), Backspace: () => $("atback").click(),
        o: () => (setOrtho(!V.ortho), prefSave(), V.tool == "disp" && toolPanel("disp", true)),
        g: () => $("atgrid").click(), e: () => $("atlab").click(), i: () => V.sels.size && isolate(V.sels), h: () => $("athide") && $("athide").click(),
        a: showAll, l: () => treeToggle(), "/": () => $("atq").focus(),
      }[k];
    if (act) {
      e.preventDefault();
      act();
    }
  };

  // ---------- réalité augmentée (iPhone : AR Quick Look) ----------
  if ($("atar"))
    $("atar").onclick = async () => {
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
    };

  // ---------- étiquettes, échelle, cube d'orientation (mis à jour à chaque image) ----------
  const lray = new T.Raycaster(),
    wp = new T.Vector3(),
    sp = new T.Vector3();
  const proj = (v, w, h) => (sp.copy(v).project(V.cam), sp.z <= 1 ? [Math.round(((sp.x + 1) / 2) * w), Math.round(((1 - sp.y) / 2) * h)] : null);
  function overlays() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (V.showLbl && !V.quiz)
      for (const Lb of V.labels) {
        let xy = null;
        if (Lb.p.mesh.visible) {
          Lb.p.mesh.localToWorld(wp.copy(Lb.local));
          if (!V.clip.axis || V.clip.plane.distanceToPoint(wp) >= 0) xy = proj(wp, w, h);
        }
        const show = !!xy;
        if (show !== Lb.shown) {
          Lb.el.style.display = show ? "" : "none";
          Lb.shown = show;
        }
        if (xy) Lb.el.style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)";
      }
    if (V.grid && V.gdist) {
      const G = V.gdist,
        els = $("atgl").children;
      gdirs.forEach((d, i) => {
        const xy = proj(new T.Vector3(d[1][0] * (G.X + 0.03), d[1][1] * (G.Y + 0.03), d[1][2] * (G.Z + 0.03)), w, h),
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
    // cube d'orientation : suit la rotation de la caméra
    const e = V.cam.matrixWorldInverse.elements;
    $("atcube").firstChild.style.transform = "matrix3d(" + [e[0], -e[1], e[2], 0, -e[4], e[5], -e[6], 0, e[8], -e[9], e[10], 0, 0, 0, 0, 1].join(",") + ")";
  }
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
  }

  // téléphone à l'horizontale : les outils occupent la droite, on recentre le modèle dans la partie libre
  const landscape = matchMedia("(orientation: landscape) and (max-height: 500px)");
  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      inset = landscape.matches ? Math.min(300, w * 0.4) : 0;
    renderer.setSize(w, h, false);
    camP.aspect = (w + inset) / h;
    camO.left = -(w + inset) / h;
    camO.right = (w + inset) / h;
    camO.top = 1;
    camO.bottom = -1;
    for (const c of [camP, camO]) {
      if (inset) c.setViewOffset(w + inset, h, inset, 0, w, h);
      else c.clearViewOffset();
      c.updateProjectionMatrix();
    }
    if (composer) fxBuild();
    need();
  }
  V.resize = resize;
  addEventListener("resize", resize);
  resize();
  renderer.setAnimationLoop((now) => {
    if (V.anim) {
      V.anim(now);
      V.dirty = true;
    }
    if (V.breath.on) {
      V.breath.s = (1 - Math.cos(((now - V.breath.t0) / 4500) * Math.PI * 2)) / 2;
      pose();
    }
    controls.update();
    if (!V.dirty) return;
    V.dirty = false;
    draw();
    overlays();
  });
}

// ---------- fermeture : on libère la mémoire graphique ----------
function atlasClose() {
  const V = ATL.v;
  ATL.v = null;
  if (V) {
    V.alive = false;
    clearTimeout(V.idleT);
    if (V.resize) removeEventListener("resize", V.resize);
    if (V.renderer) {
      V.renderer.setAnimationLoop(null);
      (V.parts || []).forEach((p) => {
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      });
      V.controls.dispose();
      V.renderer.dispose();
    }
  }
  if (ATL.key) removeEventListener("keydown", ATL.key);
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
    ]
      .map((t) => '<div class="k"><b>' + t[0] + "</b><small>" + t[1] + "</small></div>")
      .join("") +
    "</div>"
  );
}

// ---------- l'administrateur remplace le fichier partagé ----------
async function atlasUpload(id, f) {
  if (!f) return;
  if (!/\.glb$/i.test(f.name)) return toast("Choisis un fichier .glb");
  if (f.size > 20 * 1048576) return toast("Fichier trop lourd (20 Mo au plus)");
  // le nom du fichier décide du modèle (thorax, coeur, poumons…) ; « hd » = version détaillée pour ordinateur
  const base = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    target = (ATL.models.find((m) => base.startsWith(m.id)) || {}).id || id,
    name = target + (/hd/i.test(f.name) ? "-hd" : "") + ".glb";
  toast("Envoi du modèle" + (name.includes("-hd") ? " détaillé (ordinateurs)" : "") + "…", 1);
  const { error } = await SY.sb.storage
    .from("atlas")
    // le type est forcé : Windows et iOS ne reconnaissent pas les .glb (sinon refus « mime type not supported »)
    .upload(name, new Blob([f], { type: "model/gltf-binary" }), { upsert: true, contentType: "model/gltf-binary", cacheControl: "60" });
  if (error) return toast(esc(syTr(error.message)));
  toast("Modèle « " + esc((ATL.models.find((m) => m.id == target) || {}).titre || target) + " »" + (name.includes("-hd") ? " (version ordinateur)" : "") + " mis à jour ✔");
  if (target == id) atlasOpen(id);
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
      b.onclick = () => atlasOpen(hit.m, hit.fr);
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
    b.onclick = () => atlasOpen(h.m, h.fr);
    bar.appendChild(b);
  });
  const h1 = art.querySelector("h1");
  (h1 && h1.nextElementSibling ? h1.nextElementSibling : art.firstChild).after(bar);
}
