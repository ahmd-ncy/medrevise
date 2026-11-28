// ================= Atlas 3D =================
// Modèles anatomiques en 3D (BodyParts3D, Z-Anatomy), dans la page Atlas (/atlas, /atlas/<modèle>).
// Un seul fichier .glb par modèle, dans l'espace privé « atlas » de Supabase, partagé par tous :
// la base ne le donne qu'à l'administrateur et aux membres à qui il a ouvert l'accès (voir supabase.sql).
// Une copie est gardée sur l'appareil (cache « mr-atlas ») pour l'ouvrir hors connexion ; elle est effacée si l'accès est retiré.
const ATL = {
  // modèles : « detail » relie les fiches d'un modèle à un modèle plus détaillé (bouton « Voir en détail »)
  models: [
    { id: "thorax", cat: "region", titre: "Thorax", sous: "Os, muscles, organes, vaisseaux, nerfs et médiastin" },
    { id: "coeur", cat: "organe", titre: "Cœur", sous: "Cavités, valves, piliers, coronaires et veines du cœur" },
    { id: "poumons", cat: "organe", titre: "Poumons et arbre bronchique", sous: "Lobes, bronches jusqu’aux segments, plèvre et vaisseaux" },
    { id: "abdomen", cat: "region", titre: "Abdomen", sous: "Viscères, segments du foie, vaisseaux, paroi, plexus lombal" },
    { id: "membre-inf", cat: "region", titre: "Membre inférieur", sous: "Os de la hanche au pied, muscles par loges, nerfs fémoral et ischiatique, vaisseaux" },
    { id: "membre-sup", cat: "region", titre: "Membre supérieur", sous: "Os de l’épaule à la main, muscles par loges, plexus brachial, nerfs, vaisseaux" },
    { id: "tete-cou", cat: "region", titre: "Tête et cou", sous: "Crâne, face, muscles masticateurs et du cou, larynx, thyroïde, carotides, jugulaires" },
    { id: "encephale", cat: "organe", titre: "Encéphale", sous: "Lobes et gyri, noyaux gris, ventricules, tronc cérébral, cervelet, nerfs crâniens, polygone de Willis" },
    { id: "rachis", cat: "region", titre: "Rachis et dos", sous: "Vertèbres une à une, disques, ligaments, moelle spinale, muscles du dos par couches" },
    { id: "bassin", cat: "region", titre: "Bassin et périnée", sous: "Os coxaux, sacrum, plancher pelvien, vessie, prostate, organes génitaux masculins, vaisseaux iliaques" },
    { id: "oeil", cat: "organe", titre: "Œil et orbite", sous: "Globe oculaire, muscles oculomoteurs, appareil lacrymal, nerfs et vaisseaux de l’orbite" },
    { id: "oreille", cat: "organe", titre: "Oreille", sous: "Tympan, osselets, trompe auditive, cochlée, vestibule et nerfs VII et VIII" },
    { id: "bouche", cat: "region", titre: "Cavité buccale et dents", sous: "Les 32 dents (numérotation FDI), gencive, langue, voile du palais, amygdales, glandes salivaires, pharynx" },
    { id: "nez", cat: "region", titre: "Cavité nasale et sinus", sous: "Cloison, cornets, sinus frontal, sphénoïdal, maxillaire et cellules ethmoïdales, vaisseaux du nez" },
    { id: "endocrine", cat: "corps", titre: "Glandes endocrines", sous: "Hypophyse, pinéale, thyroïde, parathyroïdes, thymus, surrénales, pancréas, gonades" },
    { id: "lymphe", cat: "corps", titre: "Système lymphatique", sous: "Nœuds lymphatiques par région, rate, thymus, amygdales" },
    { id: "bassin-f", cat: "region", titre: "Bassin féminin", sous: "Utérus, col, vagin, trompes, ovaires et ligaments, vessie, rectum, vaisseaux utérins (Visible Human)" },
    { id: "foie", cat: "organe", titre: "Foie et voies biliaires", sous: "Les 8 segments de Couinaud, pédicule hépatique, veines hépatiques, vésicule et voies biliaires" },
    { id: "rein", cat: "organe", titre: "Rein", sous: "Cortex, pyramides, papilles, colonnes, calices, bassinet, hile et vaisseaux" },
    { id: "larynx", cat: "organe", titre: "Larynx", sous: "Cartilages, membranes, muscles intrinsèques et extrinsèques, thyroïde" },
    { id: "sein", cat: "organe", titre: "Sein", sous: "Lobes de la glande mammaire, conduits et sinus lactifères, mamelon et aréole" },
    { id: "epaule", cat: "organe", titre: "Épaule", sous: "Articulations gléno-humérale, acromio- et sterno-claviculaire, coiffe des rotateurs, bourses" },
    { id: "main", cat: "organe", titre: "Main et poignet", sous: "Os du carpe, ligaments du poignet, gaines des tendons, muscles thénariens et hypothénariens, arcades" },
    { id: "genou", cat: "organe", titre: "Genou", sous: "Ménisques, ligaments croisés et collatéraux, capsule, bourses, muscles et vaisseaux poplités" },
    { id: "corps", cat: "corps", titre: "Corps entier", sous: "Squelette, muscles, organes, vaisseaux et nerfs du corps entier (plus de 1 000 structures)" },
    { id: "cellule", cat: "micro", titre: "Cellule animale", sous: "Membrane, noyau et nucléole, réticulums, Golgi, mitochondries, lysosomes, centrosome, cytosquelette" },
    { id: "mitochondrie", cat: "micro", titre: "Mitochondrie", sous: "Membranes externe et interne, crêtes, ATP synthases, matrice, ADN mitochondrial" },
    { id: "neurone", cat: "micro", titre: "Neurone", sous: "Corps cellulaire, corps de Nissl, dendrites, cône d’implantation, axone myélinisé, nœuds de Ranvier, boutons" },
    { id: "sarcomere", cat: "micro", titre: "Sarcomère et myofibrille", sous: "Actine, myosine, titine, stries Z, ligne M, bandes A et I, réticulum sarcoplasmique, tubules T" },
    { id: "nephron", cat: "micro", titre: "Néphron", sous: "Glomérule, capsule de Bowman, tubes proximal et distal, anse de Henlé, tube collecteur, macula densa" },
    { id: "alveole", cat: "micro", titre: "Alvéoles pulmonaires", sous: "Bronchioles, sacs alvéolaires, pneumocytes, capillaires, macrophage" },
    { id: "villosite", cat: "micro", titre: "Villosités intestinales", sous: "Entérocytes, cellules caliciformes, capillaires, chylifère, cryptes de Lieberkühn" },
    { id: "peau", cat: "micro", titre: "Peau en coupe", sous: "Épiderme, derme, hypoderme, poil, glandes sébacée et sudoripare, récepteurs, vaisseaux" },
    { id: "dent", cat: "micro", titre: "Dent en coupe", sous: "Émail, dentine, pulpe, cément, ligament alvéolo-dentaire, os alvéolaire, gencive" },
  ],
  detail: {
    foie: ["liver", "liver segments", "gallbladder", "portal vein", "proper hepatic artery", "bile duct"],
    rein: ["kidney", "renal pelvis", "renal artery", "renal vein"],
    larynx: ["larynx", "thyroid cartilage", "laryngeal cartilages"],
    epaule: ["glenohumeral joint", "supraspinatus", "infraspinatus", "teres minor", "subscapularis"],
    main: ["carpal bones", "metacarpals", "thenar", "hypothenar", "flexor retinaculum"],
    genou: ["patella", "menisci", "cruciate ligaments"],
    oeil: ["eyeball", "retina", "cornea"],
    bouche: ["tongue", "salivary glands", "mandible"],
    coeur: ["right atrium", "left atrium", "right ventricle", "left ventricle", "ascending aorta", "pulmonary trunk", "superior vena cava", "inferior vena cava"],
    poumons: ["rul", "rml", "rll", "lul", "lll", "right lung", "left lung", "main bronchus", "trachea", "pleura", "pulmonary artery", "pulmonary veins"],
  },
  cats: [["corps", "Corps entier"], ["region", "Régions"], ["organe", "Organes et articulations"], ["micro", "Microscopique : cellules et tissus"]],
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
  "membre-inf": '<path d="M10 3c-1 3-1 6 0 9l-.5 5c-.3 2-.5 3 .5 4h5c1 0 1-1 0-1.5l-2-1.5.5-6c1-3 1-6 0-9"/><path d="M10 12h3"/>',
  "membre-sup": '<path d="M9 3c-1 2-1 4 0 6l1 5-1 4c-.5 2 .5 3 2 3h2c1 0 2-1 1.5-2.5L13 15l1-5c1-2 1-4 0-7"/><path d="M10 9h4"/>',
  "tete-cou": '<path d="M12 3c-3.3 0-5.5 2.4-5.5 5.6 0 2 .8 3.6 2 4.6V16c0 1 .8 1.6 1.6 1.6h3.8c.8 0 1.6-.6 1.6-1.6v-2.8c1.2-1 2-2.6 2-4.6C17.5 5.4 15.3 3 12 3z"/><path d="M10 17.6V21M14 17.6V21M9.5 9.5h.01M14.5 9.5h.01"/>',
  encephale: '<path d="M12 5c-1-1.5-4-1.8-5.3.2C4.8 5.6 4 7.6 4.8 9.3 3.6 10.5 3.8 13 5.4 13.8c-.2 1.8 1.3 3.2 3 3 .8 1.3 2.6 1.6 3.6.6 1 1 2.8.7 3.6-.6 1.7.2 3.2-1.2 3-3 1.6-.8 1.8-3.3.6-4.5.8-1.7 0-3.7-1.9-4.1C16 3.2 13 3.5 12 5z"/><path d="M12 5v12.4M12 9c-1.4 0-2.4-.8-3-1.8M12 12.5c1.4 0 2.6-.8 3.2-2"/>',
  rachis: '<path d="M12 3v18"/><rect x="9.5" y="3.5" width="5" height="2.6" rx="1"/><rect x="9.3" y="7.4" width="5.4" height="2.6" rx="1"/><rect x="9.1" y="11.3" width="5.8" height="2.8" rx="1"/><rect x="8.9" y="15.4" width="6.2" height="2.8" rx="1"/>',
  bassin: '<path d="M4 6c0 5 2 8 5 9l1 4h4l1-4c3-1 5-4 5-9-2 1-4 1-6-.5-1 .8-1.5 1.5-2 3-.5-1.5-1-2.2-2-3C8 7 6 7 4 6z"/><circle cx="8" cy="15" r="1.6"/><circle cx="16" cy="15" r="1.6"/>',
  oeil: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  oreille: '<path d="M8 17c0 2 1.5 3.5 3.5 3.5S15 19 15 17c0-2 3-3.5 3-8A6 6 0 0 0 6 9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2.5-2.5 4.5"/>',
  "bouche": '<path d="M4 10c2-3 5-4 8-4s6 1 8 4c-1 5-4 8-8 8s-7-3-8-8z"/><path d="M7 10.5h10M9 10.5v2M12 10.5v2.2M15 10.5v2"/>',
  "nez": '<path d="M12 4c-.5 4-2 7-4.5 10.5C6.5 16 7.5 18 9.5 18c1 0 1.7-.6 2.5-.6s1.5.6 2.5.6c2 0 3-2 2-3.5C14 11 12.5 8 12 4z"/><path d="M10 15.5h.01M14 15.5h.01"/>',
  "endocrine": '<path d="M12 3.5v3M9 9c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5-1.3 2-3 2-3-.5-3-2z"/><path d="M8 14h8M7 18c1.5 1 3 1.5 5 1.5s3.5-.5 5-1.5"/>',
  "lymphe": '<path d="M12 3v18M12 7l-5 4M12 7l5 4M12 13l-4 5M12 13l4 5"/><circle cx="7" cy="11" r="1.4"/><circle cx="17" cy="11" r="1.4"/><circle cx="8" cy="18" r="1.4"/><circle cx="16" cy="18" r="1.4"/>',
  "bassin-f": '<path d="M12 6c-2 0-3.5 1.5-3.5 4 0 2 1 3.5 2.2 4.5V19h2.6v-4.5c1.2-1 2.2-2.5 2.2-4.5 0-2.5-1.5-4-3.5-4z"/><path d="M8.5 8.5C7 7 5 6.5 4 8M15.5 8.5C17 7 19 6.5 20 8"/><circle cx="4.5" cy="9.5" r="1.3"/><circle cx="19.5" cy="9.5" r="1.3"/>',
  "foie": '<path d="M3.5 9c0-2 2-3.5 6-3.5 4.5 0 11 1 11 3.5 0 3-4 7-9 8.5-3.5 1-8-3-8-8.5z"/><path d="M10 6v9"/>',
  "rein": '<path d="M14 4c-4-1-8 2-8 8s4 9 8 8c2-.5 2.5-2.5 1-4-1-1-1-3 0-4 1.5-1.5 1-3.5-1-4-1.5-.5-1-3.5 0-4z"/><path d="M14 12h4v6"/>',
  "larynx": '<path d="M8 4h8M9 4l-1 6h8l-1-6M8 10l1 4h6l1-4M9.5 14v6M14.5 14v6M9.5 17h5"/>',
  "sein": '<path d="M4 9c1 6 5 10 9 10 4 0 7-3 7-7"/><circle cx="13" cy="13" r="2"/>',
  "epaule": '<circle cx="9" cy="9" r="3.5"/><path d="M4 5c3-2 9-2 15 0M9 12.5V21M12.5 9l7 2"/>',
  "main": '<path d="M8 21v-4l-3-5c-.5-1 .5-2 1.5-1.5L8 12V4.5a1.2 1.2 0 0 1 2.4 0V10V3.5a1.2 1.2 0 0 1 2.4 0V10V4.5a1.2 1.2 0 0 1 2.4 0V11V7a1.2 1.2 0 0 1 2.4 0v7c0 3-1.5 5-3 7"/>',
  "genou": '<path d="M9 3v7c0 1.5-1 2-1 3.5S9 16 9 17v4M15 3v7c0 1.5 1 2 1 3.5S15 16 15 17v4"/><circle cx="12" cy="11.5" r="2.2"/>',
  "corps": '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M8 9.5l4 1.5 4-1.5M12 14l-3 7M12 14l3 7"/>',
  "cellule": '<ellipse cx="12" cy="12" rx="9" ry="7.5"/><circle cx="11" cy="11.5" r="3"/><circle cx="11.6" cy="11" r="1"/><path d="M16.5 15.5c1 .3 1.8-.2 2-1"/>',
  "mitochondrie": '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M7 9v4M10 15v-4M13 9v4M16 15v-4"/>',
  "neurone": '<circle cx="7" cy="10" r="2.5"/><path d="M5 8 3 5M5 12l-2 3M8.5 7.8 9 4M9.5 10H20M14 10v0M13 10l0 0M20 10l1.5-2M20 10l1.5 2"/><path d="M12 9h2M15.5 9h2" stroke-width="3"/>',
  "sarcomere": '<path d="M4 5v14M20 5v14M12 6v12M4 9h6M4 15h6M14 9h6M14 15h6M8 12h8"/>',
  "nephron": '<circle cx="7" cy="6" r="2.5"/><path d="M9 7c3 0 3 3 0 4s0 3 3 3v6h3V8c0-2 2-3 3-3"/>',
  "alveole": '<path d="M3 12h6"/><circle cx="12" cy="8" r="2.6"/><circle cx="16.5" cy="11" r="2.6"/><circle cx="12" cy="14.5" r="2.6"/><circle cx="17" cy="16.5" r="2.2"/>',
  "villosite": '<path d="M3 20h18M5 20V11a2 2 0 0 1 4 0v9M10 20V8a2 2 0 0 1 4 0v12M15 20v-8a2 2 0 0 1 4 0v8"/>',
  "peau": '<path d="M3 7c3-1.5 6 1.5 9 0s6-1.5 9 0M3 7v12h18V7M3 11h18M3 15h18M9 4v11"/>',
  "dent": '<path d="M6 4c2-1 4 0 6 0s4-1 6 0c2 2 1 6 0 8l-1.5 8c-.3 1.5-2 1.5-2.3 0L13 14h-2l-1.2 6c-.3 1.5-2 1.5-2.3 0L6 12C5 10 4 6 6 4z"/>',
  abdomen: '<path d="M7 4c-2 3-3 6-3 9a8 8 0 0 0 16 0c0-3-1-6-3-9"/><path d="M9 10c1.5 1 4.5 1 6 0M8.5 14c2 1.5 5 1.5 7 0"/><circle cx="12" cy="17.5" r=".8"/>',
  poumons: '<path d="M12 3v8M12 11c-1.5 0-2.5 1-3.5 2M12 11c1.5 0 2.5 1 3.5 2"/><path d="M9 7c-3 1-5 5-5 10 0 2 1.5 3 3 3s2-1 2-3zM15 7c3 1 5 5 5 10 0 2-1.5 3-3 3s-2-1-2-3z"/>',
};
// longueur réelle (en mètres) écrite dans l'unité qui convient : nm, µm, mm ou cm
function atlasLen(m) {
  const f = (v, u) => String(v < 10 ? Math.round(v * 10) / 10 : Math.round(v)).replace(".", ",") + " " + u;
  return m < 1e-6 ? f(m * 1e9, "nm") : m < 1e-3 ? f(m * 1e6, "µm") : m < 0.01 ? f(m * 1e3, "mm") : f(m * 100, "cm");
}
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
  const r = await SY.sb.storage.from("atlas").list("", { limit: 200 });
  ATL.files = r.error ? [] : r.data || [];
  // tailles des dernières versions fabriquées : on voit tout de suite ce qui reste à envoyer
  if (SY.role == "admin" && !ATL.expect)
    try {
      ATL.expect = await (await fetch("atlas-tailles.json?v=" + (typeof APPV != "undefined" ? APPV : Date.now()), { cache: "no-store" })).json();
    } catch (e) {
      ATL.expect = {};
    }
  if (tab == "atlas" && !R.atl) {
    const g = $("atgal"),
      a = $("atadm"),
      u = $("atupd");
    if (g) g.innerHTML = atlasGallery();
    if (a) a.innerHTML = atlasAdminFiles();
    if (u) u.outerHTML = atlasUpdBar();
  }
}
// fichiers dont la version en ligne n'est pas la dernière fabriquée
function atlasPending() {
  if (!ATL.files || !ATL.expect) return [];
  return Object.keys(ATL.expect).filter((n) => {
    const f = ATL.files.find((x) => x.name == n);
    return !f || ((f.metadata && f.metadata.size) || 0) != ATL.expect[n];
  });
}
function atlasPendingText(L) {
  const by = {};
  L.forEach((n) => {
    const id = n.replace(/(-hd)?\.glb$/, ""),
      t = (ATL.models.find((m) => m.id == id) || { titre: id }).titre;
    (by[t] = by[t] || []).push(/-hd\.glb$/.test(n) ? "ordinateur" : "téléphone");
  });
  const E = Object.entries(by).map(([t, v]) => t + " (" + v.join(", ") + ")");
  return E.length > 6 ? E.slice(0, 5).join(", ") + " et " + (E.length - 5) + " autres atlas" : E.join(", ");
}
const ATL_FOLDER_INPUT = '<input type="file" webkitdirectory directory multiple hidden onchange="atlasUploadFolder(this.files)">';
function atlasUpdBar() {
  if (SY.role != "admin" || !ATL.expect) return '<div id="atupd"></div>';
  const L = atlasPending();
  if (!L.length) return '<div id="atupd"></div>';
  return (
    '<div id="atupd" class="atupd"><div><b>' + L.length + " fichier" + (L.length > 1 ? "s" : "") + " d’atlas à mettre à jour</b><small>" + esc(atlasPendingText(L)) + "</small></div>" +
    '<label class="b p">Mettre à jour…' + ATL_FOLDER_INPUT + "</label></div>"
  );
}
// envoi d'un dossier entier : on garde la version la plus récente de chaque fichier et on n'envoie que ce qui a changé
async function atlasUploadFolder(files) {
  const best = {};
  for (const f of files || []) {
    if (!/\.glb$/i.test(f.name)) continue;
    const k = f.name.toLowerCase();
    if (!best[k] || f.lastModified > best[k].lastModified) best[k] = f;
  }
  const todo = Object.values(best).filter((f) => {
    const on = (ATL.files || []).find((x) => x.name == f.name.toLowerCase());
    return !on || ((on.metadata && on.metadata.size) || 0) != f.size;
  });
  if (!Object.keys(best).length) return toast("Aucun fichier .glb dans ce dossier. Choisis « 1 - Atlas 3D à envoyer dans l’app » sur ton Bureau.");
  if (!todo.length) return toast("Tout est déjà à jour ✔");
  let ok = 0;
  for (let i = 0; i < todo.length; i++) {
    toast("Mise à jour " + (i + 1) + " / " + todo.length + " : " + esc(todo[i].name) + "…", 1);
    if (await atlasUpload(null, todo[i], null, true)) ok++;
  }
  toast(ok + " fichier" + (ok > 1 ? "s" : "") + " mis à jour" + (ok < todo.length ? " · " + (todo.length - ok) + " en erreur" : "") + " ✔");
  atlasFilesLoad();
}
const atlasHas = (id) => !ATL.files || ATL.files.some((f) => f.name == id + ".glb" || f.name == id + "-hd.glb");
// ---------- pathologies : un atlas existant ouvert sur un parcours, les zones atteintes teintées (« les ») ----------
const ATL_PATHO = [
  {
    id: "idm", base: "coeur", titre: "Infarctus du myocarde", sous: "Occlusion d’une artère coronaire et territoire du ventricule gauche privé de sang",
    steps: [
      { t: "Les artères coronaires", x: "Le cœur est nourri par deux coronaires nées de l’aorte : la droite et la gauche, qui se divise en interventriculaire antérieure (IVA) et circonflexe.", view: "front", sel: ["right coronary artery", "left coronary artery", "anterior interventricular artery", "circumflex artery"] },
      { t: "L’occlusion de l’IVA", x: "Une plaque d’athérome se rompt, un caillot bouche l’artère : c’est l’IVA qui est le plus souvent en cause.", view: "front", sel: ["anterior interventricular artery"] },
      { t: "Le territoire atteint", x: "Sans sang, le myocarde meurt en quelques heures : ici la paroi antérieure du ventricule gauche, la pointe et les deux tiers antérieurs du septum (infarctus antérieur étendu).", view: "front", sel: ["anterior interventricular artery"], les: ["left ventricle"] },
      { t: "Les signes", x: "Douleur thoracique constrictive, irradiant au bras gauche et à la mâchoire, plus de 20 minutes, résistante à la trinitrine. ECG : sus-décalage du segment ST en V1 à V4. Troponine élevée.", view: "q34", sel: ["anterior interventricular artery"], les: ["left ventricle"] },
      { t: "Et si c’est la coronaire droite ?", x: "Infarctus inférieur (sus-décalage en DII, DIII, aVF), parfois avec troubles de conduction car elle vascularise souvent le nœud atrio-ventriculaire.", view: "back", sel: ["right coronary artery"], les: ["right ventricle"] },
    ],
  },
  {
    id: "avc", base: "encephale", titre: "AVC sylvien gauche", sous: "Occlusion de l’artère cérébrale moyenne : hémiplégie droite et aphasie",
    steps: [
      { t: "L’artère cérébrale moyenne", x: "Branche terminale de la carotide interne, elle vascularise la face latérale de l’hémisphère, l’insula et les noyaux gris.", view: "side", sel: ["Artère cérébrale moyenne gauche"] },
      { t: "Le territoire privé de sang", x: "Cortex moteur et somesthésique de la face et du membre supérieur, aires du langage, insula.", view: "side", sel: ["Artère cérébrale moyenne gauche"], les: ["Gyrus précentral (cortex moteur) gauche", "Gyrus postcentral (cortex somesthésique) gauche", "Gyrus frontal inférieur, parties operculaire et triangulaire (aire de Broca à gauche) gauche", "Insula gauche", "Gyrus temporal supérieur gauche", "Gyrus supramarginal gauche", "Gyrus angulaire gauche"] },
      { t: "Les signes", x: "Hémiplégie et hémianesthésie droites à prédominance brachio-faciale, aphasie (hémisphère dominant), hémianopsie latérale homonyme droite, déviation du regard vers la lésion.", view: "side", les: ["Gyrus précentral (cortex moteur) gauche", "Gyrus postcentral (cortex somesthésique) gauche", "Gyrus frontal inférieur, parties operculaire et triangulaire (aire de Broca à gauche) gauche", "Insula gauche", "Gyrus temporal supérieur gauche", "Gyrus supramarginal gauche", "Gyrus angulaire gauche"] },
      { t: "Pourquoi le membre inférieur est épargné", x: "Il est représenté sur la face médiale (lobule paracentral), territoire de l’artère cérébrale antérieure.", view: "back", sel: ["Lobule paracentral gauche"] },
      { t: "Urgence", x: "« Le temps, c’est du cerveau » : thrombolyse dans les 4 h 30 ou thrombectomie, après une imagerie qui élimine une hémorragie.", view: "side", les: ["Gyrus précentral (cortex moteur) gauche", "Insula gauche"] },
    ],
  },
  {
    id: "hernie", base: "rachis", titre: "Hernie discale L4-L5", sous: "Le disque comprime la racine L5 : sciatique",
    steps: [
      { t: "Le disque L4-L5", x: "Le noyau pulpeux est entouré de l’anneau fibreux ; les disques lombaires bas supportent le plus de contraintes.", view: "side", sel: ["Disques intervertébraux lombaires"], iso: ["lumbar vertebra", "sacrum", "intervertebral disk", "spinal nerves", "cauda equina"] },
      { t: "La hernie", x: "L’anneau se fissure, le noyau sort en arrière et sur le côté (le ligament longitudinal postérieur le dévie latéralement).", view: "back", sel: ["Disques intervertébraux lombaires"], les: ["Disques intervertébraux lombaires"], iso: ["lumbar vertebra", "sacrum", "intervertebral disk", "spinal nerves", "cauda equina"] },
      { t: "La racine comprimée", x: "À l’étage L4-L5, c’est la racine L5 qui est touchée : douleur de la fesse au dos du pied jusqu’au gros orteil, déficit du releveur de l’hallux.", view: "back", sel: ["Racines des nerfs spinaux droits"], les: ["Racines des nerfs spinaux droits"], iso: ["lumbar vertebra", "sacrum", "intervertebral disk", "spinal nerves", "cauda equina"] },
      { t: "Le signe d’alarme", x: "Anesthésie en selle et troubles sphinctériens : syndrome de la queue de cheval, urgence chirurgicale.", view: "back", sel: ["Queue de cheval"], iso: ["lumbar vertebra", "sacrum", "intervertebral disk", "spinal nerves", "cauda equina"] },
    ],
  },
  {
    id: "appendicite", base: "abdomen", titre: "Appendicite aiguë", sous: "Inflammation de l’appendice, douleur en fosse iliaque droite",
    steps: [
      { t: "L’appendice", x: "Diverticule du cæcum, à la jonction des trois bandelettes du côlon, dans la fosse iliaque droite.", view: "front", sel: ["Appendice vermiforme"], iso: ["appendix", "ascending colon", "hip bone", "colic arteries"] },
      { t: "L’inflammation", x: "Obstruction de la lumière (stercolithe, ganglions) puis infection : l’appendice gonfle.", view: "front", sel: ["Appendice vermiforme"], les: ["Appendice vermiforme"], iso: ["appendix", "ascending colon", "hip bone", "colic arteries"] },
      { t: "Le point de McBurney", x: "Au tiers externe de la ligne entre l’ombilic et l’épine iliaque antéro-supérieure droite : douleur provoquée maximale.", view: "front", les: ["Appendice vermiforme"], iso: ["appendix", "ascending colon", "hip bone"] },
      { t: "Le risque", x: "Perforation puis péritonite : l’artère appendiculaire est terminale, la gangrène s’installe vite. Traitement : appendicectomie.", view: "q34", sel: ["Artère appendiculaire"], les: ["Appendice vermiforme"], iso: ["appendix", "ascending colon", "colic arteries"] },
    ],
  },
  {
    id: "carpien", base: "main", titre: "Syndrome du canal carpien", sous: "Compression du nerf médian sous le rétinaculum des fléchisseurs",
    steps: [
      { t: "Le canal carpien", x: "Tunnel inextensible entre les os du carpe et le rétinaculum des fléchisseurs : 9 tendons et le nerf médian.", view: "front", sel: ["Rétinaculum des fléchisseurs", "Nerf médian"] },
      { t: "La compression", x: "Tout ce qui réduit la place (ténosynovite, grossesse, hypothyroïdie, travail répétitif) écrase le nerf médian.", view: "front", sel: ["Nerf médian"], les: ["Nerf médian"] },
      { t: "Les signes", x: "Fourmillements nocturnes du pouce, de l’index, du majeur et de la moitié de l’annulaire ; signes de Tinel et de Phalen.", view: "front", sel: ["Nerf médian"], les: ["Nerf médian"] },
      { t: "À un stade avancé", x: "Faiblesse et fonte de l’éminence thénar (court abducteur, opposant du pouce).", view: "front", sel: ["thenar"], les: ["thenar"] },
    ],
  },
  {
    id: "lca", base: "genou", titre: "Rupture du ligament croisé antérieur", sous: "Entorse grave du genou, souvent au sport",
    steps: [
      { t: "Le LCA", x: "Il empêche le tibia de partir en avant sous le fémur et contrôle la rotation.", view: "q34", layer: 3, sel: ["Ligament croisé antérieur"] },
      { t: "Le mécanisme", x: "Pied bloqué au sol, genou en valgus et rotation externe (changement d’appui, réception de saut).", view: "front", layer: 3, sel: ["Ligament croisé antérieur"], les: ["Ligament croisé antérieur"] },
      { t: "Les signes", x: "Craquement, gonflement rapide (hémarthrose), instabilité ; tiroir antérieur et test de Lachman positifs.", view: "side", layer: 3, les: ["Ligament croisé antérieur"] },
      { t: "La triade malheureuse", x: "Associée à une lésion du ligament collatéral tibial et du ménisque médial.", view: "front", layer: 3, les: ["Ligament croisé antérieur", "Ligament collatéral tibial (médial)", "Ménisque médial"] },
    ],
  },
  {
    id: "colhum", base: "epaule", titre: "Fracture du col chirurgical de l’humérus", sous: "Fracture fréquente chez la personne âgée, risque pour le nerf axillaire",
    steps: [
      { t: "Le col chirurgical", x: "Partie rétrécie sous les tubercules de l’humérus, zone fragile chez la personne âgée (ostéoporose).", view: "front", sel: ["Humérus"] },
      { t: "Le nerf axillaire", x: "Il contourne le col chirurgical en arrière avec les artères circonflexes humérales.", view: "back", layer: 1, sel: ["Nerf axillaire", "Artères circonflexes humérales"] },
      { t: "La complication", x: "Lésion du nerf axillaire : paralysie du deltoïde (abduction impossible au-delà de quelques degrés) et anesthésie du moignon de l’épaule.", view: "side", sel: ["Nerf axillaire"], les: ["Muscle deltoïde"] },
    ],
  },
  {
    id: "geu", base: "bassin-f", titre: "Grossesse extra-utérine", sous: "L’œuf s’implante hors de l’utérus, le plus souvent dans la trompe",
    steps: [
      { t: "Le trajet normal", x: "La fécondation a lieu dans l’ampoule de la trompe ; l’œuf rejoint ensuite la cavité utérine en quelques jours.", view: "front", layer: 1, sel: ["Trompe utérine droite (isthme, ampoule, infundibulum, franges)", "Ovaire droit"] },
      { t: "L’implantation ectopique", x: "Si la trompe est abîmée (infection, chirurgie, endométriose), l’œuf s’y implante, surtout dans l’ampoule.", view: "front", layer: 1, les: ["Trompe utérine droite (isthme, ampoule, infundibulum, franges)"] },
      { t: "Le danger", x: "Douleur pelvienne et saignements avec un test de grossesse positif ; risque de rupture et d’hémorragie interne. Échographie et dosage des hCG.", view: "q34", layer: 1, les: ["Trompe utérine droite (isthme, ampoule, infundibulum, franges)"] },
    ],
  },
];
// version modifiée de l'atlas : ce que la maladie change dans le modèle
// k : blob (masse ajoutée), patch (zone de tissu atteint), scale (gonflement), tear (rupture/fracture), tint (teinte), hide
// on/to/near : structures (fiche ou nom français, ou {re}) ; r, off, up, down : centimètres
const ATL_PMODS = {
  idm: [
    { k: "patch", on: ["left ventricle", "interventricular septum"], near: "anterior interventricular artery", r: 1.7, col: "#3d0d22", col2: "#a04a5e", fr: "Myocarde nécrosé (infarctus antérieur)" },
    { k: "blob", on: "anterior interventricular artery", to: "left coronary artery", r: 0.3, col: "#1e0306", fr: "Caillot : l’IVA est bouchée" },
    { k: "tint", f: ["anterior interventricular artery", "diagonal branch"], col: "#6b3a44" },
  ],
  avc: [
    { k: "patch", on: { re: "^(Gyrus|Gyri|Insula|Pôle temporal|Lobule pariétal).*gauches?$" }, near: "Artère cérébrale moyenne gauche", r: 2.4, col: "#3d0d22", col2: "#9a5a6a", fr: "Territoire sylvien privé de sang" },
    { k: "blob", on: "Artère cérébrale moyenne gauche", to: "Artère carotide interne gauche", r: 0.25, col: "#1e0306", fr: "Caillot dans l’artère cérébrale moyenne" },
  ],
  hernie: [
    { k: "blob", on: "Disques intervertébraux lombaires", frac: [0.42, 0.3, 0], off: [-0.3, 0, -0.35], r: 0.5, sq: [1, 0.7, 1], col: "#e9dcc0", fr: "Hernie discale L4-L5" },
    { k: "tint", f: ["Racines des nerfs spinaux droits"], col: "#e0a32e" },
  ],
  appendicite: [
    { k: "scale", f: ["Appendice vermiforme"], s: 1.55, fr: "Appendice gonflé, enflammé" },
    { k: "tint", f: ["Appendice vermiforme"], col: "#c4372f" },
  ],
  carpien: [
    { k: "scale", f: ["Gaines des tendons fléchisseurs (radial du carpe, long fléchisseur du pouce)"], s: 1.3, fr: "Ténosynovite : les gaines gonflent" },
    { k: "tint", f: ["Gaines des tendons fléchisseurs (radial du carpe, long fléchisseur du pouce)"], col: "#d47a7a" },
    { k: "tint", f: ["Nerf médian"], col: "#e0a32e" },
  ],
  lca: [{ k: "tear", f: ["Ligament croisé antérieur"], y: 0.5, up: [0, 0.25, 0.15], down: [0, -0.25, -0.15], fr: "LCA rompu", col: "#b8545a" }],
  colhum: [{ k: "tear", f: ["Humérus"], ytop: 5, up: [0, 0, 0], down: [0.45, 0.3, 0], tilt: 9, fr: "Fracture du col chirurgical" }],
  geu: [{ k: "blob", on: "Trompe utérine droite (isthme, ampoule, infundibulum, franges)", frac: [0.3, 0.5, 0.5], r: 0.55, sq: [1.25, 1, 1], col: "#c98a8a", fr: "Œuf implanté dans l’ampoule" }],
};
// repères cliniques (projection approximative sur le modèle) : on = structure, frac = position dans sa boîte, off = décalage (cm)
const ATL_FOYERS = [
  { t: "Foyer aortique", on: "ascending aorta", frac: [0.1, 0.75, 1], off: [0, 0, 1.2], x: "2e espace intercostal droit, au bord droit du sternum : souffle du rétrécissement aortique (irradie aux carotides)." },
  { t: "Foyer pulmonaire", on: "pulmonary trunk", frac: [0.8, 0.8, 1], off: [0, 0, 1.2], x: "2e espace intercostal gauche, au bord gauche du sternum : dédoublement de B2, souffles pulmonaires." },
  { t: "Foyer tricuspide", on: "right ventricle", frac: [0.35, 0.25, 1], off: [0, 0, 1], x: "Bas du sternum (4e-5e espace intercostal gauche, appendice xiphoïde) : insuffisance tricuspide, augmente à l’inspiration." },
  { t: "Foyer mitral (pointe)", on: "left ventricle", frac: [1, 0, 0.6], off: [0.5, 0, 0.8], x: "Pointe du cœur, 5e espace intercostal gauche sur la ligne médio-claviculaire : choc de pointe, souffles mitraux (irradient vers l’aisselle)." },
];
const ATL_CLIN = {
  coeur: ATL_FOYERS,
  thorax: ATL_FOYERS,
  abdomen: [
    { t: "Point de McBurney", on: "Appendice vermiforme", frac: [0.5, 0.6, 1], off: [0, 0, 4], x: "Au tiers externe de la ligne ombilic – épine iliaque antéro-supérieure droite : douleur provoquée dans l’appendicite." },
    { t: "Signe de Murphy", on: "Vésicule biliaire", frac: [0.5, 0.3, 1], off: [0, 0, 3], x: "Sous le rebord costal droit, ligne médio-claviculaire : l’inspiration profonde bloquée par la douleur évoque une cholécystite." },
  ],
  "membre-sup": [
    { t: "Pouls radial", on: "Artère radiale", frac: [0.5, 0.04, 0.6], x: "Au poignet, en dehors du tendon du fléchisseur radial du carpe, contre le radius." },
    { t: "Pouls huméral (brachial)", on: "Artère brachiale", frac: [0.5, 0.02, 0.6], x: "Au pli du coude, en dedans du tendon du biceps : on y place le stéthoscope pour la tension artérielle." },
  ],
  main: [{ t: "Pouls radial", on: "Artère radiale", to: "Rétinaculum des fléchisseurs", off: [0, 1.5, 0], x: "Au poignet, en dehors du tendon du fléchisseur radial du carpe, contre le radius." }],
  "membre-inf": [
    { t: "Pouls fémoral", on: "Artère fémorale", frac: [0.5, 1, 0.8], x: "Au pli de l’aine, à mi-distance entre l’épine iliaque antéro-supérieure et la symphyse pubienne." },
    { t: "Pouls poplité", on: "Artère poplitée", frac: [0.5, 0.5, 0], x: "Au creux poplité, genou légèrement fléchi, palpé à deux mains." },
    { t: "Pouls tibial postérieur", on: "Artère tibiale postérieure", frac: [0.5, 0, 0.5], x: "En arrière de la malléole médiale." },
    { t: "Pouls pédieux", on: "Artère dorsale du pied et ses branches", frac: [0.5, 1, 1], x: "Sur le dos du pied, en dehors du tendon du long extenseur de l’hallux." },
  ],
  genou: [{ t: "Pouls poplité", on: "Artère poplitée", frac: [0.5, 0.5, 0], x: "Au creux poplité, genou légèrement fléchi, palpé à deux mains." }],
  corps: [
    { t: "Pouls carotidien", on: "Artère carotide commune droite", frac: [0.5, 0.85, 1], x: "Au bord antérieur du sternocléido-mastoïdien, à hauteur du cartilage thyroïde : un seul côté à la fois." },
    { t: "Pouls radial", on: "Artère radiale (droit)", frac: [0.5, 0.04, 0.6], x: "Au poignet, en dehors du tendon du fléchisseur radial du carpe." },
    { t: "Point de McBurney", on: "Appendice vermiforme", frac: [0.5, 0.6, 1], off: [0, 0, 4], x: "Douleur provoquée dans l’appendicite." },
  ],
};
// cadrage de l'atlas modifié : systèmes masqués, couche, angle et structures à cadrer
const ATL_PSCENE = {
  idm: { view: "front", frame: ["left ventricle"] },
  avc: { view: "side", frame: ["Artère cérébrale moyenne gauche", "Insula gauche", "Gyrus précentral (cortex moteur) gauche"] },
  hernie: { hide: ["muscle"], view: "back", frame: ["Vertèbre L4", "Vertèbre L5"] },
  appendicite: { hide: ["muscle", "zone"], hideF: ["Jéjunum", "Mésocôlon", "Côlon transverse"], view: "front", frame: ["Appendice vermiforme"] },
  carpien: { view: "front", frame: ["Rétinaculum des fléchisseurs", "Nerf médian"] },
  lca: { hide: ["muscle"], fade: ["Fémur", "Patella", "Tibia", "Fibula"], view: "q34", frame: ["Ligament croisé antérieur"] },
  colhum: { hide: ["muscle"], view: "front", frame: ["Humérus"] },
  geu: { view: "front", frame: ["Trompe utérine droite (isthme, ampoule, infundibulum, franges)", "Ovaire droit"] },
};
function atlasPatho(id) {
  const P = ATL_PATHO.find((x) => x.id == id);
  if (!P) return;
  if (ATL.v && ATL.v.id == P.base && ATL.v.pathoOpen) return ATL.v.pathoOpen(P);
  if (!atlasHas(P.base)) return toast("L’atlas « " + ((ATL.models.find((m) => m.id == P.base) || {}).titre || P.base) + " » n’est pas encore en ligne.");
  ATL.auto = "patho:" + id;
  atlasGo(P.base);
}
function atlasPathoCards(ms) {
  const L = ms ? ATL_PATHO.filter((P) => ms.some((m) => m.id == P.base)) : ATL_PATHO;
  if (!L.length) return "";
  return (
    '<h3 class="atgh">Pathologies <small>' + L.length + "</small></h3>" +
    '<div class="atgg">' +
    L.map((P) => {
      const ok = atlasHas(P.base),
        b = ATL.models.find((m) => m.id == P.base) || { titre: P.base };
      return (
        '<button class="atgc atpg' + (ok ? "" : " off") + '" onclick="atlasPatho(\'' + P.id + "')\">" +
        '<span class="atgi atpgi">' + atlasThumb(P.base) + '</span><span class="atgt"><b>' + esc(P.titre) + "</b><small>" + esc(P.sous) + "</small>" +
        "<em>Atlas « " + esc(b.titre) + " » modifié · " + P.steps.length + " étapes</em></span>" + icn("chev") + "</button>"
      );
    }).join("") +
    "</div>"
  );
}

// atlas rangés par rubrique (corps entier, régions, organes, microscopique)
const atlasByCat = () => ATL.cats.map(([k, t]) => [k, t, ATL.models.filter((m) => (m.cat || "region") == k)]).filter((c) => c[2].length);
// ---------- navigation : rubriques, corps cliquable, recherche, récents, favoris, vignettes ----------
// zones du corps et atlas qui les montrent (aussi : atlas liés entre eux)
const ATL_ZONES = {
  tete: ["Tête", ["tete-cou", "encephale", "oeil", "oreille", "nez", "bouche", "dent"]],
  cou: ["Cou", ["tete-cou", "larynx", "endocrine", "lymphe"]],
  thorax: ["Thorax", ["thorax", "coeur", "poumons", "sein", "alveole"]],
  abdomen: ["Abdomen", ["abdomen", "foie", "rein", "nephron", "villosite", "endocrine"]],
  bassin: ["Bassin", ["bassin", "bassin-f", "rachis"]],
  msup: ["Membre supérieur", ["membre-sup", "epaule", "main"]],
  minf: ["Membre inférieur", ["membre-inf", "genou"]],
};
const ATL_TABS = [["tout", "Tout"], ["corps", "Corps entier"], ["region", "Régions"], ["organe", "Organes"], ["micro", "Microscopique"], ["patho", "Pathologies"], ["fav", "Favoris"]];
const atlasLS = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "null") || d;
  } catch (e) {
    return d;
  }
};
const atlasLSset = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
};
function atlasThumb(id) {
  const t = atlasLS("mr_atlas_th", {})[id];
  return t ? '<img src="' + t + '" alt="" loading="lazy">' : atlasIco(id);
}
// vignette prise dans le visualiseur (une fois par semaine au plus)
function atlasThumbSave(id, canvas) {
  try {
    const all = atlasLS("mr_atlas_th", {}),
      age = atlasLS("mr_atlas_tht", {});
    if (all[id] && Date.now() - (age[id] || 0) < 7 * 864e5) return;
    const c = document.createElement("canvas"),
      W = canvas.width,
      H = canvas.height,
      sz = Math.min(W, H) * 0.86;
    c.width = c.height = 120;
    c.getContext("2d").drawImage(canvas, (W - sz) / 2, (H - sz) / 2, sz, sz, 0, 0, 120, 120);
    all[id] = c.toDataURL("image/jpeg", 0.72);
    age[id] = Date.now();
    atlasLSset("mr_atlas_th", all);
    atlasLSset("mr_atlas_tht", age);
  } catch (e) {}
}
function atlasRecent(id) {
  const r = atlasLS("mr_atlas_rec", []).filter((x) => x != id);
  r.unshift(id);
  atlasLSset("mr_atlas_rec", r.slice(0, 8));
}
function atlasFav(id, ev) {
  if (ev) ev.stopPropagation();
  const f = atlasLS("mr_atlas_fav", []),
    i = f.indexOf(id);
  i < 0 ? f.push(id) : f.splice(i, 1);
  atlasLSset("mr_atlas_fav", f);
  atlasGalRepaint();
}
function atlasTab(k) {
  ATL.tab = k;
  ATL.zone = null;
  atlasGalRepaint();
}
function atlasZone(z) {
  ATL.zone = ATL.zone == z ? null : z;
  ATL.tab = "tout";
  atlasGalRepaint();
}
function atlasGalRepaint() {
  const g = $("atgal");
  if (g) g.innerHTML = atlasGallery();
  const t = $("attabs");
  if (t) t.outerHTML = atlasTabs();
  document.querySelectorAll("#atbody [data-z]").forEach((x) => x.classList.toggle("on", x.dataset.z == ATL.zone));
  atlasZoneHover();
}
const ATL_CATS_S = { corps: "Corps entier", region: "Régions", organe: "Organes", micro: "Microscopique" };
// atlas liés : même zone du corps, ou liens de détail entre atlas
function atlasRelated(id) {
  const ids = new Set();
  for (const z in ATL_ZONES) if (ATL_ZONES[z][1].includes(id)) ATL_ZONES[z][1].forEach((x) => ids.add(x));
  for (const k in ATL.detail || {}) if (k == id) ids.add(k);
  ids.delete(id);
  return ATL.models.filter((m) => ids.has(m.id) && atlasHas(m.id));
}
function atlasTabs() {
  const k = ATL.tab || "tout";
  return '<div id="attabs" class="attabs" role="tablist">' + ATL_TABS.map(([t, n]) => '<button role="tab"' + (t == k ? ' class="on" aria-selected="true"' : "") + ' onclick="atlasTab(\'' + t + "')\">" + n + "</button>").join("") + "</div>";
}
// silhouette cliquable : chaque zone filtre les atlas qui la montrent
const ATL_FIG = {
  tete: "M100 14C114 14 124 26 124 43C124 58 116 72 100 74C84 72 76 58 76 43C76 26 86 14 100 14Z",
  cou: "M89 70C90 79 89 86 85 92L115 92C111 86 110 79 111 70C106 75 94 75 89 70Z",
  thorax: "M85 92C71 94 59 97 51 104C45 110 44 120 46 132C49 150 53 166 58 182L142 182C147 166 151 150 154 132C156 120 155 110 149 104C141 97 129 94 115 92Z",
  abdomen: "M58 182C59 194 60 202 60 210C59 218 56 224 55 230L145 230C144 224 141 218 140 210C140 202 141 194 142 182Z",
  bassin: "M55 230C53 242 53 254 57 266C67 276 80 281 92 283L100 277L108 283C120 281 133 276 143 266C147 254 147 242 145 230Z",
  msup: "M50 105C41 110 37 120 36 134C35 160 32 186 30 208C28 226 26 243 24 257C22 268 20 279 23 287C26 294 33 294 35 286C37 278 37 268 39 258C43 240 47 222 49 205C51 186 51 165 49 147Z",
  minf: "M57 268C67 277 80 282 92 284L96 292C96 330 94 368 92 398C91 416 90 430 90 442C90 450 86 455 78 455L70 455C63 454 63 449 69 445C73 439 73 427 71 409C67 379 63 340 59 302Z",
};
const atlasMirror = (d) => {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => (i++ % 2 == 0 ? String(200 - +n) : n));
};
function atlasBody() {
  const Z = (z, d, k) =>
    '<path data-z="' + z + '" d="' + d + '" onclick="atlasZone(\'' + z + "')\" onmouseenter=\"atlasZoneHover('" + z + '\')" onmouseleave="atlasZoneHover()"><title>' + ATL_ZONES[z][0] + "</title></path>";
  const paired = (z) => Z(z, ATL_FIG[z]) + Z(z, atlasMirror(ATL_FIG[z]));
  return (
    '<div class="atbodyw"><svg id="atbody" viewBox="0 0 200 462" aria-label="Choisir une zone du corps">' +
    '<defs><linearGradient id="atfg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b5372"/><stop offset="1" stop-color="#1c2a3b"/></linearGradient>' +
    '<radialGradient id="atfh" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="100" cy="458" rx="52" ry="4" fill="#000" opacity="0.35"/>' +
    Z("tete", ATL_FIG.tete) + Z("cou", ATL_FIG.cou) + Z("thorax", ATL_FIG.thorax) + Z("abdomen", ATL_FIG.abdomen) + Z("bassin", ATL_FIG.bassin) + paired("msup") + paired("minf") +
    // repères dessinés (non cliquables) : clavicules, sternum, côtes, nombril, genoux
    '<g class="atfd"><path d="M72 104C82 100 92 101 99 106M128 104C118 100 108 101 101 106"/><path d="M100 106V158"/>' +
    '<path d="M64 132C76 140 90 142 98 140M136 132C124 140 110 142 102 140M66 150C78 157 90 159 98 157M134 150C122 157 110 159 102 157"/>' +
    '<circle cx="100" cy="212" r="1.8"/><path d="M78 196C86 198 94 198 100 197C106 198 114 198 122 196"/>' +
    '<path d="M79 372C82 366 88 366 90 372M121 372C118 366 112 366 110 372"/><path d="M90 66C95 69 105 69 110 66"/></g>' +
    '</svg><small id="atbzn">Touche une zone</small></div>'
  );
}
function atlasZoneHover(z) {
  const e = $("atbzn");
  if (e) e.textContent = z ? ATL_ZONES[z][0] : ATL.zone ? ATL_ZONES[ATL.zone][0] : "Touche une zone";
  document.querySelectorAll("#atbody [data-z]").forEach((x) => x.classList.toggle("hov", x.dataset.z == z));
}
function atlasCard(m) {
  const ok = atlasHas(m.id),
    fav = atlasLS("mr_atlas_fav", []).includes(m.id);
  return (
    '<div class="atgc' + (ok ? "" : " off") + '" role="button" tabindex="0" onclick="atlasGo(\'' + m.id + "')\" onkeydown=\"event.key=='Enter'&&atlasGo('" + m.id + "')\">" +
    '<span class="atgi">' + atlasThumb(m.id) + '</span><span class="atgt"><b>' + esc(m.titre) + "</b><small>" + esc(m.sous) + "</small>" +
    (ok ? "" : "<em>Pas encore en ligne</em>") + "</span>" +
    '<button class="atfav' + (fav ? " on" : "") + '" aria-label="' + (fav ? "Retirer des favoris" : "Ajouter aux favoris") + '" onclick="atlasFav(\'' + m.id + "',event)\">" + (fav ? "★" : "☆") + "</button></div>"
  );
}
function atlasGalleryCards(ms) {
  return ms.map(atlasCard).join("");
}
function atlasGallery() {
  const k = ATL.tab || "tout",
    sec = (t, ms) => (ms.length ? '<h3 class="atgh">' + esc(t) + " <small>" + ms.length + '</small></h3><div class="atgg">' + atlasGalleryCards(ms) + "</div>" : "");
  if (ATL.zone) {
    const [zn, ids] = ATL_ZONES[ATL.zone],
      ms = ATL.models.filter((m) => ids.includes(m.id));
    return '<p class="atzc">Zone : <b>' + esc(zn) + '</b> <button onclick="atlasZone(null)">Tout afficher</button></p>' + sec("Atlas de cette zone", ms) + atlasPathoCards(ms);
  }
  if (k == "patho") return atlasPathoCards();
  if (k == "fav") {
    const f = atlasLS("mr_atlas_fav", []),
      ms = ATL.models.filter((m) => f.includes(m.id));
    return ms.length ? sec("Favoris", ms) : '<p class="m atzc">Touche l’étoile ☆ d’un atlas pour le retrouver ici.</p>';
  }
  if (k != "tout") {
    const c = ATL.cats.find((x) => x[0] == k);
    return sec(c ? c[1] : k, ATL.models.filter((m) => (m.cat || "region") == k));
  }
  const rec = atlasLS("mr_atlas_rec", []).map((id) => ATL.models.find((m) => m.id == id)).filter(Boolean);
  return (
    (rec.length
      ? '<h3 class="atgh">Récemment ouverts</h3><div class="atrec">' +
        rec.map((m) => '<button onclick="atlasGo(\'' + m.id + "')\"><span>" + atlasThumb(m.id) + "</span><b>" + esc(m.titre) + "</b></button>").join("") +
        "</div>"
      : "") +
    atlasByCat().map(([, t, ms]) => sec(t, ms)).join("") +
    atlasPathoCards()
  );
}
// recherche dans tous les atlas (noms de toutes les structures, même dans un atlas jamais ouvert)
async function atlasSearchAll(q) {
  const box = $("atgsr");
  if (!box) return;
  q = (q || "").trim();
  if (q.length < 2) return (box.innerHTML = ""), (box.hidden = true);
  if (!ATL.noms) {
    try {
      ATL.noms = await (await fetch("vendor/atlas-noms.json")).json();
    } catch (e) {
      ATL.noms = {};
    }
    const loc = atlasIdx();
    for (const id in loc) ATL.noms[id] = [...new Set([...(ATL.noms[id] || []), ...Object.values(loc[id])])];
  }
  const n = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
    nq = n(q),
    res = [];
  for (const m of ATL.models.concat([])) {
    if (n(m.titre).includes(nq)) res.push({ m, t: "", s: 0 });
    for (const t of ATL.noms[m.id] || []) {
      const i = n(t).indexOf(nq);
      if (i >= 0) res.push({ m, t, s: (i == 0 ? 0 : 1) + t.length / 200 + (m.cat == "corps" ? 0.5 : 0) });
    }
  }
  res.sort((a, b) => a.s - b.s);
  box.hidden = false;
  box.innerHTML = res.length
    ? res.slice(0, 30).map((r) => '<button onclick="atlasGo(\'' + r.m.id + "'," + (r.t ? JSON.stringify(r.t).replace(/"/g, "&quot;") : "''") + ')"><b>' + esc(r.t || r.m.titre) + "</b><small>" + (r.t ? "Atlas " + esc(r.m.titre) : "Ouvrir l’atlas") + "</small></button>").join("")
    : '<p class="m">Aucune structure trouvée.</p>';
}
function atlasAdminFiles() {
  if (!ATL.files) return '<p class="m">Lecture des fichiers…</p>';
  const fmt = (f) => {
    if (!f) return '<span class="atfm">Manquant</span>';
    const d = new Date(f.updated_at || f.created_at || 0),
      sz = ((f.metadata && f.metadata.size) || 0) / 1048576;
    return "<span>" + d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + "</span><small>" + sz.toFixed(1).replace(".", ",") + " Mo</small>";
  };
  const pend = atlasPending();
  return (
    '<div class="atupbox"><b>' + (pend.length ? pend.length + " fichier" + (pend.length > 1 ? "s" : "") + " à mettre à jour" : "Tous les atlas sont à jour ✔") + "</b>" +
    (pend.length ? "<small>" + esc(atlasPendingText(pend)) + "</small>" : "") +
    '<label class="b p">Mettre à jour depuis le dossier…' + ATL_FOLDER_INPUT + "</label>" +
    '<small>Choisis le dossier <b>« 1 - Atlas 3D à envoyer dans l’app »</b> sur ton Bureau (dans MedRevise) : l’app y cherche tous les fichiers, même dans les sous-dossiers, et n’envoie que ceux qui ont changé.</small></div>' +
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
    atlasUpdBar() +
    '<div class="atgs"><input id="atgsq" type="search" placeholder="Chercher une structure dans tous les atlas (ex. : nerf médian, mitrale…)" oninput="atlasSearchAll(this.value)" autocomplete="off"><div id="atgsr" hidden></div></div>' +
    '<div class="athub">' + atlasBody() + '<div class="athubm">' + atlasTabs() +
    '<div id="atgal" class="atgal">' + atlasGallery() + "</div></div></div>" +
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
    s.src = "vendor/three-atlas-2.js";
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
  dessin: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/><path d="M4 20h6"/>',
  schema: '<rect x="3" y="4" width="12" height="16" rx="2"/><circle cx="8" cy="9" r="1.6"/><circle cx="10" cy="15" r="1.6"/><path d="M18 8h3M18 12h3M18 16h3"/>',
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
    '<div class="atmsw"><button id="atmsw" aria-haspopup="listbox" aria-expanded="false"><span class="atcrumb">Atlas › ' + esc(ATL_CATS_S[m.cat || "region"] || "") + "</span><b>" + esc(m.titre) + '</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>' +
    '<div id="atmlist" role="listbox" hidden>' +
    (() => {
      const rel = atlasRelated(id),
        pa = ATL_PATHO.filter((P) => P.base == id);
      return (
        (rel.length ? '<p class="atmh">Atlas liés</p><div class="atmrel">' + rel.map((x) => '<button role="option" data-m="' + x.id + '"><span class="atmth">' + atlasThumb(x.id) + "</span><b>" + esc(x.titre) + "</b></button>").join("") + "</div>" : "") +
        (pa.length ? '<p class="atmh">Version pathologique</p>' + pa.map((P) => '<button role="option" data-p="' + P.id + '" class="atmpa"><span class="atmth">' + atlasIco(id) + "</span><span><b>" + esc(P.titre) + "</b><small>" + esc(P.sous) + "</small></span></button>").join("") : "")
      );
    })() +
    atlasByCat()
      .map(([k, t, ms]) => '<p class="atmh">' + esc(t) + "</p>" + ms.map((x) => '<button role="option" data-m="' + x.id + '"' + (x.id == id ? ' class="on" aria-selected="true"' : "") + '><span class="atmth">' + atlasThumb(x.id) + "</span><span><b>" + esc(x.titre) + "</b><small>" + esc(x.sous) + "</small></span></button>").join(""))
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
    dock("schema", "Schéma", ' data-x="1"') +
    dock("dessin", "Dessiner", ' data-x="1"') +
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
  d.querySelectorAll("#atmlist button[data-m]").forEach((b) => (b.onclick = () => b.dataset.m != id && (overlay ? atlasOpen(b.dataset.m, "", true) : atlasGo(b.dataset.m))));
  d.querySelectorAll("#atmlist button[data-p]").forEach((b) => (b.onclick = () => (($("atmlist").hidden = true), atlasPatho(b.dataset.p))));
  atlasRecent(id);
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
  const bgCv = document.createElement("canvas");
  bgCv.width = bgCv.height = 512;
  // fond sombre (par défaut) ou clair, façon planche d'atlas
  const bgPaint = () => {
    const g = bgCv.getContext("2d"),
      gr = g.createRadialGradient(256, 230, 20, 256, 256, 380);
    if (V.light) {
      gr.addColorStop(0, "#ffffff");
      gr.addColorStop(0.6, "#e9edf2");
      gr.addColorStop(1, "#c7cfd9");
    } else {
      gr.addColorStop(0, "#" + new T.Color("#26354a").lerp(new T.Color(V.acc || "#5fd4c8"), 0.14).getHexString());
      gr.addColorStop(0.55, "#141c28");
      gr.addColorStop(1, "#07090e");
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 512);
    if (V.bgTex) V.bgTex.needsUpdate = true;
    canvas.parentNode && canvas.parentNode.classList.toggle("atlight", !!V.light);
  };
  {
    const tx = new T.CanvasTexture(bgCv);
    tx.colorSpace = T.SRGBColorSpace;
    scene.background = tx;
    V.bgTex = tx;
  }
  // éclairage « studio » : une pièce lumineuse floutée sert de reflets (surfaces humides, vernies)
  let envTex = null;
  const envGet = () => {
    if (envTex || !T.PMREMGenerator || !T.EquirectangularReflectionMapping) return envTex;
    // pièce équirectangulaire dessinée : plafonnier, deux boîtes à lumière latérales, sol sombre
    const cv = document.createElement("canvas"),
      g = cv.getContext("2d");
    cv.width = 512;
    cv.height = 256;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#8a909c");
    gr.addColorStop(0.5, "#4a505c");
    gr.addColorStop(1, "#1c1f25");
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 256);
    g.filter = "blur(6px)";
    g.fillStyle = "#ffffff";
    g.fillRect(150, 4, 212, 40);
    g.fillStyle = "#fff1e4";
    g.fillRect(40, 80, 60, 70);
    g.fillStyle = "#e4eeff";
    g.fillRect(400, 90, 50, 60);
    g.fillStyle = "#f4f4f4";
    g.fillRect(220, 100, 70, 30);
    const tx = new T.CanvasTexture(cv);
    tx.mapping = T.EquirectangularReflectionMapping;
    tx.colorSpace = T.SRGBColorSpace;
    const pm = new T.PMREMGenerator(renderer);
    envTex = pm.fromEquirectangular(tx).texture;
    tx.dispose();
    pm.dispose();
    return envTex;
  };
  const STUDIO = {
    organe: { cc: 0.55, ccr: 0.38, sh: 0.25 }, muscle: { cc: 0.35, ccr: 0.45, sh: 0.45 }, artere: { cc: 0.8, ccr: 0.22 }, veine: { cc: 0.8, ccr: 0.22 },
    valve: { cc: 0.45, ccr: 0.3, sh: 0.6 }, nerf: { cc: 0.5, ccr: 0.3, sh: 0.3 }, os: { cc: 0.15, ccr: 0.6 }, cartilage: { cc: 0.5, ccr: 0.3 }, ligament: { cc: 0.4, ccr: 0.35, sh: 0.4 },
  };
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
    opSys: "muscle", real: false, relief: true, studio: true, light: false, ao: false, outline: true, qMode: "auto", focus: false, xray: false, ortho: false, grid: false,
    hist: [], meas: { on: false, pts: [] },
  });
  try {
    const pr = JSON.parse(localStorage.getItem("mr_atlas_aff") || "{}");
    ["real", "relief", "outline", "focus", "xray", "ortho", "studio", "light"].forEach((k) => typeof pr[k] == "boolean" && (V[k] = pr[k]));
    if (pr.ao2 === true) V.ao = true; // ombres de contact : seulement si on les a réactivées depuis la correction
    if (["auto", "high", "eco"].includes(pr.q)) V.qMode = pr.q;
  } catch (e) {}
  bgPaint();
  const prefSave = () => {
    try {
      localStorage.setItem("mr_atlas_aff", JSON.stringify({ real: V.real, relief: V.relief, studio: V.studio, light: V.light, ao2: V.ao, outline: V.outline, focus: V.focus, xray: V.xray, ortho: V.ortho, q: V.qMode }));
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
  // pendant qu'on tourne ou qu'une animation joue : résolution un peu plus basse et, sur un appareil qui peine, sans le relief fin ;
  // tout revient dès que le modèle s'arrête
  let dynLo = false;
  function motionLod(busy) {
    ATLO.value = busy && (!fine || V.q.lvl >= 1 || V.qMode == "eco") ? 1 : 0;
    const want = !!busy && V.qMode != "high";
    if (want === dynLo) return;
    dynLo = want;
    const base = Math.min(DPR, [fine ? 1.75 : 1.5, 1.25, 1, 0.8][V.q.lvl]);
    const pr = want ? Math.max(0.75, base * 0.72) : base,
      w = canvas.clientWidth || 1,
      h = canvas.clientHeight || 1;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    if (composer && !want)
      try {
        composer.setPixelRatio(pr);
        composer.setSize(w, h);
      } catch (e) {}
  }
  function draw() {
    if (outline) outline.selectedObjects = [...V.sels].map((p) => p.mesh);
    const busy = V.moving || V.mv || V.anim || FADE || V.breath.on || V.hb.on || V.path || V.pres || V.keys.size;
    motionLod(busy);
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
  const DPR = devicePixelRatio || 1,
    ATLO = { value: 0 };
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
    if (!(V.moving || V.mv || V.anim || V.breath.on || V.hb.on || V.path || V.pres || FADE)) return;
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
      "vec3 q = vAtW * 1000.0; vec3 dd = vAtW - atC; float hh = dot(dd, atAx); vec3 rr = dd - atAx * hh; float R = max(length(rr), 1e-4);" +
      "float th = atan(dot(rr, atB2), dot(rr, atB1)); float al = 0.95; float ph = (th * R * sin(al) - hh * cos(al)) * 2600.0 + 2.0 * atN(q * 0.6);" +
      "vec3 tg = normalize(cross(atAx, rr)); vec3 fb = normalize(tg * cos(al) + atAx * sin(al)); vec3 pp = normalize(cross(fb, rr / R));" +
      "float am = 0.35 + 0.65 * atN(q * 0.12); float w = (sin(ph) * 0.6 + sin(ph * 2.7 + 1.3) * 0.4) * am; atBump(pp * w * 0.2 + 0.3 * atG(q * 0.35) + 0.15 * atG(q * 1.3), 0.8);" +
      "diffuseColor.rgb *= 0.92 + 0.035 * w + 0.12 * atN(q * 0.25); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 0.98, 0.86), 0.45 * atN(q * 0.05 + 3.1));",
    myoOld:
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
  const AT_MYO = /^(right|left) (atrium|ventricle)$|^papillary|^interventricular septum$|^trabeculae carneae$|^pectinate muscles$|^moderator band$/,
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
  // axe du cœur (base → pointe) : les fibres du myocarde s'enroulent autour en hélice
  function myoAxis() {
    const lv = V.parts.find((p) => p.meta.fiche == "left ventricle"),
      mi = V.parts.find((p) => p.meta.fiche == "mitral valve");
    if (!lv || !mi) return (V.myo = null);
    const base = new T.Box3().setFromObject(mi.mesh).getCenter(new T.Vector3()),
      a = lv.mesh.geometry.attributes.position,
      v = new T.Vector3();
    let far = null,
      fd = 0;
    lv.mesh.updateWorldMatrix(true, false);
    for (let i = 0; i < a.count; i += 3) {
      v.fromBufferAttribute(a, i).applyMatrix4(lv.mesh.matrixWorld);
      const d = v.distanceToSquared(base);
      if (d > fd) (fd = d), (far = v.clone());
    }
    const ax = far.clone().sub(base).normalize(),
      b1 = new T.Vector3(1, 0, 0).cross(ax).normalize(),
      b2 = ax.clone().cross(b1);
    V.myo = { ax, c: base.clone().lerp(far, 0.5), b1, b2 };
  }
  function reliefPatch(mt, kind, fiber) {
    mt.onBeforeCompile = (sh) => {
      sh.uniforms.atFib = { value: fiber };
      sh.uniforms.atLo = ATLO;
      const M = V.myo || { ax: fiber, c: new T.Vector3(), b1: new T.Vector3(1, 0, 0), b2: new T.Vector3(0, 0, 1) };
      sh.uniforms.atAx = { value: M.ax };
      sh.uniforms.atC = { value: M.c };
      sh.uniforms.atB1 = { value: M.b1 };
      sh.uniforms.atB2 = { value: M.b2 };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vAtW;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvAtW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vAtW;\nuniform vec3 atFib;\nuniform float atLo;\nuniform vec3 atAx;\nuniform vec3 atC;\nuniform vec3 atB1;\nuniform vec3 atB2;" + NOISE +
            "\nvec3 atG(vec3 p){ float n = atN(p); return vec3(atN(p+vec3(0.31,0,0)), atN(p+vec3(0,0.31,0)), atN(p+vec3(0,0,0.31))) - n; }" +
            "\n#define atBump(g, k) normal = normalize(normal + (k) * (viewMatrix * vec4((g), 0.0)).xyz)",
        )
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nif (atLo < 0.5) {" + RELIEF[kind] + "}");
    };
    mt.customProgramCacheKey = () => "atrelief4-" + kind;
  }
  function hashStr(s) {
    let h = 7;
    for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  }
  function colorOf(p) {
    if (p.meta.systeme == "zone") return ATL.zoneCol[p.meta.fiche] || ATL.colors.zone;
    if (V.pTint && V.pTint.has(p)) return V.pTint.get(p); // atlas modifié (pathologie)
    if (V.lesion && V.lesion.has(p)) return 0x5c1330; // zone atteinte (pathologie)
    if (V.grp) return V.grp.of.get(p) ?? 0x3a3f47; // colorer par innervation / vascularisation
    if (p.meta.col) return parseInt(String(p.meta.col).replace("#", ""), 16); // couleur propre (sclère, iris, cellules…)
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
    if (p.meta.op != null) op = Math.min(op, p.meta.op); // structure transparente par nature (cornée, membrane…)
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
  function matsAsync() {
    materials(true);
    if (!renderer.compileAsync) return;
    V.hold = true;
    const done = () => V.hold && ((V.hold = false), need());
    setTimeout(done, 2500);
    renderer.compileAsync(scene, V.cam).then(done, done);
  }
  function envApply() {
    scene.environment = V.real && V.studio ? envGet() : null;
  }
  function materials(rebuild) {
    if (rebuild) envApply();
    for (const p of V.parts) {
      const sys = p.meta.systeme;
      let mt = p.mesh.material;
      if (rebuild) {
        const old = mt;
        const st = V.real && V.studio && T.MeshPhysicalMaterial && STUDIO[sys];
        mt = st
          ? new T.MeshPhysicalMaterial({ roughness: ATL_REAL.rough[sys] ?? 0.6, metalness: 0, clearcoat: st.cc, clearcoatRoughness: st.ccr, envMapIntensity: 0.5 })
          : new T.MeshStandardMaterial({ roughness: V.real ? ATL_REAL.rough[sys] ?? 0.6 : 0.65, metalness: 0, envMapIntensity: 0.35 });
        const rk = V.real && V.relief ? reliefKind(p) : "";
        if (rk) reliefPatch(mt, rk, p.fib);
        if (V.real && (rk == "lung" || rk == "myo")) mt.roughness = rk == "lung" ? 0.62 : 0.48;
        mt.clippingPlanes = old.clippingPlanes;
        mt.side = p.meta.ds ? T.DoubleSide : old.side;
        // ombrage des sillons pré-calculé dans le modèle (couleurs de sommets)
        mt.vertexColors = !!(p.mesh.geometry.attributes.color && V.real);
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
      // échelle réelle : 1 m du modèle = « echelle » m réels (cellules et tissus agrandis)
      V.k = (g.asset && g.asset.extras && g.asset.extras.echelle) || 1;
      if (g.asset && g.asset.extras && g.asset.extras.source)
        {
          const src = g.asset.extras.source || "",
            cr = [];
          if (/Z-Anatomy|BodyParts3D/.test(src) || !src) cr.push("BodyParts3D © DBCLS · CC BY 4.0");
          if (/Z-Anatomy/.test(src)) cr.push("Z-Anatomy · CC BY-SA 4.0");
          if (/Human Reference Atlas/.test(src)) cr.push("Human Reference Atlas (HuBMAP, NIH) · CC BY 4.0");
          if (/MedRevise \(modèle/.test(src)) cr.push("Modèle MedRevise");
          $("atcr").textContent = cr.join(" · ");
        }
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
      dk("anim").hidden = !(breathKind() || hbOk() || pathsOf().length || movesOf().length);
      toursLoad();
      if (V.tool) toolPanel(V.tool, true);
      if (!present.has("muscle")) V.opSys = "organe";
      atlasIndexSave(model.id, V.parts, V.fiches);
      atlasFicheSave(model.id, V.fiches);
      myoAxis();
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
      setTimeout(() => ATL.v === V && !V.pm && !V.tour && !V.quiz && (draw(), atlasThumbSave(V.id, canvas)), 3500);
      // révision du jour : quiz lancé tout seul sur les structures à retravailler
      if (ATL.auto) {
        const a = ATL.auto;
        ATL.auto = null;
        const P = /^patho:/.test(a) && ATL_PATHO.find((x) => "patho:" + x.id == a);
        if (P) {
          pmStart(P);
          setTimeout(() => ATL.v === V && tourStart({ id: "p-" + P.id, n: P.titre, steps: P.steps }), 700);
        }
        else setTimeout(() => ATL.v === V && quizStart("nom"), 700);
      }
    },
    (e) => {
      if ($("atmsg")) $("atmsg").textContent = "Fichier 3D illisible : " + (e && e.message ? e.message : "erreur");
    },
  );

  // ---------- territoire d'un nerf ou d'une artère : structures qu'il innerve ou vascularise (d'après les fiches) ----------
  function territory(p) {
    const nz = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim(),
      f = V.fiches[p.meta.fiche] || {},
      names = [p.meta.fr, f.titre].filter(Boolean).map(nz),
      keys = new Set();
    names.forEach((n) => {
      keys.add(n);
      keys.add(n.replace(/ (droite?|gauche)s?$/, ""));
    });
    const kind = p.meta.systeme == "nerf" ? /innerv/i : /vascular|irrigation|drainage|art[èe]re/i,
      L = [...keys].filter((k) => k.length >= 6);
    const hit = V.parts.filter((q) => {
      if (q === p) return false;
      const fq = V.fiches[q.meta.fiche];
      if (!fq) return false;
      return fq.rows.some((r) => kind.test(r[0]) && L.some((k) => nz(r[1]).includes(k)));
    });
    if (!hit.length) return toast("Aucune structure de ce modèle n’indique « " + p.meta.fr + " » dans sa fiche.");
    V.sels = new Set([p, ...hit]);
    V.sel = p;
    materials();
    panel();
    frameParts([p, ...hit].filter((q) => visible(q)), 1.4, null, 900);
    toast("Territoire : " + hit.length + " structure" + (hit.length > 1 ? "s" : "") + (p.meta.systeme == "nerf" ? " innervée" : " vascularisée") + (hit.length > 1 ? "s" : "") + " (d’après les fiches)");
  }

  // ---------- dissection progressive : on retire les plans un à un, du superficiel au profond ----------
  const DS_ORDER = [["zone", "Repères et enveloppes"], ["muscle", "Muscles"], ["ligament", "Ligaments"], ["veine", "Veines"], ["artere", "Artères"], ["nerf", "Nerfs"], ["organe", "Organes"], ["valve", "Valves"], ["cartilage", "Cartilages"]];
  function dsSteps() {
    if (V.LN.length > 1) return V.LN.map((n, i) => ({ n, layer: i, hide: [] }));
    const have = DS_ORDER.filter(([y]) => V.parts.some((p) => p.meta.systeme == y));
    if (have.length < 2) return [];
    const st = [{ n: "Tout", layer: 0, hide: [] }];
    for (let i = 0; i < have.length - 1; i++) st.push({ n: "Sans : " + have.slice(0, i + 1).map((h) => h[1].toLowerCase()).join(", "), layer: 0, hide: have.slice(0, i + 1).map((h) => h[0]) });
    return st;
  }
  function dsApply(i) {
    const st = V.ds.steps[i];
    V.ds.i = i;
    V.layer = st.layer;
    V.hSys = new Set([...V.ds.prev.hSys, ...st.hide]);
    if (typeof fadeTo == "function") fadeTo(700);
    else vis();
    bar(
      '<div class="attour"><small>Dissection progressive · ' + (i + 1) + " / " + V.ds.steps.length + "</small><b>" + esc(st.n) + "</b></div>" +
        '<div class="atanb"><button id="atdsp"' + (i ? "" : " disabled") + '>‹</button><button id="atdsg" class="p">' + (V.ds.t ? "Pause" : "Lecture") + '</button><button id="atdsn"' + (i < V.ds.steps.length - 1 ? "" : " disabled") + '>›</button><button id="atdsq">Quitter</button></div>',
    ).classList.add("tour");
    $("atdsp").onclick = () => (dsPause(), dsApply(i - 1));
    $("atdsn").onclick = () => (dsPause(), dsApply(i + 1));
    $("atdsg").onclick = () => (V.ds.t ? dsPause() : dsPlay(), dsApply(V.ds.i));
    $("atdsq").onclick = () => dsStop();
  }
  function dsPlay() {
    clearInterval(V.ds.t);
    V.ds.t = setInterval(() => {
      if (!V.ds || ATL.v !== V) return;
      if (V.ds.i >= V.ds.steps.length - 1) return dsPause(), dsApply(V.ds.i);
      dsApply(V.ds.i + 1);
    }, 2600);
  }
  function dsPause() {
    if (V.ds) clearInterval(V.ds.t), (V.ds.t = 0);
  }
  function dsStart() {
    const steps = dsSteps();
    if (!steps.length) return toast("Ce modèle n’a pas assez de plans pour une dissection.");
    if (V.tour) tourStop();
    V.ds = { steps, i: 0, t: 0, prev: { layer: V.layer, hSys: new Set(V.hSys) } };
    dsApply(0);
    dsPlay();
  }
  function dsStop() {
    if (!V.ds) return;
    dsPause();
    V.layer = V.ds.prev.layer;
    V.hSys = V.ds.prev.hSys;
    V.ds = null;
    bar("");
    if (typeof fadeTo == "function") fadeTo(600);
    else vis();
  }

  // ---------- repères cliniques : foyers d'auscultation, pouls, points douloureux ----------
  function clinToggle(on) {
    V.clin = on ? [] : null;
    let box = $("atclm");
    if (box) box.remove();
    if (!on) return need();
    for (const c of ATL_CLIN[V.id] || []) {
      const at = pmPoint(c);
      if (!at) continue;
      const o = new T.Object3D();
      o.position.copy(at.p.mesh.worldToLocal(at.w.clone()));
      at.p.mesh.add(o);
      V.clin.push({ o, c, p: at.p });
    }
    box = document.createElement("div");
    box.id = "atclm";
    canvas.parentNode.insertBefore(box, $("atlbl"));
    box.innerHTML = V.clin.map((k, i) => '<button class="atclk" data-i="' + i + '"><i></i><span>' + esc(k.c.t) + "</span></button>").join("");
    box.querySelectorAll(".atclk").forEach((b) => (b.onclick = () => toast(V.clin[+b.dataset.i].c.t + " : " + V.clin[+b.dataset.i].c.x)));
    if (!V.clin.length) toast("Aucun repère clinique trouvé dans ce modèle.");
    need();
  }
  function clinLabels(w, h) {
    const box = $("atclm");
    if (!box || !V.clin) return;
    box.querySelectorAll(".atclk").forEach((el) => {
      const k = V.clin[+el.dataset.i];
      k.o.getWorldPosition(wp);
      const xy = k.p.mesh.visible ? proj(wp, w, h) : null;
      el.style.display = xy ? "" : "none";
      if (xy) el.style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)";
    });
  }

  // ---------- dessiner sur le modèle : les traits collent à la surface et tournent avec lui ----------
  const DRAW_COL = ["#ffd23f", "#ff5d73", "#4cc9f0", "#ffffff", "#7bd389"];
  function drawSet(on) {
    V.draw = V.draw || { col: DRAW_COL[0], w: 1, strokes: [], cur: null };
    V.draw.on = on;
    controls.enabled = !on;
    canvas.style.cursor = on ? "crosshair" : "";
  }
  const drawRay = new T.Raycaster(),
    drawNdc = new T.Vector2();
  function drawHit(e) {
    const r = canvas.getBoundingClientRect();
    drawNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    drawRay.setFromCamera(drawNdc, V.cam);
    return drawRay.intersectObjects(V.parts.filter((p) => p.mesh.visible && p.mesh.material.opacity > 0.3).map((p) => p.mesh), false)[0] || null;
  }
  function drawLift(h) {
    const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new T.Vector3();
    return h.point.clone().addScaledVector(n, V.radius * 0.004);
  }
  function drawDown(e) {
    if (!V.draw || !V.draw.on) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    const h = drawHit(e);
    if (!h) return;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    const host = h.object,
      line = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: V.draw.col, depthTest: false }));
    line.renderOrder = 5;
    scene.add(line);
    V.draw.cur = { host, pts: [drawLift(h)], line };
  }
  function drawMove(e) {
    if (!V.draw || !V.draw.on) return;
    e.stopImmediatePropagation();
    const C = V.draw.cur;
    if (!C) return;
    const h = drawHit(e);
    if (!h) return;
    const q = drawLift(h);
    if (q.distanceTo(C.pts[C.pts.length - 1]) < V.radius * 0.004) return;
    C.pts.push(q);
    C.line.geometry.dispose();
    C.line.geometry = new T.BufferGeometry().setFromPoints(C.pts);
    need();
  }
  function drawUp(e) {
    if (!V.draw || !V.draw.on) return;
    e.stopImmediatePropagation();
    const C = V.draw.cur;
    V.draw.cur = null;
    if (!C) return;
    scene.remove(C.line);
    C.line.geometry.dispose();
    C.line.material.dispose();
    if (C.pts.length < 2) C.pts.push(C.pts[0].clone().add(new T.Vector3(V.radius * 0.003, 0, 0)));
    const inv = C.host.matrixWorld.clone().invert(),
      loc = C.pts.map((v) => v.clone().applyMatrix4(inv)),
      ws = C.host.getWorldScale(new T.Vector3()).x,
      g = new T.TubeGeometry(new T.CatmullRomCurve3(loc), Math.min(400, loc.length * 3), (V.radius * 0.0035 * V.draw.w) / ws, 6, false),
      m = new T.Mesh(g, new T.MeshBasicMaterial({ color: V.draw.col }));
    C.host.add(m);
    V.draw.strokes.push(m);
    need();
  }
  canvas.addEventListener("pointerdown", drawDown, true);
  canvas.addEventListener("pointermove", drawMove, true);
  canvas.addEventListener("pointerup", drawUp, true);
  function drawUndo(all) {
    const S = V.draw ? V.draw.strokes : [];
    while (S.length) {
      const m = S.pop();
      m.parent && m.parent.remove(m);
      m.geometry.dispose();
      m.material.dispose();
      if (!all) break;
    }
    need();
  }
  function drawPaint(box) {
    drawSet(true);
    box.innerHTML =
      '<p class="atlbl2">Dessine directement sur les structures : les traits restent collés au modèle quand il tourne. Ferme ce panneau pour tourner le modèle.</p>' +
      '<div class="atdrc">' + DRAW_COL.map((c) => '<button data-c="' + c + '" style="--c:' + c + '"' + (V.draw.col == c ? ' class="on"' : "") + ' aria-label="Couleur"></button>').join("") + "</div>" +
      '<div class="atseg" id="atdrw">' + [[0.6, "Fin"], [1, "Moyen"], [2, "Épais"]].map((q) => '<button data-w="' + q[0] + '"' + (V.draw.w == q[0] ? ' class="on"' : "") + ">" + q[1] + "</button>").join("") + "</div>" +
      '<div class="atpb"><button class="b" id="atdru">Annuler le dernier trait</button><button class="b" id="atdrx">Tout effacer</button><button class="b p" id="atdrs">' + icn("image") + " Enregistrer l’image</button></div>";
    box.querySelectorAll(".atdrc button").forEach((b) => (b.onclick = () => ((V.draw.col = b.dataset.c), drawPaint(box))));
    box.querySelectorAll("#atdrw button").forEach((b) => (b.onclick = () => ((V.draw.w = +b.dataset.w), drawPaint(box))));
    $("atdru").onclick = () => drawUndo(false);
    $("atdrx").onclick = () => drawUndo(true);
    $("atdrs").onclick = () => {
      draw();
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "atlas-" + V.id + "-dessin.png";
      a.click();
    };
  }

  // ---------- pathologies : version modifiée de l'atlas ----------
  const pmFind = (n) => {
    if (n && n.re) {
      const re = new RegExp(n.re);
      return V.parts.filter((p) => re.test(p.meta.fr));
    }
    const ns = [].concat(n);
    return V.parts.filter((p) => ns.includes(p.meta.fiche) || ns.includes(p.meta.fr));
  };
  const CM = 0.01;
  function pmVerts(p, max) {
    const a = p.mesh.geometry.attributes.position,
      st = Math.max(1, Math.floor(a.count / (max || 1e9))),
      out = [];
    p.mesh.updateWorldMatrix(true, false);
    for (let i = 0; i < a.count; i += st) out.push(new T.Vector3().fromBufferAttribute(a, i).applyMatrix4(p.mesh.matrixWorld));
    return out;
  }
  function pmPoint(m) {
    const p = pmFind(m.on)[0];
    if (!p) return null;
    const vs = pmVerts(p, 5000);
    let tg;
    if (m.to) {
      const q = pmFind(m.to)[0];
      if (!q) return null;
      tg = new T.Box3().setFromObject(q.mesh).getCenter(new T.Vector3());
    } else {
      const b = new T.Box3().setFromPoints(vs),
        f = m.frac || [0.5, 0.5, 0.5];
      tg = new T.Vector3(b.min.x + (b.max.x - b.min.x) * f[0], b.min.y + (b.max.y - b.min.y) * f[1], b.min.z + (b.max.z - b.min.z) * f[2]);
    }
    let best = vs[0],
      bd = Infinity;
    for (const v of vs) {
      const d = v.distanceToSquared(tg);
      if (d < bd) (bd = d), (best = v);
    }
    const w = best.clone();
    if (m.off) w.add(new T.Vector3(...m.off).multiplyScalar(CM));
    return { p, w };
  }
  // petite masse organique (caillot, hernie, œuf…) accrochée à une structure
  function pmBlob(m) {
    const at = pmPoint(m);
    if (!at) return;
    const g = new T.SphereGeometry(1, 28, 20),
      a = g.attributes.position,
      v = new T.Vector3(),
      sq = m.sq || [1, 1, 1];
    for (let i = 0; i < a.count; i++) {
      v.fromBufferAttribute(a, i);
      const n = 1 + 0.09 * Math.sin(v.x * 5.1 + 1) * Math.cos(v.y * 4.3) + 0.05 * Math.sin(v.z * 7.7 + v.x * 3);
      a.setXYZ(i, v.x * n * sq[0], v.y * n * sq[1], v.z * n * sq[2]);
    }
    g.computeVertexNormals();
    const o = new T.Mesh(g, new T.MeshStandardMaterial({ color: m.col || "#2a0509", roughness: 0.45, metalness: 0 })),
      ws = at.p.mesh.getWorldScale(new T.Vector3());
    o.position.copy(at.p.mesh.worldToLocal(at.w.clone()));
    o.scale.set((m.r * CM) / ws.x, (m.r * CM) / ws.y, (m.r * CM) / ws.z);
    at.p.mesh.add(o);
    V.pm.undo.push(() => (at.p.mesh.remove(o), g.dispose(), o.material.dispose()));
    if (m.fr) V.pm.marks.push({ o, t: m.fr });
  }
  // zone de tissu atteint : les triangles proches d'une structure (artère bouchée…), du plus sombre au plus clair
  function pmPatch(m) {
    const near = [].concat(...pmFind(m.near).map((q) => pmVerts(q, 700)));
    if (!near.length) return;
    const R = m.r * CM,
      c1 = new T.Color(m.col || "#3d0d22"),
      c2 = new T.Color(m.col2 || m.col || "#a04a5e"),
      A = new T.Vector3(),
      B = new T.Vector3(),
      C = new T.Vector3(),
      G = new T.Vector3();
    let first = null;
    for (const p of pmFind(m.on)) {
      const g0 = p.mesh.geometry,
        pa = g0.attributes.position,
        na = g0.attributes.normal,
        ix = g0.index,
        nt = ix ? ix.count / 3 : pa.count / 3,
        M = p.mesh.matrixWorld,
        pos = [],
        col = [],
        ws = p.mesh.getWorldScale(new T.Vector3()),
        eps = (0.25 * CM) / ws.x;
      const dmin = (w) => {
        let d = Infinity;
        for (const q of near) {
          const e = q.distanceToSquared(w);
          if (e < d) d = e;
        }
        return Math.sqrt(d);
      };
      for (let t = 0; t < nt; t++) {
        const i0 = ix ? ix.getX(3 * t) : 3 * t,
          i1 = ix ? ix.getX(3 * t + 1) : 3 * t + 1,
          i2 = ix ? ix.getX(3 * t + 2) : 3 * t + 2;
        A.fromBufferAttribute(pa, i0);
        B.fromBufferAttribute(pa, i1);
        C.fromBufferAttribute(pa, i2);
        G.copy(A).add(B).add(C).divideScalar(3).applyMatrix4(M);
        const d = dmin(G);
        if (d > R) continue;
        const k = Math.min(1, Math.max(0, (d / R - 0.6) / 0.4)),
          cc = c1.clone().lerp(c2, k);
        for (const i of [i0, i1, i2]) {
          const nx = na ? na.getX(i) : 0,
            ny = na ? na.getY(i) : 0,
            nz = na ? na.getZ(i) : 0;
          pos.push(pa.getX(i) + nx * eps, pa.getY(i) + ny * eps, pa.getZ(i) + nz * eps);
          col.push(cc.r, cc.g, cc.b);
        }
      }
      if (!pos.length) continue;
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      const o = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      o.material.clippingPlanes = p.mesh.material.clippingPlanes;
      p.mesh.add(o);
      first = first || o;
      V.pm.undo.push(() => (p.mesh.remove(o), g.dispose(), o.material.dispose()));
    }
    if (first && m.fr) {
      first.geometry.computeBoundingBox();
      const c = new T.Object3D();
      first.geometry.boundingBox.getCenter(c.position);
      first.parent.add(c);
      V.pm.undo.push(() => c.parent && c.parent.remove(c));
      V.pm.marks.push({ o: c, t: m.fr });
    }
  }
  // gonflement : la géométrie grossit autour de son centre
  function pmScale(m) {
    for (const p of pmFind(m.f)) {
      const g = p.mesh.geometry,
        old = g.attributes.position.array.slice();
      g.computeBoundingBox();
      const c = g.boundingBox.getCenter(new T.Vector3());
      g.translate(-c.x, -c.y, -c.z).scale(m.s, m.s, m.s).translate(c.x, c.y, c.z);
      g.computeBoundingSphere();
      if (g.computeBoundsTree) g.computeBoundsTree();
      V.pm.undo.push(() => {
        g.attributes.position.array.set(old);
        g.attributes.position.needsUpdate = true;
        g.computeBoundingBox();
        g.computeBoundingSphere();
        if (g.computeBoundsTree) g.computeBoundsTree();
      });
      if (m.fr) {
        const o = new T.Object3D();
        o.position.copy(c);
        p.mesh.add(o);
        V.pm.undo.push(() => p.mesh.remove(o));
        V.pm.marks.push({ o, t: m.fr });
        m = { ...m, fr: "" };
      }
    }
  }
  // rupture ou fracture : la structure est coupée en deux morceaux déplacés
  function pmTear(m) {
    for (const p of pmFind(m.f)) {
      const g0 = p.mesh.geometry,
        g = g0.index ? g0.toNonIndexed() : g0.clone(),
        pa = g.attributes.position,
        M = p.mesh.matrixWorld.clone(),
        Mi = M.clone().invert(),
        bb = new T.Box3().setFromObject(p.mesh),
        yc = m.ytop != null ? bb.max.y - m.ytop * CM : bb.min.y + (bb.max.y - bb.min.y) * m.y,
        piv = new T.Vector3((bb.min.x + bb.max.x) / 2, yc, (bb.min.z + bb.max.z) / 2),
        up = new T.Vector3(...(m.up || [0, 0, 0])).multiplyScalar(CM),
        dn = new T.Vector3(...(m.down || [0, 0, 0])).multiplyScalar(CM),
        q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), T.MathUtils.degToRad(m.tilt || 0)),
        P = [[], []],
        N = [[], []],
        na = g.attributes.normal,
        v = new T.Vector3();
      for (let t = 0; t < pa.count; t += 3) {
        let cy = 0;
        for (let j = 0; j < 3; j++) cy += v.fromBufferAttribute(pa, t + j).applyMatrix4(M).y;
        const lo = cy / 3 < yc ? 1 : 0;
        for (let j = 0; j < 3; j++) {
          v.fromBufferAttribute(pa, t + j).applyMatrix4(M);
          if (lo) v.sub(piv).applyQuaternion(q).add(piv).add(dn);
          else v.add(up);
          v.applyMatrix4(Mi);
          P[lo].push(v.x, v.y, v.z);
          if (na) N[lo].push(na.getX(t + j), na.getY(t + j), na.getZ(t + j));
        }
      }
      g.dispose();
      const mk = (k) => {
        const h = new T.BufferGeometry();
        h.setAttribute("position", new T.Float32BufferAttribute(P[k], 3));
        if (na) h.setAttribute("normal", new T.Float32BufferAttribute(N[k], 3));
        else h.computeVertexNormals();
        if (h.computeBoundsTree) h.computeBoundsTree();
        return h;
      };
      const gTop = mk(0),
        lowM = new T.Mesh(mk(1), p.mesh.material);
      p.mesh.geometry = gTop;
      p.mesh.add(lowM);
      V.pm.undo.push(() => {
        p.mesh.geometry = g0;
        p.mesh.remove(lowM);
        gTop.dispose();
        lowM.geometry.dispose();
      });
      if (m.col) V.pTint.set(p, parseInt(m.col.slice(1), 16));
      if (m.fr) {
        const o = new T.Object3D();
        o.position.copy(p.mesh.worldToLocal(piv.clone()));
        p.mesh.add(o);
        V.pm.undo.push(() => p.mesh.remove(o));
        V.pm.marks.push({ o, t: m.fr });
        m = { ...m, fr: "" };
      }
    }
  }
  function pmApply() {
    const P = V.pm.P;
    V.pm.undo = [];
    V.pm.marks = [];
    V.pTint = new Map();
    V.pHide = new Set();
    for (const m of ATL_PMODS[P.id] || [])
      try {
        if (m.k == "blob") pmBlob(m);
        else if (m.k == "patch") pmPatch(m);
        else if (m.k == "scale") pmScale(m);
        else if (m.k == "tear") pmTear(m);
        else if (m.k == "tint") pmFind(m.f).forEach((p) => V.pTint.set(p, parseInt(m.col.slice(1), 16)));
        else if (m.k == "hide") pmFind(m.f).forEach((p) => V.pHide.add(p));
      } catch (e) {
        console.warn("pathologie", P.id, m.k, e);
      }
    V.pm.on = true;
    pmMarks();
    vis();
    materials(true);
  }
  function pmClear() {
    if (!V.pm) return;
    (V.pm.undo || []).reverse().forEach((f) => f());
    V.pm.undo = [];
    V.pm.marks = [];
    V.pm.on = false;
    V.pTint = null;
    V.pHide = null;
    pmMarks();
    vis();
    materials(true);
  }
  function pmMarks() {
    let box = $("atpml");
    if (!box) {
      box = document.createElement("div");
      box.id = "atpml";
      canvas.parentNode.insertBefore(box, $("atlbl"));
    }
    box.innerHTML = (V.pm && V.pm.marks ? V.pm.marks : []).map((k, i) => '<div class="atpmk" data-i="' + i + '"><i></i><span>' + esc(k.t) + "</span></div>").join("");
  }
  function pmLabels(w, h) {
    const box = $("atpml");
    if (!box) return;
    box.querySelectorAll(".atpmk").forEach((el) => {
      const k = V.pm.marks[+el.dataset.i];
      if (!k) return;
      let vis2 = k.o.parent && k.o.parent.visible;
      for (let o = k.o.parent; o && vis2; o = o.parent) vis2 = o.visible !== false;
      k.o.getWorldPosition(wp);
      const xy = vis2 && (!V.clip.axis || V.clip.plane.distanceToPoint(wp) >= 0) ? proj(wp, w, h) : null;
      el.style.display = xy ? "" : "none";
      if (xy) el.style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)";
    });
  }
  function pmTitle() {
    const b = document.querySelector("#atmsw b");
    if (b) b.textContent = V.pm ? (ATL.models.find((m) => m.id == V.id) || {}).titre + " · " + V.pm.P.titre : (ATL.models.find((m) => m.id == V.id) || {}).titre;
  }
  V.pathoOpen = (P) => {
    if (V.tour) tourStop();
    if (V.pm) pmStop();
    pmStart(P);
    tourStart({ id: "p-" + P.id, n: P.titre, steps: P.steps });
  };
  function pmStart(P) {
    V.pm = { P, on: false };
    pmApply();
    pmTitle();
  }
  function pmStop() {
    pmClear();
    if (V.pm.fade) V.pm.fade.forEach((op, p) => (p.meta.op = op));
    V.pm = null;
    V.hSys = new Set();
    V.hOne = new Set();
    materials();
    vis();
    pmTitle();
    bar("");
    const box = $("atpml");
    if (box) box.remove();
  }
  function pmScene() {
    const S = ATL_PSCENE[V.pm.P.id];
    if (!S) return;
    V.hSys = new Set((S.hide || []).filter((y) => V.parts.some((p) => p.meta.systeme == y)));
    V.layer = 0;
    V.hOne = new Set(S.hideF ? pmFind(S.hideF) : []);
    for (const p of S.fade ? pmFind(S.fade) : []) {
      if (!V.pm.fade) V.pm.fade = new Map();
      if (!V.pm.fade.has(p)) V.pm.fade.set(p, p.meta.op);
      p.meta.op = 0.3;
    }
    vis();
    materials();
    const fr = S.frame ? pmFind(S.frame).filter((p) => visible(p)) : [];
    V.view = S.view || V.view;
    frameParts(fr.length ? fr : V.parts.filter((p) => visible(p)), fr.length ? 1.9 : 1.05, new T.Vector3(...VIEWS[S.view || "front"]), 1100);
  }
  function pmBar() {
    const P = V.pm.P;
    pmScene();
    bar(
      '<div class="attour"><small>Atlas modifié · pathologie</small><b>' + esc(P.titre) + "</b><p>" + esc(P.sous) + "</p></div>" +
        '<div class="atanb"><button id="atpmn">' + (V.pm.on ? "Voir le normal" : "Voir la pathologie") + '</button><button id="atpmt" class="p">Parcours</button><button id="atpmq">Revenir à l’atlas normal</button></div>',
    ).classList.add("tour");
    $("atpmn").onclick = () => {
      V.pm.on ? pmClear() : pmApply();
      pmBar();
    };
    $("atpmt").onclick = () => {
      if (!V.pm.on) pmApply();
      tourStart({ id: "p-" + P.id, n: P.titre, steps: P.steps });
    };
    $("atpmq").onclick = () => pmStop();
  }

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
      if (V.mv && V.mv.set.has(p)) {
        const o = V.mv.loc.get(p);
        m.position.sub(o.P).applyQuaternion(o.q).add(o.P);
        m.quaternion.premultiply(o.q);
        continue;
      }
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
    !V.hSys.has(p.meta.systeme) && !V.hOne.has(p) && !(V.pHide && V.pHide.has(p)) && (!V.iso || V.iso.has(p)) && p.layer >= V.layer && !(V.ghost && V.q.lvl >= 1 && !V.ghost.has(p));
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
  // rapports anatomiques : structures au contact, rangées par direction (avant, arrière, haut, bas, dedans, dehors)
  function contacts(p) {
    const cell = Math.min(0.006, Math.max(0.0012, (V.radius || 0.4) * 0.009)),
      key = (x, y, z) => x + "," + y + "," + z,
      grid = new Set();
    for (const v of samplePts(p, 2500)) {
      const cx = Math.floor(v.x / cell), cy = Math.floor(v.y / cell), cz = Math.floor(v.z / cell);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) grid.add(key(cx + i, cy + j, cz + k));
    }
    const box = new T.Box3().setFromObject(p.mesh).expandByScalar(cell * 2);
    return V.parts.filter(
      (q) => q !== p && q.meta.systeme != "zone" && box.intersectsBox(new T.Box3().setFromObject(q.mesh)) &&
        samplePts(q, 900).some((v) => grid.has(key(Math.floor(v.x / cell), Math.floor(v.y / cell), Math.floor(v.z / cell)))),
    );
  }
  function rapports(p) {
    const el = $("atrapb");
    if (!el) return;
    if (el.innerHTML) return (el.innerHTML = "");
    el.innerHTML = '<p class="atrapw">Recherche des structures au contact…</p>';
    setTimeout(() => {
      const qs = contacts(p),
        G = { "En avant": [], "En arrière": [], "Au-dessus": [], "Au-dessous": [], "En dedans": [], "En dehors": [] },
        side = Math.abs(p.c.x) > (V.ext ? V.ext.x * 0.06 : 0.01);
      for (const q of qs) {
        const d = q.c.clone().sub(p.c),
          ax = Math.abs(d.x) / (p.size.x + q.size.x || 1),
          ay = Math.abs(d.y) / (p.size.y + q.size.y || 1),
          az = Math.abs(d.z) / (p.size.z + q.size.z || 1);
        let g;
        if (ay >= ax && ay >= az) g = d.y > 0 ? "Au-dessus" : "Au-dessous";
        else if (az >= ax) g = d.z > 0 ? "En avant" : "En arrière";
        else if (side) g = Math.abs(q.c.x) < Math.abs(p.c.x) ? "En dedans" : "En dehors";
        else g = "En dehors";
        G[g].push(q);
      }
      const rows = Object.entries(G).filter(([, l]) => l.length);
      el.innerHTML = rows.length
        ? '<div class="atrap"><b>Rapports</b><small>Structures au contact dans le modèle 3D (à confronter à ton cours).</small>' +
          rows.map(([g, l]) => "<div><span>" + g + "</span><p>" + l.map((q) => '<button data-i="' + V.parts.indexOf(q) + '">' + esc(q.meta.fr) + "</button>").join("") + "</p></div>").join("") +
          "</div>"
        : '<p class="atrapw">Aucune structure au contact dans ce modèle.</p>';
      el.querySelectorAll("button[data-i]").forEach((b) => (b.onclick = () => focusPart(V.parts[+b.dataset.i])));
    }, 30);
  }
  // ---------- colorer par innervation ou par vascularisation (d'après les fiches) ----------
  const GRP_PAL = [0xf94144, 0xf3722c, 0xf9c74f, 0x90be6d, 0x43aa8b, 0x4d908e, 0x577590, 0x277da1, 0x9b5de5, 0xf15bb5, 0x00bbf9, 0x00f5d4, 0xfee440, 0xb5838d, 0x6d6875, 0xe5989b];
  const grpNorm = (t) =>
    t.toLowerCase().replace(/\s*\(.*?\)\s*/g, " ").replace(/\b(droite?s?|gauches?)\b/g, "").replace(/\s+/g, " ").replace(/^(le|la|les|l') /, "").trim();
  function grpKey(p, mode) {
    const sy = p.meta.systeme;
    if (mode == "nerf" && sy == "nerf") return grpNorm(p.meta.fr);
    if (mode == "art" && sy == "artere") return grpNorm(p.meta.fr);
    const f = V.fiches[p.meta.fiche];
    if (!f) return null;
    const re = mode == "nerf" ? /innerv/i : /vascular|irrigation|artère|artères/i;
    const row = f.rows.find((r) => re.test(r[0]));
    if (!row) return null;
    const m = mode == "nerf" ? row[1].match(/\b(nerfs?|rameaux?|branches?|plexus)\b[^,;.:()]*/i) : row[1].match(/\b(art[èe]res?|tronc|branches?)\b[^,;.:()]*/i);
    return m ? grpNorm(m[0]).replace(/^nerfs /, "nerf ").replace(/^artères /, "artère ") : null;
  }
  function grpBuild() {
    if (!V.colBy) return (V.grp = null);
    const g = new Map();
    for (const p of V.parts) {
      const k = grpKey(p, V.colBy);
      if (!k) continue;
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(p);
    }
    const list = [...g.entries()].sort((a, b) => b[1].length - a[1].length),
      of = new Map();
    list.forEach(([k, ps], i) => ps.forEach((p) => of.set(p, GRP_PAL[i % GRP_PAL.length])));
    V.grp = { list, of };
  }
  function grpLegend() {
    if (!V.grp) return "";
    if (!V.grp.list.length) return '<p class="atgrn">Aucune fiche de ce modèle ne précise ' + (V.colBy == "nerf" ? "l’innervation" : "la vascularisation") + ".</p>";
    return (
      '<div class="atgrl">' +
      V.grp.list
        .slice(0, 24)
        .map(([k, ps], i) => '<button data-g="' + i + '"><i style="background:#' + GRP_PAL[i % GRP_PAL.length].toString(16).padStart(6, "0") + '"></i>' + esc(k[0].toUpperCase() + k.slice(1)) + " <small>" + ps.length + "</small></button>")
        .join("") +
      '</div><p class="atgrn">Les structures sans information restent grises. Touche un groupe pour le sélectionner.</p>'
    );
  }
  // ---------- mouvements articulaires animés : le segment distal tourne autour de l'articulation, les muscles moteurs sont surlignés ----------
  // déclarations de fonctions : utilisables pendant le chargement du modèle (avant la fin de l'initialisation)
  function movesData() {
    return {
    "membre-sup": [
      { n: "Flexion du coude", d: "Muscles brachial, biceps et brachio-radial (nerfs musculo-cutané et radial).", f: "humerus", at: "min", ax: "x", deg: -125, agon: ["brachialis", "biceps brachii", "brachioradialis"] },
      { n: "Abduction de l’épaule", d: "Deltoïde (nerf axillaire) et supra-épineux (nerf suprascapulaire).", f: "humerus", at: "max", ax: "z", deg: 85, lat: 1, agon: ["deltoid", "supraspinatus"] },
      { n: "Flexion du poignet", d: "Fléchisseurs radial et ulnaire du carpe, long palmaire.", f: "radius", at: "min", ax: "x", deg: -65, agon: ["flexor carpi radialis", "flexor carpi ulnaris", "palmaris longus"] },
    ],
    main: [{ n: "Flexion du poignet", d: "Fléchisseurs radial et ulnaire du carpe, long palmaire.", f: "radius", at: "min", ax: "x", deg: -65, agon: ["flexor carpi radialis", "flexor carpi ulnaris", "palmaris longus"] }],
    epaule: [{ n: "Abduction de l’épaule", d: "Deltoïde (nerf axillaire) et supra-épineux (nerf suprascapulaire).", f: "humerus", at: "max", ax: "z", deg: 85, lat: 1, agon: ["deltoid", "supraspinatus"] }],
    "membre-inf": [
      { n: "Flexion de la hanche", d: "Ilio-psoas (plexus lombal, nerf fémoral), droit fémoral, sartorius.", f: "femur", at: "max", ax: "x", deg: -80, gap: 0.05, agon: ["iliacus", "psoas major", "quadriceps", "sartorius"] },
      { n: "Flexion du genou", d: "Ischio-jambiers (nerf ischiatique), gastrocnémien.", f: "femur", at: "min", ax: "x", deg: 110, agon: ["hamstrings", "triceps surae"] },
      { n: "Flexion plantaire", d: "Triceps sural (nerf tibial).", f: "tibia", at: "min", ax: "x", deg: 35, agon: ["triceps surae"] },
    ],
    genou: [{ n: "Flexion du genou", d: "Ischio-jambiers (nerf ischiatique), gastrocnémien, poplité.", f: "femur", at: "min", ax: "x", deg: 110, agon: ["hamstrings", "triceps surae", "deep posterior leg"] }],
    bouche: [{ n: "Ouverture de la bouche", d: "Muscles sus-hyoïdiens et ptérygoïdiens latéraux ; la mandibule tourne puis glisse en avant.", f: "tmj", at: "mid", ax: "x", deg: 22, jaw: 1, agon: ["suprahyoid"] }],
  };
  }
  function movesOf() {
    return movesData()[model.id] || [];
  }
  function mvStart(M) {
    mvStop(true);
    V.breath.on && breathStop();
    V.hb.on && hbStop();
    V.path && pathStop(true);
    pose();
    // tout se calcule dans l'espace du monde (le modèle peut être tourné), puis dans le repère de chaque structure
    const wb = (p) => new T.Box3().setFromObject(p.mesh),
      ref = V.parts.filter((p) => p.meta.fiche == M.f);
    if (!ref.length) return toast("Structure de référence absente de ce modèle.");
    const bx = new T.Box3();
    ref.forEach((p) => bx.union(wb(p)));
    const P = bx.getCenter(new T.Vector3()),
      H = bx.max.y - bx.min.y;
    if (M.at == "min") P.y = bx.min.y + H * 0.03;
    if (M.at == "max") P.y = bx.max.y - H * 0.04;
    const side = Math.sign(P.x) || 1,
      lowY = P.y - (M.gap || 0.004) * (V.radius || 1),
      ctr = (p) => wb(p).getCenter(new T.Vector3());
    let moving;
    if (M.jaw) moving = V.parts.filter((p) => p.meta.fiche == "mandible" || (/inférieure/.test(p.meta.fr) && /incisive|canine|molaire/i.test(p.meta.fr)) || (p.meta.fiche == "dental nerves" && /inférieur/.test(p.meta.fr)));
    else
      moving = V.parts.filter((p) => {
        const c = ctr(p);
        return c.y < lowY && (!M.lat || Math.abs(c.x) > Math.abs(P.x) * 0.92);
      });
    if (!moving.length) return;
    const axis = new T.Vector3(M.ax == "x" ? 1 : 0, M.ax == "y" ? 1 : 0, M.ax == "z" ? 1 : 0),
      ang = T.MathUtils.degToRad(M.deg) * (M.lat ? side : 1),
      loc = new Map(),
      iq = new T.Quaternion();
    for (const p of moving) {
      const par = p.mesh.parent;
      par.updateWorldMatrix(true, false);
      par.getWorldQuaternion(iq);
      loc.set(p, { P: par.worldToLocal(P.clone()), a: axis.clone().applyQuaternion(iq.clone().invert()).normalize(), q: new T.Quaternion() });
    }
    V.mv = { M, ang, loc, set: new Set(moving), t0: performance.now() };
    const ag = V.parts.filter((p) => M.agon.includes(p.meta.fiche));
    V.sels = new Set(ag);
    V.sel = null;
    materials();
    mvBar();
    dockState();
  }
  function mvTick(now) {
    const m = V.mv,
      s = (1 - Math.cos(((now - m.t0) / 3200) * Math.PI * 2)) / 2;
    for (const o of m.loc.values()) o.q.setFromAxisAngle(o.a, m.ang * s);
    pose();
  }
  function mvStop(quiet) {
    if (!V.mv) return;
    V.mv = null;
    pose();
    need();
    bar(null);
    dockState();
    if (!quiet && V.tool == "anim") toolPanel("anim", true);
  }
  function mvBar() {
    bar(
      '<div class="attour"><small>Mouvement</small><b>' + esc(V.mv.M.n) + "</b><p>" + esc(V.mv.M.d) + " Les muscles moteurs sont surlignés.</p></div>" +
        '<div class="atanb"><button id="atmvx">Arrêter</button></div>',
    );
    $("atmvx").onclick = () => mvStop();
  }
  // ---------- défilement des coupes comme au scanner : la liste des structures coupées suit le curseur ----------
  function cutList() {
    const el = $("atcutl");
    if (!el) return;
    const a = V.clip.axis;
    if (!a) return (el.innerHTML = "");
    const lvl = V.clip.plane.constant,
      bb = new T.Box3(),
      hit = V.parts.filter((p) => p.mesh.visible && p.meta.systeme != "zone" && (bb.setFromObject(p.mesh), bb.min[a] <= lvl && bb.max[a] >= lvl));
    const lab = { y: "Niveau", z: "Plan frontal", x: "Plan sagittal" }[a];
    el.innerHTML =
      '<p class="atlbl2" style="margin:10px 0 6px">' + lab + " : " + hit.length + " structure" + (hit.length > 1 ? "s" : "") + " coupée" + (hit.length > 1 ? "s" : "") + "</p>" +
      '<div class="atcutc">' +
      hit
        .sort((x, y) => Object.keys(ATL.sysFr).indexOf(x.meta.systeme) - Object.keys(ATL.sysFr).indexOf(y.meta.systeme))
        .slice(0, 40)
        .map((p) => '<button data-i="' + V.parts.indexOf(p) + '"><i style="background:#' + colorOf(p).toString(16).padStart(6, "0") + '"></i>' + esc(p.meta.fr) + "</button>")
        .join("") +
      (hit.length > 40 ? "<small>… et " + (hit.length - 40) + " autres</small>" : "") +
      "</div>";
    el.querySelectorAll("button[data-i]").forEach((b) => (b.onclick = () => (scanStop(), focusPart(V.parts[+b.dataset.i]))));
  }
  let scanT = 0;
  function scanStop() {
    if (!V.scan) return;
    cancelAnimationFrame(V.scan.raf);
    V.scan = null;
    const b = $("atscan");
    if (b) b.textContent = "▶ Défiler";
  }
  function scanStart() {
    if (!V.clip.axis) {
      V.clip.axis = "y";
      V.clip.pos = 100;
      toolPanel("cut", true);
    }
    const t0 = performance.now(),
      from = V.clip.pos > -90 ? V.clip.pos : 100,
      dur = ((from + 100) / 200) * 14000;
    V.scan = { raf: 0 };
    const b = $("atscan");
    if (b) b.textContent = "■ Arrêter";
    const step = (now) => {
      if (!V.scan || !V.alive) return;
      const u = Math.min(1, (now - t0) / Math.max(dur, 1));
      V.clip.pos = Math.round(from - u * (from + 100));
      if ($("atcp")) $("atcp").value = V.clip.pos;
      clip();
      need();
      if (now - scanT > 260) ((scanT = now), cutList());
      if (u < 1) V.scan.raf = requestAnimationFrame(step);
      else scanStop();
    };
    V.scan.raf = requestAnimationFrame(step);
  }
  // ---------- schéma à compléter : la vue actuelle avec des numéros, à imprimer ou à garder, et son corrigé ----------
  function schemaParts() {
    if (V.sels.size >= 2) return [...V.sels];
    const cw = canvas.clientWidth,
      ch = canvas.clientHeight,
      seen = new Set(),
      out = [];
    const cand = V.parts
      .filter((p) => p.mesh.visible && !p.zone && p.mesh.material.opacity > 0.3)
      .map((p) => {
        const b = new T.Box3().setFromObject(p.mesh),
          xy = proj(b.getCenter(new T.Vector3()), cw, ch);
        return { p, xy, s: p.size.x * p.size.y + p.size.y * p.size.z + p.size.x * p.size.z };
      })
      .filter((o) => o.xy && o.xy[0] > 30 && o.xy[0] < cw - 30 && o.xy[1] > 30 && o.xy[1] < ch - 30)
      .sort((a, b) => b.s - a.s);
    for (const o of cand) {
      const k = o.p.meta.fiche || o.p.meta.fr;
      if (seen.has(k) || out.some((q) => Math.hypot(q.xy[0] - o.xy[0], q.xy[1] - o.xy[1]) < 34)) continue;
      seen.add(k);
      out.push(o);
      if (out.length >= 12) break;
    }
    return out.map((o) => o.p);
  }
  function schemaSheet() {
    const list = schemaParts();
    if (list.length < 2) return toast("Affiche au moins deux structures (ou sélectionnes-en plusieurs).");
    const keep = V.sels;
    V.sels = new Set();
    materials();
    draw();
    const W = canvas.width,
      H = canvas.height,
      sc = Math.min(1, 1100 / W),
      iw = Math.round(W * sc),
      ih = Math.round(H * sc),
      colW = Math.round(iw * 0.42),
      pad = 28,
      mk = (key) => {
        const c = document.createElement("canvas");
        c.width = iw + colW + pad * 3;
        c.height = Math.max(ih, 120 + list.length * 46) + pad * 2 + 40;
        const g = c.getContext("2d");
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = "#0e141d";
        g.fillRect(pad, pad + 40, iw, ih);
        g.drawImage(canvas, pad, pad + 40, iw, ih);
        g.fillStyle = "#111";
        g.font = "700 22px Inter, sans-serif";
        g.textBaseline = "alphabetic";
        g.fillText((key ? "Corrigé · " : "Schéma à compléter · ") + model.titre, pad, pad + 22);
        const cw = canvas.clientWidth,
          ch = canvas.clientHeight,
          k = iw / cw,
          R = Math.max(12, Math.round(iw / 60));
        list.forEach((p, i) => {
          const b = new T.Box3().setFromObject(p.mesh),
            xy = proj(b.getCenter(new T.Vector3()), cw, ch);
          if (!xy) return;
          const x = pad + xy[0] * k,
            y = pad + 40 + xy[1] * k;
          g.beginPath();
          g.arc(x, y, R, 0, Math.PI * 2);
          g.fillStyle = "#ffd33d";
          g.fill();
          g.lineWidth = Math.max(2, R / 6);
          g.strokeStyle = "#111";
          g.stroke();
          g.fillStyle = "#111";
          g.font = "700 " + Math.round(R * 1.1) + "px Inter, sans-serif";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(String(i + 1), x, y + 1);
        });
        g.textAlign = "left";
        g.textBaseline = "alphabetic";
        const x0 = pad * 2 + iw;
        list.forEach((p, i) => {
          const y = pad + 80 + i * 46;
          g.fillStyle = "#111";
          g.font = "700 17px Inter, sans-serif";
          g.fillText(i + 1 + ".", x0, y);
          if (key) {
            g.font = "500 16px Inter, sans-serif";
            g.fillStyle = "#1d4ed8";
            g.fillText(p.meta.fr.length > 46 ? p.meta.fr.slice(0, 45) + "…" : p.meta.fr, x0 + 30, y);
          } else {
            g.strokeStyle = "#999";
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(x0 + 30, y + 4);
            g.lineTo(x0 + colW, y + 4);
            g.stroke();
          }
        });
        g.font = "500 12px Inter, sans-serif";
        g.fillStyle = "#888";
        g.fillText("MedRevise · atlas 3D", pad, c.height - 14);
        return c;
      };
    const blank = mk(false),
      corr = mk(true);
    V.sels = keep;
    materials();
    const dl = (c, n) => {
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = n + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    const box = $("attool");
    V.schema = { blank, corr, list };
    toolPanel("schema");
  }
  function schemaPaint(box) {
    const S2 = V.schema;
    if (!S2) return (box.innerHTML = "");
    box.innerHTML =
      '<img class="atschi" alt="Schéma à compléter" src="' + S2.blank.toDataURL("image/jpeg", 0.8) + '">' +
      '<p class="atnote">' + S2.list.length + " structures numérotées. Télécharge le schéma pour l’imprimer ou le compléter, et le corrigé à part.</p>" +
      '<div class="atpb"><button class="b p" id="atschb">Télécharger le schéma</button><button class="b" id="atschc">Télécharger le corrigé</button><button class="b" id="atschf">' + icn("cards") + " En faire des flashcards</button></div>";
    const dl = (c, n) => {
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = n + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    const nm = "Schéma " + model.titre;
    $("atschb").onclick = () => dl(S2.blank, nm);
    $("atschc").onclick = () => dl(S2.corr, nm + " - corrigé");
    $("atschf").onclick = () => {
      V.sels = new Set(S2.list);
      snapCards();
      V.sels = new Set();
    };
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
      anim: V.tool == "anim" || V.breath.on || V.hb.on || !!V.path || !!V.mv,
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
    schema: () => schemaSheet(),
    dessin: () => toolPanel("dessin"),
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
  const TITLES = { dessin: "Dessiner sur le modèle", schema: "Schéma à compléter", anim: "Animations", tour: "Parcours guidés", vues: "Vues enregistrées", struct: "Structures", disp: "Affichage", ex: "Écarter les structures", cut: "Coupe", lay: "Couches", tr: "Transparence", more: "Plus d’outils" };
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
    if (V.tool == "dessin") return drawPaint(box);
    if (V.draw && V.draw.on) drawSet(false);
    if (V.tool == "schema") return schemaPaint(box);
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
        '<div class="atr atwrap"><span class="atlbl2">Colorer par</span><div class="atseg" id="atcby">' +
        [["", "Rien"], ["nerf", "Innervation"], ["art", "Vascularisation"]].map((q) => '<button data-b="' + q[0] + '"' + ((V.colBy || "") == q[0] ? ' class="on"' : "") + ">" + q[1] + "</button>").join("") +
        "</div></div>" + grpLegend() +
        '<div class="atr atwrap"><span class="atlbl2">Qualité</span><div class="atseg" id="atqual">' +
        [["auto", "Automatique"], ["high", "Haute"], ["eco", "Économie"]].map((q) => '<button data-q="' + q[0] + '"' + (V.qMode == q[0] ? ' class="on"' : "") + ">" + q[1] + "</button>").join("") +
        "</div></div>" +
        '<div class="atsws">' +
        sw("atsrel", "Relief des tissus", V.relief, "avec les couleurs réalistes") +
        sw("atsstu", "Rendu studio", V.studio, "reflets humides et éclairage d’ambiance, avec les couleurs réalistes") +
        sw("atslig", "Fond clair", V.light, "comme une planche d’atlas") +
        (ATL_CLIN[V.id] ? sw("atsclin", "Repères cliniques", !!V.clin, "foyers d’auscultation, pouls, points douloureux") : "") +
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
      box.querySelectorAll("#atcby button").forEach(
        (b) =>
          (b.onclick = () => {
            V.colBy = b.dataset.b || null;
            grpBuild();
            materials(true);
            toolPanel("disp", true);
          }),
      );
      box.querySelectorAll(".atgrl button").forEach(
        (b) =>
          (b.onclick = () => {
            const ps = V.grp.list[+b.dataset.g][1].filter((p) => visible(p));
            if (!ps.length) return;
            V.sels = new Set(ps);
            V.sel = ps[0];
            materials();
            panel();
            frameParts(ps, 1.6, null, 900);
          }),
      );
      box.querySelectorAll("#atcol button").forEach(
        (b) =>
          (b.onclick = () => {
            V.real = b.dataset.c == "real";
            box.querySelectorAll("#atcol button").forEach((x) => x.classList.toggle("on", x === b));
            prefSave();
            matsAsync();
            caps();
          }),
      );
      const on = (id, fn) => ($(id).onchange = (e) => (fn(e.target.checked), prefSave()));
      on("atsrel", (v) => ((V.relief = v), matsAsync()));
      on("atsstu", (v) => ((V.studio = v), matsAsync()));
      on("atslig", (v) => ((V.light = v), bgPaint(), need()));
      if ($("atsclin")) $("atsclin").onchange = (e) => clinToggle(e.target.checked);
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
        V.clip.pos + '"></div><div class="atpb"><button class="b" id="atscan">' + (V.scan ? "■ Arrêter" : "▶ Défiler") + '</button><small class="atscn">comme au scanner, de haut en bas</small></div><div id="atcutl"></div><div class="atsws">' + sw("atcap", "Coupe pleine", V.clip.caps, "remplit la surface coupée") + "</div>" +
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
          scanStop();
          cutList();
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
        scanStop();
        clip();
        clearTimeout(V.cutLT);
        V.cutLT = setTimeout(cutList, 120);
      };
    if ($("atscan")) $("atscan").onclick = () => (V.scan ? scanStop() : scanStart());
    if (V.tool == "cut") cutList();

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
      add("Coupe 4 cavités", "les deux atriums, les deux ventricules, mitrale et tricuspide", "z", byFi(/^(mitral|tricuspid) valve$/));
      add("Voie d’éjection gauche (grand axe)", "ventricule gauche, mitrale, valve et racine aortiques", "x", byFi(/^(aortic|mitral) valve$/));
      add("Valves vues d’en haut", "les quatre orifices et le squelette fibreux", "y", V.parts.filter((p) => p.meta.systeme == "valve"));
      add("Coupe petit axe", "les deux ventricules en travers, le septum", "y", byFi(/^papillary/));
    }
    return (V.presets = L);
  }
  function cutApply(c) {
    if (!c) return;
    V.clip.axis = c.axis;
    if (model.id == "coeur") V.clip.caps = true; // parois pleines, comme les pièces d'un modèle démontable
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
      // coupe colorée comme les structures du système (couleur propre au modèle si elle existe : myocarde rouge sombre…)
      const own = V.parts.find((p) => p.meta.systeme == s && p.meta.col && !p.meta.cache),
        col = own ? new T.Color(parseInt(String(own.meta.col).replace("#", ""), 16)).multiplyScalar(0.62).getHex() : V.real ? ATL_REAL.sys[s] : ATL.colors[s],
        pm = new T.MeshStandardMaterial({
          color: own ? new T.Color(parseInt(String(own.meta.col).replace("#", ""), 16)).multiplyScalar(0.42) : new T.Color(col).lerp(new T.Color(0xffffff), 0.12).multiplyScalar(0.92), roughness: 0.95, metalness: 0, envMapIntensity: 0.12,
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
    V.mv && mvStop(true);
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
      "</button>" + (/^(nerf|artere|veine)$/.test(p.meta.systeme) ? '<button class="b" id="atterr">Territoire</button>' : "") + '<button class="b" id="atrap">Rapports</button><button class="b" id="atnei">Voir les voisines</button><button class="b" id="atmul">' + (V.multi ? "✓ Sélection multiple" : "＋ Sélectionner d’autres") +
      '</button><button class="b" id="atorb">Tourner autour</button>' +
      (V.sels.size > 1 ? '<button class="b p" id="atcmp">' + atIco("cmp") + " Comparer</button>" : "") +
      "</div>" +
      (f
        ? '<p class="atpd">' + linkText(f.desc, p) + "</p><dl>" + f.rows.map((r) => "<dt>" + esc(r[0]) + "</dt><dd>" + linkText(r[1], p) + "</dd>").join("") + "</dl>" +
          (f.note ? '<div class="atpn"><b>À retenir</b>' + linkText(f.note, p) + "</div>" : "")
        : '<p class="atpd">Pas encore de fiche pour cette structure.</p>') +
      '<div id="atrapb"></div>' +
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
    $("atrap").onclick = () => rapports(p);
    if ($("atterr")) $("atterr").onclick = () => territory(p);
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
    V.mv && mvStop(true);
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
    V.mv && mvStop(true);
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
    if (dsSteps().length) {
      const d = document.createElement("div");
      d.innerHTML =
        '<p class="atlbl2" style="margin:14px 0 6px">Dissection</p><div class="atprel"><button data-ds="1"' + (V.ds ? ' class="on"' : "") + "><b>" + (V.ds ? "■ " : "▶ ") +
        "Dissection progressive</b><small>Les plans s’enlèvent un à un, du superficiel au profond.</small></button></div>";
      box.appendChild(d);
      d.querySelector("[data-ds]").onclick = () => {
        V.ds ? dsStop() : dsStart();
        if (matchMedia("(max-width: 760px), (orientation: landscape) and (max-height: 500px)").matches) toolPanel("anim");
        else animPaint(box);
      };
    }
    if (movesOf().length) {
      const d = document.createElement("div");
      d.innerHTML =
        '<p class="atlbl2" style="margin:14px 0 6px">Mouvements</p><div class="atprel">' +
        movesOf().map((M, i) => '<button data-m="' + i + '"' + (V.mv && V.mv.M === M ? ' class="on"' : "") + "><b>" + (V.mv && V.mv.M === M ? "■ " : "▶ ") + esc(M.n) + "</b><small>" + esc(M.d) + "</small></button>").join("") +
        "</div>";
      box.appendChild(d);
      box.querySelectorAll("[data-m]").forEach(
        (b) =>
          (b.onclick = () => {
            const M = movesOf()[+b.dataset.m];
            V.mv && V.mv.M === M ? mvStop() : mvStart(M);
            if (matchMedia("(max-width: 760px), (orientation: landscape) and (max-height: 500px)").matches) toolPanel("anim");
            else animPaint(box);
          }),
      );
    }
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
    "membre-inf": [
      {
        id: "nerfs-mi", n: "Les nerfs du membre inférieur",
        steps: [
          { t: "Deux plexus", x: "Le plexus lombal (L1-L4) donne surtout les nerfs fémoral et obturateur, en avant et en dedans ; le plexus sacral (L4-S3) donne le nerf ischiatique, en arrière.", view: "q34", iso: ["femoral nerve", "obturator nerve", "sciatic nerve", "tibial nerve", "common fibular nerve", "gluteal nerves", "hip bone", "femur", "tibia", "fibula"] },
          { t: "Nerf fémoral", x: "Sous le ligament inguinal, en dehors de l’artère fémorale : quadriceps et sartorius ; le nerf saphène pour la peau de la jambe.", view: "front", iso: ["femoral nerve", "femoral artery", "inguinal ligament", "hip bone", "femur", "quadriceps"], sel: ["Nerf fémoral"] },
          { t: "Nerf obturateur", x: "Traverse le canal obturateur : muscles adducteurs.", view: "front", iso: ["obturator nerve", "hip bone", "femur", "adductors"], sel: ["obturator nerve"] },
          { t: "Nerf ischiatique", x: "Sort sous le piriforme et descend derrière la cuisse, sous les ischio-jambiers.", view: "back", iso: ["sciatic nerve", "hip bone", "femur", "deep hip rotators", "hamstrings"], sel: ["sciatic nerve"] },
          { t: "Nerf tibial", x: "Loge postérieure de la jambe et plante du pied ; passe derrière la malléole médiale.", view: "back", iso: ["tibial nerve", "tibia", "fibula", "tarsal bones", "triceps surae", "deep posterior leg"], sel: ["Nerf tibial et nerfs plantaires"] },
          { t: "Nerf fibulaire commun", x: "Contourne le col de la fibula, où il est vulnérable, puis se divise en fibulaire profond (releveurs) et superficiel (fibulaires).", view: "side", iso: ["common fibular nerve", "tibia", "fibula", "tarsal bones", "metatarsals", "anterior leg", "fibularis"], sel: ["Nerf fibulaire commun"] },
        ],
      },
      {
        id: "trigf", n: "Le triangle fémoral",
        steps: [
          { t: "Ses limites", x: "En haut le ligament inguinal, en dehors le sartorius, en dedans le long adducteur.", view: "front", iso: ["inguinal ligament", "sartorius", "adductors", "hip bone", "femur", "femoral artery", "femoral nerve", "deep leg veins", "saphenous veins"], sel: ["inguinal ligament", "sartorius", "Muscle long adducteur"] },
          { t: "Son contenu", x: "De dehors en dedans : nerf fémoral, artère fémorale, veine fémorale (et les lymphatiques du canal fémoral).", view: "front", iso: ["inguinal ligament", "hip bone", "femur", "femoral artery", "femoral nerve", "deep leg veins"], sel: ["Nerf fémoral", "Artère fémorale"] },
          { t: "La crosse de la grande saphène", x: "La grande saphène rejoint la veine fémorale juste sous le ligament inguinal.", view: "front", iso: ["inguinal ligament", "hip bone", "femur", "deep leg veins", "saphenous veins"], sel: ["Grande veine saphène"] },
        ],
      },
    ],
    "membre-sup": [
      {
        id: "nerfs-ms", n: "Les cinq nerfs du membre supérieur",
        steps: [
          { t: "Le plexus brachial", x: "Né des racines C5 à T1 : racines, troncs, divisions puis faisceaux, d’où naissent les nerfs terminaux.", view: "front", iso: ["brachial plexus", "axillary nerve", "musculocutaneous nerve", "median nerve", "ulnar nerve", "radial nerve", "clavicle", "scapula", "humerus", "radius", "ulna"], sel: ["brachial plexus"] },
          { t: "Nerf axillaire", x: "Contourne le col chirurgical de l’humérus : deltoïde et petit rond.", view: "back", iso: ["axillary nerve", "humerus", "scapula", "deltoid"], sel: ["axillary nerve"] },
          { t: "Nerf musculo-cutané", x: "Loge antérieure du bras : coraco-brachial, biceps, brachial.", view: "front", iso: ["musculocutaneous nerve", "humerus", "biceps brachii", "brachialis", "coracobrachialis"], sel: ["musculocutaneous nerve"] },
          { t: "Nerf médian", x: "Flexion du poignet et des doigts, pince pouce-index ; traverse le canal carpien.", view: "front", iso: ["median nerve", "humerus", "radius", "ulna", "carpal bones", "metacarpals", "phalanges", "flexor retinaculum"], sel: ["median nerve"] },
          { t: "Nerf ulnaire", x: "Passe derrière l’épicondyle médial ; motricité fine de la main (interosseux).", view: "q34", iso: ["ulnar nerve", "humerus", "radius", "ulna", "carpal bones", "metacarpals", "phalanges"], sel: ["ulnar nerve"] },
          { t: "Nerf radial", x: "Contourne l’humérus en arrière : nerf de l’extension du coude, du poignet et des doigts.", view: "back", iso: ["radial nerve", "humerus", "radius", "ulna", "triceps brachii"], sel: ["radial nerve"] },
        ],
      },
      {
        id: "coiffe", n: "La coiffe des rotateurs",
        steps: [
          { t: "L’épaule", x: "Une articulation très mobile mais peu stable : quatre muscles l’entourent et plaquent la tête humérale dans la glène.", view: "q34", iso: ["scapula", "humerus", "clavicle", "supraspinatus", "infraspinatus", "teres minor", "subscapularis", "deltoid"] },
          { t: "Supra-épineux", x: "Au-dessus : démarre l’abduction ; le tendon le plus souvent abîmé.", view: "back", iso: ["scapula", "humerus", "clavicle", "supraspinatus", "infraspinatus", "teres minor", "subscapularis"], sel: ["supraspinatus"] },
          { t: "Infra-épineux et petit rond", x: "En arrière : rotation latérale du bras.", view: "back", iso: ["scapula", "humerus", "clavicle", "supraspinatus", "infraspinatus", "teres minor", "subscapularis"], sel: ["infraspinatus", "teres minor"] },
          { t: "Subscapulaire", x: "En avant : rotation médiale ; s’insère sur le tubercule mineur.", view: "front", iso: ["scapula", "humerus", "clavicle", "supraspinatus", "infraspinatus", "teres minor", "subscapularis"], sel: ["subscapularis"] },
        ],
      },
    ],
    "tete-cou": [
      {
        id: "carot", n: "Les carotides et les jugulaires",
        steps: [
          { t: "Carotide commune", x: "À droite elle naît du tronc brachio-céphalique, à gauche directement de l’arc aortique ; elle monte sous le sterno-cléido-mastoïdien.", view: "front", iso: ["common carotid artery", "external carotid", "internal carotid", "jugular veins", "thyroid gland", "larynx", "hyoid", "mandible", "cervical vertebra", "brachiocephalic trunk"], sel: ["common carotid artery"] },
          { t: "La bifurcation", x: "Au bord supérieur du cartilage thyroïde (C4) : carotide interne en arrière et en dehors, externe en avant et en dedans.", view: "q34", iso: ["common carotid artery", "external carotid", "internal carotid", "larynx", "hyoid", "mandible", "cervical vertebra"], sel: ["external carotid", "internal carotid"] },
          { t: "Carotide interne", x: "Ne donne aucune branche au cou : elle entre dans le crâne par le canal carotidien pour l’encéphale et l’œil.", view: "side", iso: ["internal carotid", "common carotid artery", "cranial bones", "cervical vertebra", "mandible"], sel: ["internal carotid"] },
          { t: "Carotide externe", x: "Branches pour la face et le cou : thyroïdienne supérieure, linguale, faciale, occipitale, puis temporale superficielle et maxillaire.", view: "side", iso: ["external carotid", "external carotid branches", "common carotid artery", "mandible", "facial bones", "cranial bones"], sel: ["external carotid branches"] },
          { t: "Veine jugulaire interne", x: "En dehors de la carotide dans la gaine carotidienne, avec le nerf vague entre les deux, en arrière.", view: "front", iso: ["jugular veins", "common carotid artery", "internal carotid", "vagus", "sternocleidomastoid", "mandible", "cervical vertebra"], sel: ["jugular veins", "vagus"] },
        ],
      },
      {
        id: "masti", n: "La mastication",
        steps: [
          { t: "La mandibule", x: "Seul os mobile de la tête, articulé au temporal par l’articulation temporo-mandibulaire.", view: "side", iso: ["mandible", "cranial bones", "facial bones", "masseter", "temporalis", "pterygoids"], sel: ["mandible"] },
          { t: "Masséter et temporal", x: "Ferment la bouche (élévation de la mandibule) ; le temporal la tire aussi en arrière.", view: "side", iso: ["mandible", "cranial bones", "facial bones", "masseter", "temporalis"], sel: ["masseter", "temporalis"] },
          { t: "Les ptérygoïdiens", x: "Le médial ferme la bouche, le latéral l’ouvre et porte la mandibule en avant : leur action alternée donne la diduction (mouvement latéral).", view: "back", iso: ["mandible", "cranial bones", "facial bones", "pterygoids"], sel: ["pterygoids"] },
          { t: "L’innervation", x: "Tous les muscles masticateurs sont innervés par le nerf mandibulaire (V3), branche du trijumeau.", view: "side", iso: ["mandible", "cranial bones", "facial bones", "trigeminal", "masseter", "pterygoids"], sel: ["trigeminal"] },
        ],
      },
      {
        id: "thyr", n: "Larynx et thyroïde",
        steps: [
          { t: "Le larynx", x: "Squelette cartilagineux : thyroïde (pomme d’Adam), cricoïde, aryténoïdes et épiglotte ; il se projette de C3 à C6.", view: "front", iso: ["larynx", "hyoid", "thyroid gland", "parathyroid", "cervical vertebra"], sel: ["larynx"] },
          { t: "La glande thyroïde", x: "Deux lobes reliés par l’isthme, devant les 2e à 4e anneaux trachéaux.", view: "front", iso: ["larynx", "hyoid", "thyroid gland", "parathyroid", "common carotid artery", "jugular veins"], sel: ["thyroid gland"] },
          { t: "Les parathyroïdes", x: "Quatre petites glandes à la face postérieure de la thyroïde : elles règlent le calcium (PTH).", view: "back", iso: ["larynx", "thyroid gland", "parathyroid"], sel: ["parathyroid"] },
        ],
      },
    ],
    encephale: [
      {
        id: "cortex", n: "Le cortex et ses fonctions",
        steps: [
          { t: "Quatre lobes", x: "Frontal, pariétal, temporal et occipital ; l’insula est cachée au fond du sillon latéral.", view: "side", all: 1 },
          { t: "Cortex moteur", x: "Gyrus précentral, en avant du sillon central : commande du côté opposé du corps.", view: "side", sel: ["precentral gyrus"] },
          { t: "Cortex somesthésique", x: "Gyrus postcentral, juste derrière : sensibilité du côté opposé.", view: "side", sel: ["postcentral gyrus"] },
          { t: "Le langage", x: "Broca (gyrus frontal inférieur gauche) pour produire le langage ; Wernicke (temporal supérieur et supramarginal) pour le comprendre.", view: "side", sel: ["broca", "Gyrus temporal supérieur gauche", "Gyrus supramarginal gauche"] },
          { t: "Vision", x: "Le cortex visuel primaire borde le sillon calcarin, sur la face médiale du lobe occipital.", view: "back", sel: ["visual cortex"] },
        ],
      },
      {
        id: "profond", n: "Les structures profondes",
        steps: [
          { t: "Sous le cortex", x: "La substance blanche relie les aires ; au centre se trouvent les noyaux gris, le thalamus et les ventricules.", view: "q34", layer: 1, sel: ["white matter"] },
          { t: "Noyaux gris centraux", x: "Noyau caudé et putamen (striatum), globus pallidus : régulation du mouvement.", view: "front", iso: ["basal ganglia", "thalamus", "ventricles", "brainstem"], sel: ["basal ganglia"] },
          { t: "Thalamus", x: "Relais vers le cortex de presque toutes les informations sensitives.", view: "q34", iso: ["basal ganglia", "thalamus", "hypothalamus", "ventricles", "brainstem"], sel: ["thalamus"] },
          { t: "Hippocampe et amygdale", x: "Mémoire et émotions : le système limbique, sur la face médiale du lobe temporal.", view: "side", iso: ["hippocampus", "limbic system", "thalamus", "hypothalamus", "brainstem"], sel: ["hippocampus", "Corps amygdaloïde droit", "Corps amygdaloïde gauche"] },
          { t: "Les ventricules", x: "Le LCS passe des ventricules latéraux au 3e ventricule, puis par l’aqueduc au 4e ventricule.", view: "q34", iso: ["ventricles", "thalamus", "brainstem", "cerebellum"], sel: ["ventricles"] },
        ],
      },
      {
        id: "willis", n: "La vascularisation de l’encéphale",
        steps: [
          { t: "Deux systèmes", x: "En avant les deux carotides internes, en arrière les deux artères vertébrales qui forment le tronc basilaire.", view: "front", iso: ["internal carotid", "vertebral artery", "circle of willis", "cerebral arteries", "cerebellar arteries", "brainstem"], sel: ["internal carotid", "vertebral artery"] },
          { t: "Le polygone de Willis", x: "Anastomose à la base du cerveau grâce aux communicantes antérieure et postérieures.", view: "persp", iso: ["internal carotid", "vertebral artery", "circle of willis", "cerebral arteries", "brainstem"], sel: ["circle of willis"] },
          { t: "Les trois artères cérébrales", x: "Antérieure (face médiale), moyenne (face latérale, la plus touchée par les AVC), postérieure (lobe occipital).", view: "side", iso: ["cerebral arteries", "circle of willis", "internal carotid", "brainstem", "cerebellum"], sel: ["cerebral arteries"] },
          { t: "Le drainage veineux", x: "Les sinus de la dure-mère conduisent le sang vers les veines jugulaires internes.", view: "q34", iso: ["dural sinuses", "brainstem", "cerebellum"], sel: ["dural sinuses"] },
        ],
      },
    ],
    rachis: [
      {
        id: "verteb", n: "La colonne vertébrale",
        steps: [
          { t: "33 vertèbres", x: "7 cervicales, 12 thoraciques, 5 lombaires, puis le sacrum (5 soudées) et le coccyx.", view: "side", iso: ["atlas axis", "cervical vertebra", "thoracic vertebra", "lumbar vertebra", "sacrum", "coccyx", "intervertebral disk"] },
          { t: "Les courbures", x: "Lordoses cervicale et lombaire (concaves en arrière), cyphoses thoracique et sacrale.", view: "side", iso: ["atlas axis", "cervical vertebra", "thoracic vertebra", "lumbar vertebra", "sacrum", "coccyx", "intervertebral disk"] },
          { t: "Atlas et axis", x: "C1 n’a pas de corps ; il tourne autour de la dent de C2 : la moitié de la rotation de la tête.", view: "q34", iso: ["atlas axis", "cervical vertebra", "cranial bones"], sel: ["atlas axis"] },
          { t: "Les disques", x: "Anneau fibreux et noyau pulpeux ; les hernies sont surtout lombaires basses (L4-L5, L5-S1) et cervicales basses.", view: "side", iso: ["lumbar vertebra", "sacrum", "intervertebral disk", "spinal nerves", "cauda equina"], sel: ["Disques intervertébraux lombaires"] },
          { t: "Moelle et queue de cheval", x: "La moelle s’arrête vers L1-L2 ; dessous, la queue de cheval : on ponctionne entre L3 et L5.", view: "back", iso: ["spinal cord", "cauda equina", "lumbar vertebra", "thoracic vertebra", "sacrum"], sel: ["cauda equina"] },
        ],
      },
      {
        id: "dos", n: "Les muscles du dos",
        steps: [
          { t: "Plan superficiel", x: "Trapèze et grand dorsal relient le tronc au membre supérieur.", view: "back", layer: 0, sel: ["trapezius", "latissimus dorsi"] },
          { t: "Plan intermédiaire", x: "Rhomboïdes et élévateur de la scapula ; dentelés postérieurs, muscles respiratoires accessoires.", view: "back", layer: 1, sel: ["rhomboids", "levator scapulae"] },
          { t: "Érecteurs du rachis", x: "De dehors en dedans : ilio-costal, longissimus, épineux.", view: "back", layer: 1, sel: ["erector spinae"] },
          { t: "Plan profond", x: "Semi-épineux, multifide, rotateurs : de petits muscles qui stabilisent chaque étage.", view: "back", layer: 2, sel: ["transversospinalis"] },
        ],
      },
    ],
    bassin: [
      {
        id: "plancher", n: "Le plancher pelvien",
        steps: [
          { t: "Le bassin osseux", x: "Deux os coxaux et le sacrum, unis par les articulations sacro-iliaques et la symphyse pubienne.", view: "front", iso: ["hip bone", "sacrum", "coccyx", "pelvic joints", "lumbar vertebra"] },
          { t: "L’élévateur de l’anus", x: "Hamac musculaire tendu du pubis au coccyx, qui soutient les viscères.", view: "persp", iso: ["hip bone", "sacrum", "coccyx", "levator ani", "anal sphincter", "deep hip rotators"], sel: ["levator ani"] },
          { t: "Les foramens ischiatiques", x: "Les ligaments sacro-épineux et sacro-tubéral ferment les incisures : passage du piriforme et du nerf ischiatique.", view: "back", iso: ["hip bone", "sacrum", "coccyx", "pelvic ligaments", "deep hip rotators", "sciatic nerve", "pudendal"], sel: ["pelvic ligaments"] },
          { t: "Le pédicule pudendal", x: "Il sort par le grand foramen, contourne l’épine ischiatique et rentre par le petit : nerf du périnée.", view: "back", iso: ["hip bone", "sacrum", "pelvic ligaments", "pudendal", "levator ani"], sel: ["pudendal"] },
        ],
      },
      {
        id: "uro", n: "Organes pelviens masculins",
        steps: [
          { t: "La vessie", x: "Derrière la symphyse pubienne ; l’uretère y entre par sa face postérieure.", view: "side", iso: ["hip bone", "sacrum", "bladder", "ureter", "prostate", "seminal glands", "ductus deferens", "urethra", "sigmoid colon"], sel: ["bladder"] },
          { t: "La prostate", x: "Sous la vessie, autour de l’urètre ; palpable par le toucher rectal.", view: "side", iso: ["hip bone", "sacrum", "bladder", "prostate", "seminal glands", "urethra"], sel: ["prostate"] },
          { t: "Le conduit déférent", x: "Du testicule à la prostate par le canal inguinal ; il passe au-dessus de l’uretère.", view: "q34", iso: ["hip bone", "bladder", "ureter", "ductus deferens", "seminal glands", "prostate", "testis"], sel: ["ductus deferens", "ureter"] },
          { t: "Les vaisseaux iliaques", x: "L’iliaque interne pour le pelvis et le périnée, l’externe pour le membre inférieur.", view: "front", iso: ["hip bone", "sacrum", "common iliac artery", "external iliac artery", "internal iliac artery", "gluteal arteries", "pudendal", "bladder"], sel: ["internal iliac artery", "external iliac artery"] },
        ],
      },
    ],
    oeil: [
      {
        id: "oculo", n: "Les muscles oculomoteurs",
        steps: [
          { t: "Six muscles", x: "Quatre droits nés de l’anneau tendineux commun et deux obliques.", view: "q34", layer: 1, sel: ["extraocular muscles", "superior oblique"] },
          { t: "Droit latéral : VI", x: "Abduction ; sa paralysie donne un strabisme convergent.", view: "front", layer: 1, sel: ["Muscle droit latéral", "Nerf abducens (VI)"] },
          { t: "Oblique supérieur : IV", x: "Son tendon passe dans la trochlée ; il abaisse l’œil en adduction.", view: "q34", layer: 1, sel: ["superior oblique", "Nerf trochléaire (IV)"] },
          { t: "Tous les autres : III", x: "Droits supérieur, inférieur et médial, oblique inférieur, releveur de la paupière.", view: "q34", layer: 1, sel: ["Muscle droit supérieur", "Muscle droit inférieur", "Muscle droit médial", "Muscle oblique inférieur", "levator palpebrae", "Nerf oculomoteur (III)"] },
        ],
      },
      {
        id: "globe", n: "Le globe oculaire",
        steps: [
          { t: "La cornée", x: "La lentille principale de l’œil, transparente et sans vaisseaux.", view: "side", layer: 1, sel: ["cornea"] },
          { t: "Iris et cristallin", x: "L’iris règle la pupille ; le cristallin se bombe pour voir de près.", view: "side", layer: 2, sel: ["uvea", "lens"] },
          { t: "La rétine", x: "Les photorécepteurs ; ses axones forment le nerf optique.", view: "side", layer: 2, sel: ["retina", "Nerf optique (II)"] },
        ],
      },
    ],
    oreille: [
      {
        id: "audition", n: "Le trajet du son",
        steps: [
          { t: "Le tympan", x: "Les vibrations de l’air font vibrer le tympan, au fond du méat acoustique externe.", view: "front", layer: 1, sel: ["middle ear"] },
          { t: "Les osselets", x: "Malléus, incus et stapes amplifient les vibrations jusqu’à la fenêtre ovale.", view: "front", layer: 1, sel: ["ossicles"] },
          { t: "La cochlée", x: "Les liquides de la cochlée font vibrer l’organe spiral : aigus à la base, graves à l’apex.", view: "q34", layer: 1, sel: ["cochlea"] },
          { t: "Le nerf VIII", x: "Il gagne le tronc cérébral par le méat acoustique interne, avec le nerf facial.", view: "q34", layer: 1, sel: ["vestibulocochlear", "facial nerve"] },
          { t: "L’équilibre", x: "Vestibule et canaux semi-circulaires renseignent sur la position et les rotations de la tête.", view: "side", layer: 1, sel: ["vestibule"] },
        ],
      },
    ],
    "bouche": [
      {
        "id": "dents",
        "n": "La denture",
        "steps": [
          {
            "t": "32 dents",
            "x": "Par hémi-arcade : 2 incisives, 1 canine, 2 prémolaires, 3 molaires. Numérotation FDI : quadrant puis rang.",
            "view": "front",
            "layer": 3,
            "all": 1
          },
          {
            "t": "Les incisives",
            "x": "Elles coupent ; une seule racine.",
            "view": "front",
            "layer": 3,
            "sel": [
              "incisors"
            ]
          },
          {
            "t": "Canine et prémolaires",
            "x": "La canine déchire ; les prémolaires écrasent avec leurs deux cuspides.",
            "view": "q34",
            "layer": 3,
            "sel": [
              "canines",
              "premolars"
            ]
          },
          {
            "t": "Molaires",
            "x": "Elles broient ; la 1re molaire définitive sort vers 6 ans.",
            "view": "q34",
            "layer": 3,
            "sel": [
              "molars"
            ]
          },
          {
            "t": "Dents de sagesse",
            "x": "Les 3es molaires sortent tard, souvent mal faute de place.",
            "view": "side",
            "layer": 3,
            "sel": [
              "wisdom teeth"
            ]
          }
        ]
      },
      {
        "id": "saliv",
        "n": "Glandes salivaires",
        "steps": [
          {
            "t": "Parotide",
            "x": "La plus grosse, devant l’oreille ; son conduit s’ouvre en face de la 2e molaire supérieure.",
            "view": "side",
            "sel": [
              "Glande parotide droite",
              "Conduit parotidien droit"
            ]
          },
          {
            "t": "Submandibulaire",
            "x": "Sous la mandibule ; son conduit s’ouvre sous la langue.",
            "view": "q34",
            "sel": [
              "Glande submandibulaire droite",
              "Conduit submandibulaire droit"
            ]
          },
          {
            "t": "Sublinguale",
            "x": "Sous la muqueuse du plancher de la bouche.",
            "view": "front",
            "layer": 1,
            "sel": [
              "Glande sublinguale droite",
              "Glande sublinguale gauche"
            ]
          }
        ]
      }
    ],
    "nez": [
      {
        "id": "sinus",
        "n": "Les sinus de la face",
        "steps": [
          {
            "t": "Quatre paires de sinus",
            "x": "Frontaux, maxillaires, ethmoïdaux et sphénoïdaux, autour des fosses nasales.",
            "view": "front",
            "sel": [
              "paranasal sinuses"
            ]
          },
          {
            "t": "Sinus maxillaire",
            "x": "Le plus grand ; ses racines dentaires voisines expliquent les sinusites d’origine dentaire.",
            "view": "q34",
            "sel": [
              "maxillary sinus"
            ]
          },
          {
            "t": "La cloison",
            "x": "Cartilage septal, lame perpendiculaire de l’ethmoïde et vomer.",
            "view": "side",
            "layer": 1,
            "sel": [
              "nasal septum"
            ]
          },
          {
            "t": "Vascularisation",
            "x": "Sphéno-palatine surtout, et ethmoïdales : elles se rejoignent sur la tache vasculaire de la cloison.",
            "view": "side",
            "layer": 2,
            "sel": [
              "nasal arteries"
            ]
          }
        ]
      }
    ],
    "endocrine": [
      {
        "id": "glandes",
        "n": "Les glandes endocrines",
        "steps": [
          {
            "t": "Hypophyse",
            "x": "Sous l’hypothalamus, dans la selle turcique : elle commande la plupart des autres glandes.",
            "view": "side",
            "sel": [
              "pituitary"
            ]
          },
          {
            "t": "Thyroïde et parathyroïdes",
            "x": "Thyroïde : métabolisme (T3, T4) ; parathyroïdes : calcium (PTH).",
            "view": "front",
            "sel": [
              "thyroid gland",
              "parathyroid"
            ]
          },
          {
            "t": "Surrénales",
            "x": "Cortisol, aldostérone, androgènes et adrénaline.",
            "view": "back",
            "sel": [
              "suprarenal gland"
            ]
          },
          {
            "t": "Pancréas",
            "x": "Les îlots de Langerhans sécrètent l’insuline et le glucagon.",
            "view": "front",
            "sel": [
              "pancreas"
            ]
          }
        ]
      }
    ],
    "lymphe": [
      {
        "id": "lym",
        "n": "Les grands groupes de nœuds",
        "steps": [
          {
            "t": "Tête et cou",
            "x": "Cercle péri-cervical puis chaîne jugulaire interne.",
            "view": "front",
            "sel": [
              "head neck nodes"
            ]
          },
          {
            "t": "Aisselle",
            "x": "Membre supérieur, paroi thoracique et la plus grande partie du sein.",
            "view": "front",
            "sel": [
              "axillary nodes"
            ]
          },
          {
            "t": "Abdomen et bassin",
            "x": "Nœuds le long de l’aorte et des artères des viscères, puis iliaques.",
            "view": "front",
            "sel": [
              "abdominal nodes",
              "pelvic nodes"
            ]
          },
          {
            "t": "Aine",
            "x": "Membre inférieur, périnée et paroi sous l’ombilic.",
            "view": "front",
            "sel": [
              "inguinal nodes"
            ]
          },
          {
            "t": "Organes lymphoïdes",
            "x": "Rate, thymus et amygdales.",
            "view": "q34",
            "sel": [
              "spleen",
              "thymus",
              "tonsils"
            ]
          }
        ]
      }
    ],
    "bassin-f": [
      {
        "id": "genital-f",
        "n": "L’appareil génital féminin",
        "steps": [
          {
            "t": "L’utérus",
            "x": "Organe musculaire creux, antéversé et antéfléchi, entre la vessie et le rectum.",
            "view": "side", "layer": 1,
            "sel": [
              "uterus"
            ]
          },
          {
            "t": "Le col",
            "x": "Partie basse de l’utérus, en partie dans le vagin ; l’uretère passe tout près.",
            "view": "side", "layer": 1,
            "sel": [
              "cervix",
              "vagina"
            ]
          },
          {
            "t": "Trompes et ovaires",
            "x": "L’ampoule de la trompe est le lieu de la fécondation.",
            "view": "front",
            "layer": 1,
            "sel": [
              "uterine tube",
              "ovary"
            ]
          },
          {
            "t": "Les ligaments",
            "x": "Cardinaux et utéro-sacraux soutiennent le col ; les ronds maintiennent l’antéversion.",
            "view": "persp",
            "layer": 1,
            "sel": [
              "uterine ligaments"
            ]
          },
          {
            "t": "Vascularisation",
            "x": "L’artère utérine passe au-dessus de l’uretère près du col.",
            "view": "front",
            "layer": 1,
            "sel": [
              "uterine artery",
              "ureter"
            ]
          }
        ]
      }
    ],
    "foie": [
      {
        "id": "couinaud",
        "n": "Les segments du foie",
        "steps": [
          {
            "t": "Huit segments",
            "x": "Segmentation de Couinaud : chaque segment a son pédicule portal et biliaire.",
            "view": "front",
            "sel": [
              "liver segments"
            ]
          },
          {
            "t": "Foie gauche",
            "x": "Segments II, III et IV, à gauche de la ligne vésicule – veine cave.",
            "view": "front",
            "sel": [
              "Foie : segment II",
              "Foie : segment III",
              "Foie : segment IVa",
              "Foie : segment IVb (lobe carré)"
            ]
          },
          {
            "t": "Foie droit",
            "x": "Segments V à VIII.",
            "view": "q34",
            "sel": [
              "Foie : segment V",
              "Foie : segment VI",
              "Foie : segment VII",
              "Foie : segment VIII"
            ]
          },
          {
            "t": "Le pédicule hépatique",
            "x": "Veine porte en arrière, artère hépatique en avant et à gauche, cholédoque en avant et à droite.",
            "view": "front",
            "layer": 1,
            "sel": [
              "portal vein",
              "proper hepatic artery",
              "bile duct"
            ]
          },
          {
            "t": "Les veines hépatiques",
            "x": "Trois veines qui séparent les secteurs et se jettent dans la veine cave inférieure.",
            "view": "back",
            "layer": 1,
            "sel": [
              "hepatic veins"
            ]
          }
        ]
      }
    ],
    "rein": [
      {
        "id": "rein-int",
        "n": "L’intérieur du rein",
        "steps": [
          {
            "t": "Le cortex",
            "x": "Zone périphérique avec les glomérules.",
            "view": "front",
            "sel": [
              "renal cortex"
            ]
          },
          {
            "t": "Les pyramides",
            "x": "La médullaire : base vers le cortex, sommet (papille) vers les calices.",
            "view": "front",
            "layer": 2,
            "sel": [
              "renal medulla"
            ]
          },
          {
            "t": "Les calices",
            "x": "Les petits calices reçoivent les papilles et se réunissent en grands calices.",
            "view": "front",
            "layer": 3,
            "sel": [
              "calyces"
            ]
          },
          {
            "t": "Le bassinet",
            "x": "Il collecte l’urine et se continue par l’uretère.",
            "view": "q34",
            "layer": 3,
            "sel": [
              "renal pelvis",
              "ureter"
            ]
          }
        ]
      }
    ],
    "larynx": [
      {
        "id": "glotte",
        "n": "Les cordes vocales et leurs muscles",
        "steps": [
          {
            "t": "Les cartilages",
            "x": "Thyroïde, cricoïde, aryténoïdes et épiglotte.",
            "view": "q34",
            "layer": 3,
            "sel": [
              "laryngeal cartilages",
              "epiglottis"
            ]
          },
          {
            "t": "Ouvrir la glotte",
            "x": "Le crico-aryténoïdien postérieur est le seul muscle qui écarte les cordes vocales.",
            "view": "back",
            "layer": 2,
            "sel": [
              "posterior cricoarytenoid"
            ]
          },
          {
            "t": "Fermer la glotte",
            "x": "Crico-aryténoïdiens latéraux et aryténoïdiens.",
            "view": "q34",
            "layer": 2,
            "sel": [
              "intrinsic larynx"
            ]
          },
          {
            "t": "Tendre les cordes",
            "x": "Le crico-thyroïdien, innervé par le laryngé supérieur ; tous les autres par le récurrent.",
            "view": "side",
            "layer": 2,
            "sel": [
              "cricothyroid"
            ]
          }
        ]
      }
    ],
    "epaule": [
      {
        "id": "stab",
        "n": "La stabilité de l’épaule",
        "steps": [
          {
            "t": "Une articulation peu emboîtée",
            "x": "Grosse tête humérale, petite glène creusée par le bourrelet.",
            "view": "q34",
            "layer": 3,
            "sel": [
              "glenohumeral joint"
            ]
          },
          {
            "t": "La coiffe des rotateurs",
            "x": "Supra-épineux, infra-épineux, petit rond et subscapulaire plaquent la tête dans la glène.",
            "view": "back",
            "layer": 1,
            "sel": [
              "supraspinatus",
              "infraspinatus",
              "teres minor",
              "subscapularis"
            ]
          },
          {
            "t": "La voûte",
            "x": "Acromion et ligament coraco-acromial au-dessus du supra-épineux.",
            "view": "side",
            "layer": 1,
            "sel": [
              "shoulder ligaments",
              "supraspinatus"
            ]
          },
          {
            "t": "Le nerf axillaire",
            "x": "Il contourne le col chirurgical : à vérifier après une luxation.",
            "view": "back",
            "layer": 2,
            "sel": [
              "axillary nerve"
            ]
          }
        ]
      }
    ],
    "main": [
      {
        "id": "carpe",
        "n": "Le poignet et le canal carpien",
        "steps": [
          {
            "t": "Huit os du carpe",
            "x": "Rangée proximale : scaphoïde, lunatum, triquetrum, pisiforme ; distale : trapèze, trapézoïde, capitatum, hamatum.",
            "view": "front",
            "layer": 3,
            "sel": [
              "carpal bones"
            ]
          },
          {
            "t": "Le canal carpien",
            "x": "Sous le rétinaculum des fléchisseurs : 9 tendons fléchisseurs et le nerf médian.",
            "view": "front",
            "layer": 1,
            "sel": [
              "flexor retinaculum",
              "median nerve"
            ]
          },
          {
            "t": "Éminence thénar",
            "x": "Court abducteur, court fléchisseur et opposant du pouce, surtout par le nerf médian.",
            "view": "front",
            "sel": [
              "thenar"
            ]
          },
          {
            "t": "Les muscles profonds",
            "x": "Interosseux et adducteur du pouce, innervés par le nerf ulnaire.",
            "view": "front",
            "layer": 2,
            "sel": [
              "interossei",
              "adductor pollicis",
              "ulnar nerve"
            ]
          }
        ]
      }
    ],
    "genou": [
      {
        "id": "pivot",
        "n": "Le pivot central et les ménisques",
        "steps": [
          {
            "t": "Les ménisques",
            "x": "Médial en C, latéral en O, entre fémur et tibia.",
            "view": "q34",
            "layer": 3,
            "sel": [
              "menisci"
            ]
          },
          {
            "t": "Les ligaments croisés",
            "x": "Le LCA empêche le tibia d’avancer, le LCP de reculer.",
            "view": "q34",
            "layer": 3,
            "sel": [
              "cruciate ligaments"
            ]
          },
          {
            "t": "Les collatéraux",
            "x": "Tibial (médial) contre le valgus, fibulaire (latéral) contre le varus.",
            "view": "front",
            "layer": 3,
            "sel": [
              "collateral ligaments"
            ]
          },
          {
            "t": "Le creux poplité",
            "x": "Artère poplitée en profondeur, nerf tibial en surface.",
            "view": "back",
            "layer": 1,
            "sel": [
              "popliteal artery",
              "tibial nerve"
            ]
          }
        ]
      }
    ],
    "corps": [
      {
        "id": "systemes",
        "n": "Les grands systèmes",
        "steps": [
          {
            "t": "Le squelette",
            "x": "Environ 206 os : squelette axial (crâne, rachis, thorax) et appendiculaire (membres et ceintures).",
            "view": "front",
            "sysOnly": [
              "os",
              "cartilage"
            ],
            "all": 1
          },
          {
            "t": "Les muscles",
            "x": "Plus de 600 muscles striés squelettiques.",
            "view": "front",
            "sysOnly": [
              "muscle",
              "os"
            ],
            "all": 1
          },
          {
            "t": "La circulation",
            "x": "Le cœur, les artères (en rouge) et les veines (en bleu).",
            "view": "front",
            "sysOnly": [
              "artere",
              "veine",
              "organe"
            ],
            "sel": [
              "right ventricle",
              "left ventricle"
            ]
          },
          {
            "t": "Le système nerveux",
            "x": "Encéphale, moelle spinale et nerfs périphériques.",
            "view": "back",
            "sysOnly": [
              "nerf",
              "os"
            ],
            "all": 1
          },
          {
            "t": "Les viscères",
            "x": "Organes du thorax, de l’abdomen et du bassin.",
            "view": "front",
            "sysOnly": [
              "organe"
            ],
            "all": 1
          }
        ]
      }
    ],
    "cellule": [
      {
        "id": "organites",
        "n": "Le trajet d’une protéine sécrétée",
        "steps": [
          {
            "t": "Le noyau",
            "x": "L’ADN est transcrit en ARN messager, qui sort par les pores nucléaires.",
            "view": "front",
            "layer": 1,
            "sel": [
              "nucleus",
              "nuclear envelope"
            ]
          },
          {
            "t": "Le RE rugueux",
            "x": "Les ribosomes fixés au RE traduisent l’ARNm : la protéine entre dans le réticulum.",
            "view": "q34",
            "layer": 1,
            "sel": [
              "rough er"
            ]
          },
          {
            "t": "L’appareil de Golgi",
            "x": "La protéine y est modifiée (glycosylation) puis triée.",
            "view": "q34",
            "layer": 1,
            "sel": [
              "golgi"
            ]
          },
          {
            "t": "Les vésicules",
            "x": "Elles transportent la protéine jusqu’à la membrane : exocytose.",
            "view": "q34",
            "layer": 1,
            "sel": [
              "vesicles"
            ]
          },
          {
            "t": "L’énergie",
            "x": "Les mitochondries fournissent l’ATP nécessaire.",
            "view": "front",
            "layer": 1,
            "sel": [
              "mitochondria"
            ]
          }
        ]
      }
    ],
    "mitochondrie": [
      {
        "id": "atp",
        "n": "La production d’ATP",
        "steps": [
          {
            "t": "Deux membranes",
            "x": "Externe perméable, interne très imperméable et repliée en crêtes.",
            "view": "front",
            "sel": [
              "outer membrane",
              "inner membrane"
            ]
          },
          {
            "t": "La matrice",
            "x": "Cycle de Krebs : il produit le NADH et le FADH2.",
            "view": "front",
            "layer": 1,
            "sel": [
              "matrix"
            ]
          },
          {
            "t": "Les crêtes",
            "x": "La chaîne respiratoire pompe les protons dans l’espace intermembranaire.",
            "view": "front",
            "layer": 1,
            "sel": [
              "cristae"
            ]
          },
          {
            "t": "L’ATP synthase",
            "x": "Les protons redescendent par l’ATP synthase, qui fabrique l’ATP.",
            "view": "front",
            "layer": 1,
            "sel": [
              "atp synthase"
            ]
          }
        ]
      }
    ],
    "neurone": [
      {
        "id": "influx",
        "n": "Le trajet de l’influx nerveux",
        "steps": [
          {
            "t": "Les dendrites",
            "x": "Elles reçoivent les messages d’autres neurones, surtout sur les épines.",
            "view": "front",
            "sel": [
              "dendrites"
            ]
          },
          {
            "t": "Le corps cellulaire",
            "x": "Il intègre les signaux reçus.",
            "view": "front",
            "sel": [
              "soma"
            ]
          },
          {
            "t": "Le cône d’implantation",
            "x": "Le potentiel d’action y naît s’il atteint le seuil.",
            "view": "front",
            "sel": [
              "axon hillock"
            ]
          },
          {
            "t": "Conduction saltatoire",
            "x": "Il saute de nœud de Ranvier en nœud de Ranvier, sous la myéline.",
            "view": "front",
            "sel": [
              "ranvier",
              "myelin"
            ]
          },
          {
            "t": "Les boutons synaptiques",
            "x": "Libération du neurotransmetteur vers la cellule suivante.",
            "view": "front",
            "sel": [
              "terminal"
            ]
          }
        ]
      }
    ],
    "sarcomere": [
      {
        "id": "contraction",
        "n": "La contraction",
        "steps": [
          {
            "t": "Le sarcomère",
            "x": "Unité contractile entre deux stries Z.",
            "view": "side",
            "sel": [
              "z disc"
            ]
          },
          {
            "t": "Actine et myosine",
            "x": "Filaments fins accrochés aux stries Z, filaments épais au centre.",
            "view": "q34",
            "layer": 1,
            "sel": [
              "actin",
              "myosin"
            ]
          },
          {
            "t": "Le calcium",
            "x": "Le potentiel d’action descend par les tubules T ; le réticulum libère le calcium.",
            "view": "q34",
            "sel": [
              "t tubule",
              "sarcoplasmic reticulum"
            ]
          },
          {
            "t": "Le glissement",
            "x": "Les têtes de myosine tirent l’actine vers la ligne M : les bandes I et la zone H raccourcissent.",
            "view": "side",
            "layer": 1,
            "sel": [
              "sarcomere bands"
            ]
          }
        ]
      }
    ],
    "nephron": [
      {
        "id": "urine",
        "n": "La formation de l’urine",
        "steps": [
          {
            "t": "La filtration",
            "x": "Le glomérule filtre le plasma dans la capsule de Bowman.",
            "view": "front",
            "sel": [
              "glomerulus",
              "bowman"
            ]
          },
          {
            "t": "Le tube proximal",
            "x": "Il réabsorbe les deux tiers de l’eau et du sel, tout le glucose.",
            "view": "front",
            "sel": [
              "pct"
            ]
          },
          {
            "t": "L’anse de Henlé",
            "x": "Elle crée le gradient qui permet de concentrer l’urine.",
            "view": "front",
            "sel": [
              "loop of henle",
              "thick ascending"
            ]
          },
          {
            "t": "Le tube distal",
            "x": "Réglages fins ; la macula densa contrôle le débit de filtration.",
            "view": "front",
            "sel": [
              "dct",
              "juxtaglomerular"
            ]
          },
          {
            "t": "Le tube collecteur",
            "x": "L’ADH y règle la réabsorption d’eau.",
            "view": "front",
            "sel": [
              "collecting duct"
            ]
          }
        ]
      }
    ],
    "alveole": [
      {
        "id": "hematose",
        "n": "Les échanges gazeux",
        "steps": [
          {
            "t": "Les voies",
            "x": "Bronchiole terminale, bronchiole respiratoire, puis sacs alvéolaires.",
            "view": "front",
            "sel": [
              "terminal bronchiole",
              "respiratory bronchiole"
            ]
          },
          {
            "t": "Les alvéoles",
            "x": "Une paroi très fine : les gaz diffusent en moins d’une seconde.",
            "view": "q34",
            "sel": [
              "alveoli"
            ]
          },
          {
            "t": "Le sang",
            "x": "Il arrive pauvre en O2 par l’artériole pulmonaire et repart oxygéné par la veinule.",
            "view": "q34",
            "sel": [
              "pulmonary arteriole",
              "pulmonary venule",
              "alveolar capillaries"
            ]
          },
          {
            "t": "Le surfactant",
            "x": "Fabriqué par les pneumocytes de type II.",
            "view": "q34",
            "sel": [
              "type 2 pneumocytes"
            ]
          }
        ]
      }
    ],
    "villosite": [
      {
        "id": "absorption",
        "n": "L’absorption",
        "steps": [
          {
            "t": "L’épithélium",
            "x": "Les entérocytes absorbent les nutriments.",
            "view": "front",
            "sel": [
              "villus epithelium"
            ]
          },
          {
            "t": "Les capillaires",
            "x": "Glucides et acides aminés partent vers la veine porte.",
            "view": "front",
            "layer": 1,
            "sel": [
              "villus capillaries"
            ]
          },
          {
            "t": "Le chylifère",
            "x": "Les lipides partent dans la lymphe.",
            "view": "front",
            "layer": 1,
            "sel": [
              "lacteal"
            ]
          },
          {
            "t": "Les cryptes",
            "x": "Elles renouvellent l’épithélium en quelques jours.",
            "view": "front",
            "layer": 1,
            "sel": [
              "crypts"
            ]
          }
        ]
      }
    ],
    "peau": [
      {
        "id": "couches",
        "n": "Les couches de la peau",
        "steps": [
          {
            "t": "L’épiderme",
            "x": "Épithélium stratifié kératinisé, sans vaisseaux.",
            "view": "q34",
            "sel": [
              "epidermis",
              "stratum corneum"
            ]
          },
          {
            "t": "Le derme",
            "x": "Conjonctif avec vaisseaux, nerfs et annexes.",
            "view": "q34",
            "sel": [
              "dermis"
            ]
          },
          {
            "t": "L’hypoderme",
            "x": "Tissu adipeux.",
            "view": "q34",
            "sel": [
              "hypodermis"
            ]
          },
          {
            "t": "Les annexes",
            "x": "Poil, glande sébacée, muscle arrecteur, glande sudoripare.",
            "view": "q34",
            "layer": 1,
            "sel": [
              "hair",
              "sebaceous",
              "sweat gland",
              "arrector"
            ]
          }
        ]
      }
    ],
    "dent": [
      {
        "id": "tissus",
        "n": "Les tissus de la dent",
        "steps": [
          {
            "t": "L’émail",
            "x": "Il couvre la couronne ; il ne se répare pas.",
            "view": "front",
            "sel": [
              "enamel"
            ]
          },
          {
            "t": "La dentine",
            "x": "La masse de la dent, parcourue de tubuli.",
            "view": "front",
            "sel": [
              "dentin"
            ]
          },
          {
            "t": "La pulpe",
            "x": "Tissu vivant avec vaisseaux et nerfs, ouvert à l’apex.",
            "view": "front",
            "layer": 2,
            "sel": [
              "pulp"
            ]
          },
          {
            "t": "Le parodonte",
            "x": "Cément, ligament alvéolo-dentaire, os alvéolaire et gencive tiennent la dent.",
            "view": "front",
            "sel": [
              "cementum",
              "periodontal ligament",
              "alveolar bone",
              "gingiva"
            ]
          }
        ]
      }
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
  const toursOf = () => [
    ...(TOURS[model.id] || []),
    ...ATL_PATHO.filter((P) => P.base == model.id).map((P) => ({ id: "p-" + P.id, n: "Pathologie : " + P.titre, steps: P.steps })),
    ...(ATL.custom || []).filter((t) => t.model == model.id),
  ];
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
      // zones atteintes (pathologies) : teinte sombre « lésion »
      const les = st.les ? byF(st.les) : [];
      les.forEach((p) => V.hOne.delete(p));
      if (keep) les.forEach((p) => V.ghost.add(p));
      const lesKey = les.map((p) => V.parts.indexOf(p)).join(",");
      if (lesKey != (V.lesKey || "")) {
        V.lesion = les.length ? new Set(les) : null;
        V.lesKey = lesKey;
        materials(true);
      }
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
    if (V.pm) setTimeout(() => ATL.v === V && V.pm && !V.tour && pmBar(), 0);    if (V.lesion) {
      V.lesion = null;
      V.lesKey = "";
      materials(true);
    }

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
      $("atmeas").innerHTML = '<span class="atml">' + atlasLen(V.meas.pts[0].distanceTo(V.meas.pts[1]) * (V.k || 1)) + "</span>";
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
    if (V.pm) pmLabels(w, h);
    if (V.clin) clinLabels(w, h);
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
      k = V.k || 1,
      steps = [1, 2, 5].flatMap((m) => [-9, -8, -7, -6, -5, -4, -3, -2, -1].map((e) => m * 10 ** e)).sort((a, b) => a - b),
      Lr = steps.find((s) => (s / k) * ppm >= 50) || 0.2,
      Lm = Lr / k;
    $("atscale").firstChild.style.width = Math.round(Lm * ppm) + "px";
    $("atscale").lastChild.textContent = atlasLen(Lr);
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
    if (V.mv) {
      mvTick(now);
      V.dirty = true;
    }
    if (V.path) pathTick(now);
    if (V.breath.on) {
      V.breath.s = (1 - Math.cos(((now - V.breath.t0) / 4500) * Math.PI * 2)) / 2;
      pose();
    }
    if (controls.update() && V.pres) V.dirty = true;
    if (!V.dirty || V.hold) return;
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
    stem = base.replace(/\.glb$/, "").replace(/-hd$/, ""),
    target = variant != null ? id : (ATL.models.find((m) => m.id == stem) || ATL.models.filter((m) => base.startsWith(m.id)).sort((a, b) => b.id.length - a.id.length)[0] || {}).id,
    hd = variant != null ? variant == "-hd" : /-hd\.glb$/i.test(base);
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

// ---------- QCM d'anatomie générés à partir des fiches des atlas ouverts (mélangés aux QCM dans Réviser) ----------
// Les fiches de chaque atlas ouvert sont gardées sur l'appareil (mr_atlas_fic) ; les questions ne touchent pas aux statistiques des UE.
const ATL_QLAB = [
  [/^innervation/i, "Innervation"],
  [/^action/i, "Action"],
  [/^origine/i, "Origine"],
  [/^terminaison/i, "Terminaison"],
  [/^insertions?/i, "Insertions"],
  [/^vascularisation/i, "Vascularisation"],
  [/^r[ôo]les?$/i, "Rôle"],
  [/^fonctions?$/i, "Fonction"],
  [/^trajet/i, "Trajet"],
  [/^territoire/i, "Territoire"],
  [/^branches/i, "Branches"],
];
function atlasFicheSave(id, fiches) {
  try {
    const all = JSON.parse(localStorage.getItem("mr_atlas_fic") || "{}"),
      out = {};
    Object.entries(fiches || {}).forEach(([k, f]) => {
      const rows = (f.rows || []).filter((r) => ATL_QLAB.some(([re]) => re.test(r[0])) && r[1] && r[1].length < 220);
      if (rows.length) out[k] = { t: f.titre, r: rows };
    });
    all[id] = out;
    localStorage.setItem("mr_atlas_fic", JSON.stringify(all));
  } catch (e) {}
}
function atlasQcmCount() {
  try {
    const all = JSON.parse(localStorage.getItem("mr_atlas_fic") || "{}");
    return Object.values(all).reduce((n, m) => n + Object.values(m).reduce((k, f) => k + f.r.length, 0), 0);
  } catch (e) {
    return 0;
  }
}
function atlasQcmGen(n) {
  let all = {};
  try {
    all = JSON.parse(localStorage.getItem("mr_atlas_fic") || "{}");
  } catch (e) {}
  const pool = [],
    byLab = {};
  Object.entries(all).forEach(([mid, fs]) =>
    Object.entries(fs).forEach(([k, f]) =>
      f.r.forEach((r) => {
        const L = (ATL_QLAB.find(([re]) => re.test(r[0])) || [, r[0]])[1];
        const it = { mid, k, t: f.t, L, x: r[1] };
        pool.push(it);
        (byLab[L] = byLab[L] || []).push(it);
      }),
    ),
  );
  const seenF = new Set(),
    out = [],
    st = (S.atq && S.atq.g) || {};
  // les questions ratées reviennent plus souvent
  const w = (it) => Math.random() + ((st[it.mid + "|" + it.k + "|" + it.L] || 0) > 0 ? 0.8 : 0);
  for (const it of pool.map((it) => [w(it), it]).sort((a, b) => b[0] - a[0]).map((x) => x[1])) {
    if (out.length >= n) break;
    if (seenF.has(it.k)) continue;
    const others = [...new Set((byLab[it.L] || []).filter((o) => o.k !== it.k && o.x !== it.x).map((o) => o.x))];
    if (others.length < 3) continue;
    seenF.add(it.k);
    const d = others.sort(() => Math.random() - 0.5).slice(0, 3),
      mt = (ATL.models.find((m) => m.id == it.mid) || { titre: it.mid }).titre;
    out.push({
      id: "atl:" + it.mid + ":" + it.k + ":" + it.L,
      ch: "atl:" + it.mid,
      gen: 1,
      gk: it.mid + "|" + it.k + "|" + it.L,
      enonce: it.t + " : quelle proposition décrit " + ({ Action: "son action", Origine: "son origine", Terminaison: "sa terminaison", Insertions: "ses insertions", Innervation: "son innervation", Vascularisation: "sa vascularisation", Rôle: "son rôle", Fonction: "sa fonction", Trajet: "son trajet", Territoire: "son territoire", Branches: "ses branches" }[it.L] || it.L.toLowerCase()) + " ?",
      props: [{ t: it.x, ok: true }].concat(d.map((x) => ({ t: x, ok: false }))),
      expl: it.L + " : " + it.x + " (fiche « " + it.t + " », atlas " + mt + ").",
    });
  }
  return out;
}

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
