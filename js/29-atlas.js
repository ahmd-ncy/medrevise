// ================= Atlas 3D =================
// Modèles anatomiques en 3D (BodyParts3D), ouverts depuis la page Cours.
// Un seul fichier .glb par modèle, dans l'espace privé « atlas » de Supabase, partagé par tous :
// la base ne le donne qu'à l'administrateur et aux membres à qui il a ouvert l'accès (voir supabase.sql).
// Une copie est gardée sur l'appareil (cache « mr-atlas ») pour l'ouvrir hors connexion ; elle est effacée si l'accès est retiré.
const ATL = {
  models: [{ id: "thorax", titre: "Thorax", sous: "Os, muscles, organes et gros vaisseaux" }],
  cache: "mr-atlas",
  colors: { os: 0xe8dcc4, cartilage: 0xaacddc, muscle: 0xc4483c, organe: 0xe2a0a8, artere: 0xe8342a, veine: 0x3c6edc },
  sysFr: { os: "Os", cartilage: "Cartilage", muscle: "Muscle", organe: "Organe", artere: "Artère", veine: "Veine" },
  sysPl: { os: "Os", cartilage: "Cartilages", muscle: "Muscles", organe: "Organes", artere: "Artères", veine: "Veines" },
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
async function atlasFile(id, force) {
  const key = "/atlas/" + id + ".glb",
    ca = window.caches ? await caches.open(ATL.cache).catch(() => null) : null,
    old = ca ? await ca.match(key) : null,
    st = SY.sb.storage.from("atlas");
  let maj = null,
    online = navigator.onLine !== false;
  if (online) {
    // la liste ne renvoie le fichier que si la base autorise ce compte : c'est aussi le contrôle d'accès
    const r = await st.list("", { search: id + ".glb" });
    if (r.error) {
      if (/fetch|network/i.test(r.error.message || "")) online = false;
      else throw r.error;
    } else {
      const f = (r.data || []).find((x) => x.name === id + ".glb");
      if (!f) {
        if (ca) await ca.delete(key);
        const e = new Error(SY.role == "admin" ? "absent" : "refuse");
        throw e;
      }
      maj = f.updated_at || f.created_at || "";
    }
  }
  if (old && (!online || (!force && old.headers.get("x-maj") === maj))) return old.arrayBuffer();
  if (!online) throw new Error("horsligne");
  const { data, error } = await st.download(id + ".glb");
  if (error) throw error;
  const buf = await data.arrayBuffer();
  if (ca)
    await ca
      .put(key, new Response(buf.slice(0), { headers: { "content-type": "model/gltf-binary", "x-maj": maj || "" } }))
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
async function atlasOpen(id) {
  if (ATL.v) atlasClose();
  const m = ATL.models.find((x) => x.id === id) || ATL.models[0],
    d = document.createElement("div");
  d.id = "atl";
  d.setAttribute("role", "dialog");
  d.setAttribute("aria-modal", "true");
  d.setAttribute("aria-label", "Atlas 3D : " + m.titre);
  const tool = (id, t, on) => '<button id="' + id + '"' + (on ? ' class="on"' : "") + ">" + t + "</button>";
  d.innerHTML =
    '<canvas id="atc"></canvas>' +
    '<div id="atlbl"></div>' +
    '<div class="atb atop"><button class="atx" onclick="atlasClose()" aria-label="Fermer">✕</button>' +
    '<div class="ats"><input id="atq" type="search" placeholder="Rechercher dans le ' +
    esc(m.titre.toLowerCase()) +
    '…" autocomplete="off" aria-label="Rechercher une structure"><div id="atsug" role="listbox"></div></div>' +
    '<div class="atv">' +
    ATL.views.map((v, i) => '<button data-v="' + v[0] + '"' + (i ? "" : ' class="on"') + ">" + v[1] + "</button>").join("") +
    "</div></div>" +
    '<div id="atquiz" class="atb" hidden></div>' +
    '<aside id="atpan" aria-live="polite"></aside>' +
    '<div class="atb abot"><div id="attool" hidden></div>' +
    '<div class="atr"><label for="atex">Écarter</label><input id="atex" type="range" min="0" max="100" value="0"><span id="atp">0 %</span>' +
    '<div class="atseg" role="group" aria-label="Disposition"><button data-m="eclate" class="on">Éclaté</button><button data-m="cote">Côte à côte</button></div></div>' +
    '<div class="atrow atsys">' +
    Object.keys(ATL.sysFr)
      .map((s) => '<button data-s="' + s + '" hidden><i style="background:#' + ATL.colors[s].toString(16).padStart(6, "0") + '"></i>' + ATL.sysPl[s] + "</button>")
      .join("") +
    "</div>" +
    '<div class="atrow attools">' +
    tool("atlab", "Étiquettes", 1) +
    tool("attr", "Transparence") +
    tool("atcut", "Coupe") +
    tool("atbr", "Respiration") +
    tool("atqz", "Quiz") +
    tool("atall", "Tout réafficher") +
    (SY.role == "admin" ? tool("atup", "Mettre à jour…") : "") +
    "</div></div>" +
    '<div id="atmsg">Chargement du modèle…</div>' +
    '<small id="atcr">BodyParts3D © DBCLS · CC BY 4.0</small>' +
    '<input type="file" id="atfile" hidden>';
  document.body.appendChild(d);
  document.documentElement.classList.add("atlon");
  ATL.v = { id, alive: true };
  ATL.key = (e) => {
    if (e.key !== "Escape") return;
    if (document.activeElement === $("atq") && $("atq").value) return;
    atlasClose();
  };
  addEventListener("keydown", ATL.key);
  if ($("atup")) {
    $("atup").onclick = () => $("atfile").click();
    $("atfile").onchange = (e) => atlasUpload(id, e.target.files[0]);
  }
  try {
    const [lib, buf] = await Promise.all([atlasLib(), atlasFile(id)]);
    if (!ATL.v || ATL.v.id !== id || !ATL.v.alive) return;
    atlasView(lib, buf, m);
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

// ---------- visualiseur ----------
function atlasView(L, buf, model) {
  const T = L.THREE,
    V = ATL.v,
    canvas = $("atc"),
    renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia("(pointer: coarse)").matches ? 1.5 : 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(35, 1, 0.01, 50),
    controls = new L.OrbitControls(camera, canvas),
    ORIGIN = new T.Vector3();
  scene.background = new T.Color(0x0e1116);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  scene.add(new T.HemisphereLight(0xffffff, 0x334455, 1.6));
  const key = new T.DirectionalLight(0xffffff, 2.2);
  key.position.set(1, 2, 3);
  camera.add(key);
  scene.add(camera);
  Object.assign(V, {
    renderer, controls, camera,
    parts: [], labels: [], fiches: {}, radius: 0.3, gridR: 0.5, ext: new T.Vector3(0.2, 0.2, 0.2),
    f: 0, mode: "eclate", anim: null, sel: null, hSys: new Set(), hOne: new Set(), showLbl: true,
    dirty: true, idleT: 0, view: "front", opac: 1, clip: { axis: "", pos: 0, plane: new T.Plane(new T.Vector3(0, -1, 0), 0) },
    breath: { on: false, ready: false, t0: 0, s: 0 }, quiz: null, tool: "",
  });
  // rendu à la demande : on ne redessine que quand quelque chose bouge
  const need = () => {
    V.dirty = true;
    clearTimeout(V.idleT);
    V.idleT = setTimeout(occlusion, 180);
  };
  V.need = need;
  controls.addEventListener("change", need);

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
      V.mc = root.worldToLocal(new T.Vector3()); // centre du modèle, en coordonnées du modèle
      V.ext = box.getSize(new T.Vector3()).multiplyScalar(0.5);
      V.radius = V.ext.length();
      V.fiches = (g.asset && g.asset.extras && g.asset.extras.fiches) || {};
      const present = new Set();
      root.traverse((o) => {
        if (!o.isMesh) return;
        let n = o,
          x = null;
        while (n && !(x = n.userData && n.userData.fr ? n.userData : null)) n = n.parent;
        if (!x) return;
        if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
        o.material = new T.MeshStandardMaterial({ color: ATL.colors[x.systeme] || 0xcccccc, roughness: 0.65, metalness: 0 });
        const wb = new T.Box3().setFromObject(o),
          p = {
            mesh: o,
            base: o.position.clone(),
            q0: o.quaternion.clone(),
            s0: o.scale.clone(),
            c: root.worldToLocal(wb.getCenter(new T.Vector3())),
            size: wb.getSize(new T.Vector3()),
            meta: x,
          };
        const fi = V.fiches[x.fiche] || {};
        p.key = atNorm([x.fr, fi.titre, fi.cat, ATL.sysFr[x.systeme], x.en].join(" "));
        o.userData.part = p;
        V.parts.push(p);
        present.add(x.systeme);
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
      document.querySelectorAll("#atl .atsys button").forEach((b) => (b.hidden = !present.has(b.dataset.s)));
      grid();
      setView("front", false);
      need();
      if ($("atmsg")) $("atmsg").remove();
    },
    (e) => {
      if ($("atmsg")) $("atmsg").textContent = "Fichier 3D illisible : " + (e && e.message ? e.message : "erreur");
    },
  );

  // ---------- caméra ----------
  const VIEWS = { front: [0, 0, 1], back: [0, 0, -1], side: [1, 0, 0], q34: [0.8, 0.35, 0.9], persp: [0.55, 1, 0.75] };
  const fitDist = (r) => {
    const vf = T.MathUtils.degToRad(camera.fov / 2),
      hf = Math.atan(Math.tan(vf) * camera.aspect);
    return (r / Math.sin(Math.min(vf, hf))) * 0.95;
  };
  function moveCam(pos, target, smooth = true) {
    if (!smooth) {
      camera.position.copy(pos);
      controls.target.copy(target);
      return need();
    }
    const fp = camera.position.clone(),
      ft = controls.target.clone(),
      t0 = performance.now();
    V.anim = (now) => {
      const k = Math.min(1, (now - t0) / 500),
        e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(fp, pos, e);
      controls.target.lerpVectors(ft, target, e);
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
    moveCam(new T.Vector3(...VIEWS[v]).normalize().multiplyScalar(fitDist(curR())), ORIGIN, smooth);
  }
  document.querySelectorAll("#atl .atv button").forEach((b) => (b.onclick = () => setView(b.dataset.v)));

  // ---------- position de chaque structure : éclaté, côte à côte, respiration ----------
  const tq = new T.Quaternion(),
    tv = new T.Vector3();
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
      } else if (V.f) {
        if (V.mode == "cote") m.position.add(tv.copy(p.grid).sub(p.c).multiplyScalar(V.f));
        else m.position.add(tv.copy(p.c).sub(V.mc).multiplyScalar(V.f * 1.2));
      }
    }
    need();
  }
  // disposition « côte à côte » : rangées par système (os, cartilages, muscles, organes, vaisseaux)
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
      minX = 0,
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
    const minY = y - rowH,
      cx = (minX + maxX) / 2,
      cy = minY / 2;
    for (const p of V.parts) p.grid.add(new T.Vector3(V.mc.x - cx, V.mc.y - cy, V.mc.z));
    V.gridR = Math.hypot(maxX - minX, minY) / 2;
  }
  $("atex").oninput = (e) => {
    if (V.breath.on) breathStop();
    V.f = e.target.value / 100;
    $("atp").textContent = e.target.value + " %";
    pose();
  };
  $("atex").onchange = () => setView(V.mode == "cote" && V.f > 0.5 ? "front" : V.view);
  document.querySelectorAll("#atl .atseg button").forEach(
    (b) =>
      (b.onclick = () => {
        V.mode = b.dataset.m;
        document.querySelectorAll("#atl .atseg button").forEach((x) => x.classList.toggle("on", x === b));
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

  // ---------- systèmes et structures masquées ----------
  const vis = () => {
    for (const p of V.parts) p.mesh.visible = !V.hSys.has(p.meta.systeme) && !V.hOne.has(p);
    if (V.sel && !V.sel.mesh.visible) select(null);
    need();
  };
  const sysBtns = () => document.querySelectorAll("#atl .atsys button");
  sysBtns().forEach(
    (b) =>
      (b.onclick = () => {
        const s = b.dataset.s;
        V.hSys.has(s) ? V.hSys.delete(s) : V.hSys.add(s);
        b.classList.toggle("off", V.hSys.has(s));
        vis();
      }),
  );
  $("atlab").onclick = (e) => {
    V.showLbl = !V.showLbl;
    e.currentTarget.classList.toggle("on", V.showLbl);
    $("atlbl").hidden = !V.showLbl || !!V.quiz;
    need();
  };
  $("atall").onclick = () => {
    V.hSys.clear();
    V.hOne.clear();
    sysBtns().forEach((b) => b.classList.remove("off"));
    vis();
  };

  // ---------- outils : transparence et coupe ----------
  function toolPanel(t) {
    V.tool = V.tool === t ? "" : t;
    $("attr").classList.toggle("on", V.tool == "tr" || V.opac < 1);
    $("atcut").classList.toggle("on", V.tool == "cut" || !!V.clip.axis);
    const box = $("attool");
    box.hidden = !V.tool;
    if (V.tool == "tr")
      box.innerHTML =
        '<div class="atr"><label for="atop">Muscles transparents</label><input id="atop" type="range" min="10" max="100" value="' +
        Math.round(V.opac * 100) +
        '"><span>' +
        Math.round(V.opac * 100) +
        " %</span></div>";
    else if (V.tool == "cut")
      box.innerHTML =
        '<div class="atseg atcax">' +
        [["", "Aucune"], ["y", "Horizontale"], ["z", "Frontale"], ["x", "Sagittale"]]
          .map((a) => '<button data-a="' + a[0] + '"' + (V.clip.axis === a[0] ? ' class="on"' : "") + ">" + a[1] + "</button>")
          .join("") +
        '</div><div class="atr"' +
        (V.clip.axis ? "" : " hidden") +
        '><label for="atcp">Position</label><input id="atcp" type="range" min="-100" max="100" value="' +
        V.clip.pos +
        '"></div>';
    if ($("atop"))
      $("atop").oninput = (e) => {
        V.opac = e.target.value / 100;
        e.target.nextElementSibling.textContent = e.target.value + " %";
        $("attr").classList.add("on");
        for (const p of V.parts)
          if (p.meta.systeme == "muscle") {
            const mt = p.mesh.material,
              tr = V.opac < 0.99;
            if (mt.transparent !== tr) mt.needsUpdate = true;
            mt.transparent = tr;
            mt.opacity = V.opac;
            mt.depthWrite = !tr;
          }
        need();
      };
    box.querySelectorAll(".atcax button").forEach(
      (b) =>
        (b.onclick = () => {
          V.clip.axis = b.dataset.a;
          box.querySelectorAll(".atcax button").forEach((x) => x.classList.toggle("on", x === b));
          box.querySelector(".atr").hidden = !V.clip.axis;
          clip();
        }),
    );
    if ($("atcp"))
      $("atcp").oninput = (e) => {
        V.clip.pos = +e.target.value;
        clip();
      };
  }
  function clip() {
    const a = V.clip.axis,
      P = V.clip.plane,
      on = !!a;
    if (on) {
      const n = { x: [-1, 0, 0], y: [0, -1, 0], z: [0, 0, -1] }[a];
      P.normal.set(...n);
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
    need();
  }
  $("attr").onclick = () => toolPanel("tr");
  $("atcut").onclick = () => toolPanel("cut");

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
      const t2 = tip.clone().sub(head).applyQuaternion(tq).add(head);
      if (t2.y < tip.y) ang = -ang;
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
      else if (/^(right|left) lung$/.test(e)) p.br = { kind: "sc", k: 0.05 };
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

  // ---------- recherche ----------
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
        return { p, sc: fr.startsWith(t) ? 0 : fr.split(/[\s'’-]+/).some((w) => w.startsWith(words[0])) ? 1 : 2 };
      })
      .sort((a, b) => a.sc - b.sc || a.p.meta.fr.localeCompare(b.p.meta.fr, "fr", { numeric: true }))
      .filter((x) => !seen.has(x.p.meta.fr) && seen.add(x.p.meta.fr))
      .slice(0, 8)
      .map((x) => x.p);
  }
  function sugPaint() {
    const box = $("atsug");
    box.innerHTML = sug
      .map(
        (p, i) =>
          '<button role="option" data-i="' +
          i +
          '"' +
          (i === sugI ? ' class="on" aria-selected="true"' : "") +
          '><i style="background:#' +
          (ATL.colors[p.meta.systeme] || 0xcccccc).toString(16).padStart(6, "0") +
          '"></i><span>' +
          esc(p.meta.fr) +
          "</span><small>" +
          esc(ATL.sysFr[p.meta.systeme] || "") +
          "</small></button>",
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
      e.stopPropagation(); // ne ferme pas l'atlas
      if (!$("atq").value) return $("atq").blur();
      $("atq").value = "";
      sug = [];
      sugPaint();
    }
  };
  $("atq").onblur = () => setTimeout(() => $("atsug") && $("atsug").classList.remove("show"), 120);
  $("atq").onfocus = () => sug.length && sugPaint();
  // montrer une structure : on la réaffiche si besoin, on la sélectionne et on s'en approche
  function focusPart(p) {
    if (V.hSys.has(p.meta.systeme)) {
      V.hSys.delete(p.meta.systeme);
      sysBtns().forEach((b) => b.dataset.s == p.meta.systeme && b.classList.remove("off"));
    }
    V.hOne.delete(p);
    vis();
    select(p);
    const b = new T.Box3().setFromObject(p.mesh),
      c = b.getCenter(new T.Vector3()),
      r = Math.max(b.getSize(new T.Vector3()).length() / 2, 0.04),
      dir = camera.position.clone().sub(controls.target).normalize();
    moveCam(c.clone().addScaledVector(dir, fitDist(r * 1.5)), c);
  }

  // ---------- fiche d'une structure ----------
  function select(p) {
    if (V.sel) V.sel.mesh.material.emissive.setHex(0);
    V.sel = p;
    need();
    const pan = $("atpan");
    if (!p) {
      pan.classList.remove("show");
      return;
    }
    p.mesh.material.emissive.setHex(0x1d5f58);
    const f = V.fiches[p.meta.fiche];
    pan.innerHTML =
      '<button class="atpx" aria-label="Fermer la fiche">✕</button>' +
      '<small class="atpc">' +
      esc(f ? f.cat : ATL.sysFr[p.meta.systeme] || "") +
      "</small><h3>" +
      esc(p.meta.fr) +
      "</h3>" +
      (f && atNorm(f.titre) != atNorm(p.meta.fr) ? '<small class="atpf">Fiche : ' + esc(f.titre) + "</small>" : "") +
      (f
        ? '<p class="atpd">' +
          esc(f.desc) +
          "</p><dl>" +
          f.rows.map((r) => "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>").join("") +
          "</dl>" +
          (f.note ? '<div class="atpn"><b>À retenir</b>' + esc(f.note) + "</div>" : "")
        : '<p class="atpd">Pas encore de fiche pour cette structure.</p>') +
      '<small class="atpe">' +
      esc(p.meta.en || "") +
      '</small><div class="atpb">' +
      (f ? '<button class="b p" id="atfc">' + icn("cards") + " Créer des flashcards</button>" : "") +
      '<button class="b" id="athide">Masquer cette structure</button></div><div id="atfcs"></div>';
    pan.scrollTop = 0;
    pan.classList.add("show");
    pan.querySelector(".atpx").onclick = () => select(null);
    $("athide").onclick = () => {
      V.hOne.add(p);
      vis();
      select(null);
    };
    if ($("atfc")) $("atfc").onclick = () => atlasCardsForm(f);
  }

  // ---------- quiz 3D ----------
  const QN = 10;
  function quizStart() {
    if (V.breath.on) breathStop();
    select(null);
    const pool = V.parts.filter((p) => p.mesh.visible),
      seen = new Set(),
      list = [];
    for (const p of pool.sort(() => Math.random() - 0.5)) {
      if (list.length >= QN) break;
      if (seen.has(p.meta.fr)) continue;
      seen.add(p.meta.fr);
      list.push(p);
    }
    if (list.length < 3) return toast("Affiche au moins 3 structures pour lancer un quiz.");
    V.quiz = { list, i: 0, ok: 0, wait: false };
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
        '<div class="atqz"><b>Quiz terminé : ' +
        Q.ok +
        " / " +
        Q.list.length +
        "</b><small>" +
        (pc >= 80 ? "Excellent, tu maîtrises cette région." : pc >= 50 ? "Pas mal : refais-le pour ancrer les noms." : "Révise les fiches, puis retente.") +
        '</small></div><div class="atpb"><button class="b p" id="atqre">Recommencer</button><button class="b" id="atqend">Fermer</button></div>';
      $("atqre").onclick = quizStart;
      $("atqend").onclick = quizStop;
      return;
    }
    const p = Q.list[Q.i];
    box.innerHTML =
      '<div class="atqz' +
      (cls ? " " + cls : "") +
      '"><small>Question ' +
      (Q.i + 1) +
      " / " +
      Q.list.length +
      " · " +
      Q.ok +
      " bonne" +
      (Q.ok > 1 ? "s" : "") +
      "</small><b>" +
      (msg || "Touche : " + esc(p.meta.fr)) +
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
    setTimeout(() => {
      if (V.quiz !== Q) return;
      want.mesh.material.emissive.setHex(0);
      if (hit) hit.mesh.material.emissive.setHex(0);
      Q.wait = false;
      Q.i++;
      need();
      if (Q.i >= Q.list.length) quizSave(Q);
      quizPaint();
    }, good ? 900 : 1800);
  }
  function quizSave(Q) {
    S.atq = S.atq || { hist: [] };
    S.atq.hist.push({ d: day(), t: Date.now(), m: model.id, n: Q.list.length, ok: Q.ok });
    if (S.atq.hist.length > 300) S.atq.hist = S.atq.hist.slice(-300);
    save();
  }
  function quizStop() {
    V.quiz = null;
    $("atqz").classList.remove("on");
    $("atlbl").hidden = !V.showLbl;
    quizPaint();
    need();
  }
  $("atqz").onclick = () => (V.quiz ? quizStop() : quizStart());

  // ---------- toucher ----------
  const ray = new T.Raycaster(),
    ptr = new T.Vector2();
  let down = null;
  canvas.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(
        V.parts.filter((p) => p.mesh.visible).map((p) => p.mesh),
        false,
      ),
      hit = hits.find((h) => !V.clip.axis || V.clip.plane.distanceToPoint(h.point) >= 0),
      p = hit ? hit.object.userData.part : null;
    if (V.quiz) return p && quizAnswer(p);
    select(p);
  });

  // ---------- étiquettes des repères ----------
  const lray = new T.Raycaster(),
    wp = new T.Vector3(),
    sp = new T.Vector3();
  function labels() {
    if (!V.showLbl || V.quiz || !V.labels.length) return;
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    for (const Lb of V.labels) {
      let show = Lb.p.mesh.visible;
      if (show) {
        Lb.p.mesh.localToWorld(wp.copy(Lb.local));
        sp.copy(wp).project(camera);
        show = sp.z <= 1 && (!V.clip.axis || V.clip.plane.distanceToPoint(wp) >= 0);
      }
      if (show !== Lb.shown) {
        Lb.el.style.display = show ? "" : "none";
        Lb.shown = show;
      }
      if (show) Lb.el.style.transform = "translate(" + Math.round(((sp.x + 1) / 2) * w) + "px," + Math.round(((1 - sp.y) / 2) * h) + "px)";
    }
  }
  function occlusion() {
    if (ATL.v !== V || !V.showLbl || !V.labels.length || V.breath.on) return;
    const visM = V.parts.filter((x) => x.mesh.visible).map((x) => x.mesh);
    for (const Lb of V.labels) {
      if (!Lb.p.mesh.visible) continue;
      Lb.p.mesh.localToWorld(wp.copy(Lb.local));
      const d = camera.position.distanceTo(wp);
      lray.set(camera.position, wp.clone().sub(camera.position).normalize());
      lray.far = d;
      const hit = lray.intersectObjects(visM, false).find((h) => !V.clip.axis || V.clip.plane.distanceToPoint(h.point) >= 0);
      Lb.el.classList.toggle("occ", !!(hit && hit.object !== Lb.p.mesh && hit.distance < d - 0.01));
    }
  }

  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
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
    controls.update(); // déclenche « change » tant que l'inertie de rotation continue
    if (!V.dirty) return;
    V.dirty = false;
    renderer.render(scene, camera);
    labels();
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
  toast("Envoi du modèle…", 1);
  const { error } = await SY.sb.storage
    .from("atlas")
    // le type est forcé : Windows et iOS ne reconnaissent pas les .glb (sinon refus « mime type not supported »)
    .upload(id + ".glb", new Blob([f], { type: "model/gltf-binary" }), { upsert: true, contentType: "model/gltf-binary", cacheControl: "60" });
  if (error) return toast(esc(syTr(error.message)));
  toast("Modèle mis à jour ✔");
  atlasOpen(id);
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
  const box = $("atfcs");
  if (!box) return;
  let last = "";
  try {
    last = localStorage.getItem("mr_atlas_ch") || "";
  } catch (e) {}
  const opts = S.mat
    .map((m) => {
      const cc = S.chap.filter((c) => c.mid === m.id);
      return cc.length
        ? '<optgroup label="' + esc(m.nom) + '">' + cc.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === last ? " selected" : "") + ">" + esc(c.titre) + "</option>").join("") + "</optgroup>"
        : "";
    })
    .join("");
  const n = atlasCardsOf(f).length;
  box.innerHTML =
    '<div class="atfcf"><label for="atch">Ajouter ' +
    n +
    " flashcard" +
    (n > 1 ? "s" : "") +
    ' dans le chapitre :</label><select id="atch">' +
    '<option value="__new">➕ Nouveau chapitre « Thorax » (UE Atlas 3D)</option>' +
    opts +
    '</select><div class="atpb"><button class="b p" id="atfcok">Ajouter</button><button class="b" id="atfcno">Annuler</button></div></div>';
  if (last && S.chap.some((c) => c.id === last)) $("atch").value = last;
  $("atfcno").onclick = () => (box.innerHTML = "");
  $("atfcok").onclick = () => {
    let ch = $("atch").value;
    if (ch === "__new") {
      let m = S.mat.find((x) => x.nom === "Atlas 3D");
      if (!m) S.mat.push((m = { id: uid(), ic: "bone", nom: "Atlas 3D", prof: "", couleur: "#2f5d62" }));
      let c = S.chap.find((x) => x.mid === m.id && x.titre === "Thorax");
      if (!c) S.chap.push((c = { id: uid(), mid: m.id, titre: "Thorax", prof: "", info: "Fiches de l’atlas 3D" }));
      ch = c.id;
    }
    const have = new Set(S.cards.filter((c) => c.ch === ch).map((c) => c.recto)),
      add = atlasCardsOf(f).filter((c) => !have.has(c.recto));
    add.forEach((c) => S.cards.push({ id: uid(), ch, recto: c.recto, verso: c.verso, img: "" }));
    try {
      localStorage.setItem("mr_atlas_ch", ch);
    } catch (e) {}
    save();
    box.innerHTML = "";
    toast(add.length ? add.length + " flashcard" + (add.length > 1 ? "s" : "") + " ajoutée" + (add.length > 1 ? "s" : "") + " ✔" : "Ces flashcards sont déjà dans ce chapitre");
  };
}
