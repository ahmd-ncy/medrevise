// ================= Atlas 3D =================
// Modèles anatomiques en 3D (BodyParts3D), ouverts depuis la page Cours.
// Un seul fichier .glb par modèle, dans l'espace privé « atlas » de Supabase, partagé par tous :
// la base ne le donne qu'à l'administrateur et aux membres à qui il a ouvert l'accès (voir supabase.sql).
// Une copie est gardée sur l'appareil (cache « mr-atlas ») pour l'ouvrir hors connexion ; elle est effacée si l'accès est retiré.
const ATL = {
  models: [{ id: "thorax", titre: "Thorax", sous: "Os, cartilages et muscles · 92 structures" }],
  cache: "mr-atlas",
  colors: { os: 0xe8dcc4, cartilage: 0xaacddc, muscle: 0xc4483c },
  sysFr: { os: "Os", cartilage: "Cartilage", muscle: "Muscle" },
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
  d.innerHTML =
    '<canvas id="atc"></canvas>' +
    '<div class="atb atop"><button class="atx" onclick="atlasClose()" aria-label="Fermer">✕</button><b>' +
    esc(m.titre) +
    '</b><div class="atv">' +
    [["front", "Face"], ["back", "Dos"], ["side", "Profil"], ["persp", "3/4"]]
      .map((v, i) => '<button data-v="' + v[0] + '"' + (i ? "" : ' class="on"') + ">" + v[1] + "</button>")
      .join("") +
    "</div></div>" +
    '<div id="atcard" class="atb"><b id="atn"></b><small id="ats"></small><button class="b" id="athide">Masquer cette structure</button></div>' +
    '<div class="atb abot"><div class="atr"><label for="atex">Écarter les structures</label><input id="atex" type="range" min="0" max="100" value="0"><span id="atp">0 %</span></div>' +
    '<div class="atsys">' +
    Object.keys(ATL.sysFr)
      .map((s) => '<button data-s="' + s + '"><i style="background:#' + ATL.colors[s].toString(16) + '"></i>' + (s == "os" ? "Os" : s == "cartilage" ? "Cartilages" : "Muscles") + "</button>")
      .join("") +
    '<button id="atall">Tout réafficher</button>' +
    (SY.role == "admin" ? '<button id="atup" title="Remplacer le fichier .glb partagé">Mettre à jour…</button>' : "") +
    "</div></div>" +
    '<div id="atmsg">Chargement du modèle…</div>' +
    '<small id="atcr">BodyParts3D © DBCLS · CC BY 4.0</small>' +
    '<input type="file" id="atfile" hidden>';
  document.body.appendChild(d);
  document.documentElement.classList.add("atlon");
  ATL.v = { id, alive: true };
  ATL.key = (e) => e.key === "Escape" && atlasClose();
  addEventListener("keydown", ATL.key);
  if ($("atup")) {
    $("atup").onclick = () => $("atfile").click();
    $("atfile").onchange = (e) => atlasUpload(id, e.target.files[0]);
  }
  try {
    const [lib, buf] = await Promise.all([atlasLib(), atlasFile(id)]);
    if (!ATL.v || ATL.v.id !== id || !ATL.v.alive) return;
    atlasView(lib, buf);
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

// ---------- visualiseur ----------
function atlasView(L, buf) {
  const T = L.THREE,
    V = ATL.v,
    canvas = $("atc"),
    renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(35, 1, 0.01, 50),
    controls = new L.OrbitControls(camera, canvas);
  scene.background = new T.Color(0x0e1116);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  scene.add(new T.HemisphereLight(0xffffff, 0x334455, 1.6));
  const key = new T.DirectionalLight(0xffffff, 2.2);
  key.position.set(1, 2, 3);
  camera.add(key);
  scene.add(camera);
  Object.assign(V, { renderer, controls, parts: [], radius: 0.3, anim: null, sel: null, hSys: new Set(), hOne: new Set() });

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
      V.radius = box.getSize(new T.Vector3()).length() / 2;
      root.traverse((o) => {
        if (!o.isMesh) return;
        let n = o,
          x = null;
        while (n && !(x = n.userData && n.userData.fr ? n.userData : null)) n = n.parent;
        if (!x) return;
        if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
        o.material = new T.MeshStandardMaterial({ color: ATL.colors[x.systeme] || 0xcccccc, roughness: 0.65, metalness: 0 });
        const c = new T.Box3().setFromObject(o).getCenter(new T.Vector3()),
          p = { mesh: o, base: o.position.clone(), dir: o.parent.worldToLocal(c.clone()).sub(o.parent.worldToLocal(new T.Vector3())), meta: x };
        o.userData.part = p;
        V.parts.push(p);
      });
      setView("front", false);
      if ($("atmsg")) $("atmsg").remove();
    },
    (e) => {
      if ($("atmsg")) $("atmsg").textContent = "Fichier 3D illisible : " + (e && e.message ? e.message : "erreur");
    },
  );

  // vues
  const VIEWS = { front: [0, 0, 1], back: [0, 0, -1], side: [1, 0, 0], persp: [0.8, 0.35, 0.9] };
  function setView(v, smooth = true) {
    const vf = T.MathUtils.degToRad(camera.fov / 2),
      hf = Math.atan(Math.tan(vf) * camera.aspect),
      d = new T.Vector3(...VIEWS[v]).normalize().multiplyScalar((V.radius / Math.sin(Math.min(vf, hf))) * 0.95);
    if (!smooth) {
      camera.position.copy(d);
      controls.target.set(0, 0, 0);
      return;
    }
    const from = camera.position.clone(),
      t0 = performance.now(),
      zero = new T.Vector3();
    V.anim = (now) => {
      const k = Math.min(1, (now - t0) / 450),
        e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(from, d, e);
      controls.target.lerp(zero, e);
      if (k === 1) V.anim = null;
    };
  }
  document.querySelectorAll("#atl .atv button").forEach(
    (b) =>
      (b.onclick = () => {
        document.querySelectorAll("#atl .atv button").forEach((x) => x.classList.toggle("on", x === b));
        setView(b.dataset.v);
      }),
  );

  // éclatement
  $("atex").oninput = (e) => {
    const f = e.target.value / 100;
    $("atp").textContent = e.target.value + " %";
    for (const p of V.parts) p.mesh.position.copy(p.base).addScaledVector(p.dir, f * 1.2);
  };

  // systèmes et structures masquées
  const vis = () => {
    for (const p of V.parts) p.mesh.visible = !V.hSys.has(p.meta.systeme) && !V.hOne.has(p);
    if (V.sel && !V.sel.mesh.visible) select(null);
  };
  document.querySelectorAll("#atl .atsys button[data-s]").forEach(
    (b) =>
      (b.onclick = () => {
        const s = b.dataset.s;
        V.hSys.has(s) ? V.hSys.delete(s) : V.hSys.add(s);
        b.classList.toggle("off", V.hSys.has(s));
        vis();
      }),
  );
  $("atall").onclick = () => {
    V.hSys.clear();
    V.hOne.clear();
    document.querySelectorAll("#atl .atsys button").forEach((b) => b.classList.remove("off"));
    vis();
  };

  // sélection au toucher
  const ray = new T.Raycaster(),
    ptr = new T.Vector2();
  function select(p) {
    if (V.sel) V.sel.mesh.material.emissive.setHex(0);
    V.sel = p;
    const card = $("atcard");
    if (!p) return card.classList.remove("show");
    p.mesh.material.emissive.setHex(0x1d5f58);
    $("atn").textContent = p.meta.fr;
    $("ats").textContent = (ATL.sysFr[p.meta.systeme] || "") + (p.meta.en ? " · " + p.meta.en : "");
    card.classList.add("show");
  }
  $("athide").onclick = () => {
    if (V.sel) {
      V.hOne.add(V.sel);
      vis();
      select(null);
    }
  };
  let down = null;
  canvas.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(
      V.parts.filter((p) => p.mesh.visible).map((p) => p.mesh),
      false,
    )[0];
    select(hit ? hit.object.userData.part : null);
  });

  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  V.resize = resize;
  addEventListener("resize", resize);
  resize();
  renderer.setAnimationLoop((now) => {
    if (V.anim) V.anim(now);
    controls.update();
    renderer.render(scene, camera);
  });
}

// ---------- fermeture : on libère la mémoire graphique ----------
function atlasClose() {
  const V = ATL.v;
  ATL.v = null;
  if (V) {
    V.alive = false;
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
