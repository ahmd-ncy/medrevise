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
    '<div id="atlbl"></div>' +
    '<aside id="atpan" aria-live="polite"></aside>' +
    '<div class="atb abot"><div class="atr"><label for="atex">Écarter les structures</label><input id="atex" type="range" min="0" max="100" value="0"><span id="atp">0 %</span></div>' +
    '<div class="atsys">' +
    Object.keys(ATL.sysFr)
      .map((s) => '<button data-s="' + s + '"><i style="background:#' + ATL.colors[s].toString(16) + '"></i>' + (s == "os" ? "Os" : s == "cartilage" ? "Cartilages" : "Muscles") + "</button>")
      .join("") +
    '<button id="atlab" class="on" title="Afficher ou masquer les noms des repères">Étiquettes</button>' +
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
  Object.assign(V, { renderer, controls, parts: [], labels: [], fiches: {}, radius: 0.3, anim: null, sel: null, hSys: new Set(), hOne: new Set(), showLbl: true, frame: 0 });

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
      V.fiches = (g.asset && g.asset.extras && g.asset.extras.fiches) || {};
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
        if (x.repere) {
          o.geometry.computeBoundingBox();
          const el = document.createElement("button");
          el.className = "atlb";
          el.innerHTML = '<i style="background:#' + (ATL.colors[x.systeme] || 0xcccccc).toString(16) + '"></i>' + esc(x.repere);
          el.onclick = () => select(p);
          $("atlbl").appendChild(el);
          V.labels.push({ p, el, local: o.geometry.boundingBox.getCenter(new T.Vector3()), occ: false });
        }
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
  $("atlab").onclick = (e) => {
    V.showLbl = !V.showLbl;
    e.currentTarget.classList.toggle("on", V.showLbl);
    $("atlbl").hidden = !V.showLbl;
  };
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
    const pan = $("atpan");
    if (!p) {
      pan.classList.remove("show");
      return;
    }
    p.mesh.material.emissive.setHex(0x1d5f58);
    const f = V.fiches[p.meta.fiche];
    pan.innerHTML =
      '<button class="atpx" aria-label="Fermer la fiche">✕</button>' +
      "<small class=\"atpc\">" +
      esc(f ? f.cat : ATL.sysFr[p.meta.systeme] || "") +
      "</small><h3>" +
      esc(p.meta.fr) +
      "</h3>" +
      (f && f.titre.toLowerCase() != p.meta.fr.toLowerCase() ? '<small class="atpf">Fiche : ' + esc(f.titre) + "</small>" : "") +
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
  // étiquettes des repères : suivent le modèle, estompées quand la structure est cachée par une autre
  const lray = new T.Raycaster(),
    wp = new T.Vector3(),
    sp = new T.Vector3();
  function labels() {
    if (!V.showLbl || !V.labels.length) return;
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      check = V.frame++ % 8 === 0,
      vis = check ? V.parts.filter((x) => x.mesh.visible).map((x) => x.mesh) : null;
    for (const L of V.labels) {
      if (!L.p.mesh.visible) {
        L.el.style.display = "none";
        continue;
      }
      L.p.mesh.localToWorld(wp.copy(L.local));
      sp.copy(wp).project(camera);
      if (sp.z > 1) {
        L.el.style.display = "none";
        continue;
      }
      if (check) {
        lray.set(camera.position, wp.clone().sub(camera.position).normalize());
        const hit = lray.intersectObjects(vis, false)[0];
        L.occ = !!(hit && hit.object !== L.p.mesh && hit.distance < camera.position.distanceTo(wp) - 0.01);
      }
      L.el.style.display = "";
      L.el.classList.toggle("occ", L.occ);
      L.el.style.transform = "translate(" + ((sp.x + 1) / 2) * w + "px," + ((1 - sp.y) / 2) * h + "px)";
    }
  }
  renderer.setAnimationLoop((now) => {
    if (V.anim) V.anim(now);
    controls.update();
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
