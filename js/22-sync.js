// ================= Compte et synchronisation (Supabase) =================
// Les données sont découpées en morceaux (« base », « stats », puis QCM, cartes et livrets par chapitre),
// et seuls les morceaux modifiés sont envoyés. Chaque morceau est une ligne de la table « etat ».
// Les PDF et images vont dans le stockage « fichiers », dans un dossier propre à l'utilisateur.
// Mémoire de synchronisation (localStorage « mr_sync ») : uid, sent (empreinte de chaque morceau envoyé),
// remote (date distante de chaque morceau connu), pf (fichiers à envoyer), pd (fichiers à supprimer).
const SY = { sb: null, user: null, st: "off", busy: 0, again: 0, t: 0, meta: null, last: 0, err: "" };
const SYK = ["qcm", "cards", "courses"],
  STK = ["hist", "act", "tm", "tu", "rc", "cs", "ms", "cf", "er", "days", "jm", "fsq", "err"],
  DEMO = ["a1", "p1", "p2", "b1"];
function syMeta() {
  if (!SY.meta) {
    try {
      SY.meta = JSON.parse(localStorage.getItem("mr_sync")) || {};
    } catch (e) {
      SY.meta = {};
    }
  }
  return SY.meta;
}
function syMetaSave() {
  try {
    localStorage.setItem("mr_sync", JSON.stringify(SY.meta));
  } catch (e) {}
}
// Empreinte rapide d'un texte (pour savoir si un morceau a changé).
const hs = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + "." + s.length;
};
function syChunks() {
  const o = {},
    base = { ...S },
    st = {};
  SYK.forEach((k) => {
    delete base[k];
    const g = {};
    (S[k] || []).forEach((x) => (g[x.ch || "_"] = g[x.ch || "_"] || []).push(x));
    for (const c in g) o[k + ":" + c] = JSON.stringify(g[c]);
  });
  STK.forEach((k) => {
    if (k in base) {
      st[k] = base[k];
      delete base[k];
    }
  });
  o.stats = JSON.stringify(st);
  o.base = JSON.stringify(base);
  return o;
}
function syAssemble(map) {
  const s = { ...JSON.parse(map.base || "{}"), ...JSON.parse(map.stats || "{}") };
  SYK.forEach((k) => {
    s[k] = [];
    for (const key in map) if (key.startsWith(k + ":")) s[k] = s[k].concat(JSON.parse(map[key]));
  });
  return s;
}
// Y a-t-il sur cet appareil du travail personnel (autre que la démo) ?
const userContent = () =>
  S.chap.some((c) => !DEMO.includes(c.id)) || S.hist.length > 0 || (S.fc || 0) > 0 || S.courses.some((c) => c.pdf);
const syPath = (id) => SY.user.id + "/" + String(id).replace(/[^a-zA-Z0-9_-]/g, "_"),
  cloudable = (id) => id && id !== "__etat" && !/:t$/.test(id);

// ---------- démarrage ----------
function syncInit() {
  if (!window.supabase || !SB_URL || !SB_KEY) {
    SY.st = "off";
    return;
  }
  try {
    SY.sb = supabase.createClient(SB_URL, SB_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  } catch (e) {
    SY.st = "off";
    return;
  }
  SY.st = "out";
  SY.sb.auth.onAuthStateChange((ev, ses) => {
    const u = (ses && ses.user) || null,
      was = SY.user && SY.user.id;
    SY.user = u;
    if (ev === "PASSWORD_RECOVERY") setTimeout(syNewPass, 50);
    if (!u) SY.st = "out";
    if (u && u.id !== was) setTimeout(() => syncNow(), 0);
    syUI(true);
  });
  addEventListener("online", () => syncNow());
  addEventListener("offline", () => {
    SY.st = SY.user ? "offline" : SY.st;
    syUI();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flushSave();
      if (SY.dirty) syncNow();
    } else syncNow();
  });
  setInterval(() => {
    if (!document.hidden) syncNow();
  }, 120000);
}
function syncSoon() {
  SY.dirty = 1;
  clearTimeout(SY.t);
  SY.t = setTimeout(syncNow, 4000);
}

// ---------- synchronisation ----------
async function syncNow() {
  if (!SY.sb || !SY.user) return;
  if (SY.busy) return (SY.again = 1);
  if (!navigator.onLine) {
    SY.st = "offline";
    return syUI();
  }
  SY.busy = 1;
  SY.dirty = 0;
  SY.st = "sync";
  syUI();
  let changed = 0;
  try {
    const M = syMeta(),
      uid = SY.user.id;
    let fresh = 0;
    if (M.uid !== uid) {
      SY.meta = { uid, sent: {}, remote: {}, pf: [], pd: [] };
      fresh = 1;
    }
    const m = SY.meta;
    // 1) liste des morceaux du compte et date de leur dernière modification
    const { data: rows, error } = await SY.sb.from("etat").select("cle,maj");
    if (error) throw error;
    const rm = {};
    rows.forEach((r) => (rm[r.cle] = r.maj));
    let loc = syChunks(),
      mode = "merge";
    if (fresh) {
      // premier passage de ce compte sur cet appareil
      if (!rows.length) mode = "push";
      else mode = userContent() ? await syAsk() : "pull";
      if (mode == "push") {
        m.sent = Object.fromEntries(Object.keys(rm).map((k) => [k, "?"]));
        m.remote = { ...rm };
        // tous les fichiers de l'appareil partent vers le compte
        m.pf = [...new Set((m.pf || []).concat((await idbKeys()).filter(cloudable)))];
      }
    }
    const dirty = (k) => hs(loc[k]) !== m.sent[k];
    // 2) récupérer ce qui a changé sur un autre appareil (pas pendant une séance de révision)
    if (mode != "push" && !R.run) {
      const need = Object.keys(rm).filter(
          (k) => mode == "pull" || (rm[k] !== m.remote[k] && (!(k in loc) || !dirty(k))),
        ),
        gone = mode == "pull" ? [] : Object.keys(m.remote).filter((k) => !(k in rm) && k in loc && !dirty(k));
      if (need.length || gone.length || mode == "pull") {
        const map = mode == "pull" ? {} : { ...loc };
        for (let i = 0; i < need.length; i += 40) {
          const { data, error: e2 } = await SY.sb
            .from("etat")
            .select("cle,data,maj")
            .in("cle", need.slice(i, i + 40));
          if (e2) throw e2;
          data.forEach((r) => {
            map[r.cle] = r.data;
            m.remote[r.cle] = r.maj;
            m.sent[r.cle] = hs(r.data);
          });
        }
        gone.forEach((k) => {
          delete map[k];
          delete m.remote[k];
          delete m.sent[k];
        });
        if (mode == "pull") {
          m.sent = Object.fromEntries(Object.keys(map).map((k) => [k, hs(map[k])]));
          m.remote = { ...rm };
        }
        if (map.base) {
          const ui = ["pal", "mode", "bg", "bgd", "fx"].reduce((o, k) => ((o[k] = S[k]), o), {});
          S = syAssemble(map);
          if (mode == "pull") Object.keys(ui).forEach((k) => ui[k] !== undefined && S[k] === undefined && (S[k] = ui[k]));
          BOOT = JSON.stringify(S);
          load();
          BOOT = JSON.stringify(S);
          flushSave();
          PD = null;
          changed = 1;
        }
        loc = syChunks();
      }
    }
    // 3) envoyer ce qui a changé ici
    const up = Object.keys(loc).filter(dirty),
      del = Object.keys(m.sent).filter((k) => !(k in loc));
    for (let i = 0; i < up.length; ) {
      const batch = [];
      let sz = 0;
      while (i < up.length && (batch.length == 0 || sz + loc[up[i]].length < 1500000)) {
        sz += loc[up[i]].length;
        batch.push({ user_id: uid, cle: up[i], data: loc[up[i]] });
        i++;
      }
      const { data, error: e3 } = await SY.sb.from("etat").upsert(batch).select("cle,maj");
      if (e3) throw e3;
      data.forEach((r) => (m.remote[r.cle] = r.maj));
      batch.forEach((r) => (m.sent[r.cle] = hs(r.data)));
      syMetaSave();
    }
    if (del.length) {
      const { error: e4 } = await SY.sb.from("etat").delete().in("cle", del);
      if (e4) throw e4;
      del.forEach((k) => {
        delete m.sent[k];
        delete m.remote[k];
      });
    }
    syMetaSave();
    // 4) fichiers (PDF, images de schémas)
    await syFiles();
    SY.st = "ok";
    SY.err = "";
    SY.last = Date.now();
  } catch (e) {
    SY.st = navigator.onLine ? "err" : "offline";
    SY.err = (e && (e.message || e.error_description)) || String(e);
    console.warn("Synchronisation :", e);
  }
  SY.busy = 0;
  syMetaSave();
  syUI(changed);
  if (SY.again) {
    SY.again = 0;
    setTimeout(syncNow, 500);
  }
}
async function syFiles() {
  const m = syMeta(),
    st = SY.sb.storage.from("fichiers");
  for (const id of (m.pd || []).slice()) {
    const { error } = await st.remove([syPath(id)]);
    if (!error) m.pd = m.pd.filter((x) => x !== id);
  }
  for (const id of (m.pf || []).slice()) {
    let v = null;
    try {
      v = await pdfOp("get", id);
    } catch (e) {}
    if (v == null) {
      m.pf = m.pf.filter((x) => x !== id);
      continue;
    }
    const isTxt = typeof v == "string",
      blob = new Blob([v], { type: isTxt ? "text/plain" : "application/pdf" }),
      { error } = await st.upload(syPath(id), blob, { upsert: true, contentType: blob.type });
    if (error && !/exceeded|too large|413/i.test(error.message || "")) throw error;
    if (error) SY.big = (SY.big || 0) + 1;
    m.pf = m.pf.filter((x) => x !== id);
    syMetaSave();
  }
}
const idbKeys = () =>
  DB().then(
    (d) =>
      new Promise((ok, ko) => {
        const q = d.transaction("pdf", "readonly").objectStore("pdf").getAllKeys();
        q.onsuccess = () => ok(q.result.map(String));
        q.onerror = () => ko(q.error);
      }),
  );
// Appelés par pdfPut / pdfGet / pdfDel (19-ajout.js).
function cloudPut(id) {
  if (!cloudable(id)) return;
  const m = syMeta();
  m.pf = [...new Set((m.pf || []).concat(id))];
  m.pd = (m.pd || []).filter((x) => x !== id);
  syMetaSave();
  syncSoon();
}
function cloudDel(id) {
  if (!cloudable(id)) return;
  const m = syMeta();
  m.pf = (m.pf || []).filter((x) => x !== id);
  m.pd = [...new Set((m.pd || []).concat(id))];
  syMetaSave();
  syncSoon();
}
async function cloudGet(id) {
  if (!SY.sb || !SY.user || !cloudable(id) || !navigator.onLine) return null;
  try {
    const { data, error } = await SY.sb.storage.from("fichiers").download(syPath(id));
    if (error || !data) return null;
    return /^im:/.test(id) ? await data.text() : await data.arrayBuffer();
  } catch (e) {
    return null;
  }
}
// Réinitialisation : supprime aussi les fichiers du compte.
async function syncWipeFiles() {
  const m = syMeta();
  m.pf = [];
  m.pd = [];
  syMetaSave();
  if (!SY.sb || !SY.user) return;
  const st = SY.sb.storage.from("fichiers");
  for (let k = 0; k < 50; k++) {
    const { data } = await st.list(SY.user.id, { limit: 100 });
    if (!data || !data.length) break;
    await st.remove(data.map((f) => SY.user.id + "/" + f.name));
  }
}

// ---------- dialogues ----------
function syAsk() {
  return new Promise((done) => {
    const d = document.createElement("div");
    d.id = "md";
    d.innerHTML =
      '<div class="mb" role="dialog" aria-modal="true"><h3>Quelles données garder ?</h3><p class="m" style="font-weight:500">Ton compte contient déjà des données, et cet appareil aussi. Choisis lesquelles garder : les autres seront remplacées.</p><button class="big" id="syp1">Celles de mon compte (recommandé)</button><button class="big" style="background:var(--mut)" id="syp2">Celles de cet appareil</button></div>';
    document.body.appendChild(d);
    $("syp1").onclick = () => {
      d.remove();
      done("pull");
    };
    $("syp2").onclick = () => {
      d.remove();
      done("push");
    };
  });
}
function syNewPass() {
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>Nouveau mot de passe</h3><label class="f">Choisis un nouveau mot de passe (6 caractères minimum)</label><input type="password" id="synp" autocomplete="new-password"><p id="em" class="m" role="status"></p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Enregistrer</button></div></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("my").onclick = async () => {
    const p = $("synp").value;
    if (p.length < 6) return ($("em").textContent = "6 caractères minimum.");
    const { error } = await SY.sb.auth.updateUser({ password: p });
    if (error) return ($("em").textContent = syTr(error.message));
    d.remove();
  };
}

// ---------- connexion ----------
const syTr = (m) =>
  /invalid login/i.test(m)
    ? "E-mail ou mot de passe incorrect."
    : /not confirmed/i.test(m)
      ? "Confirme d’abord ton e-mail avec le lien reçu, puis reconnecte-toi."
      : /already registered|already exists/i.test(m)
        ? "Un compte existe déjà avec cet e-mail : connecte-toi."
        : /rate limit|too many|security purposes/i.test(m)
          ? "Trop de tentatives : réessaie dans quelques minutes."
          : /password/i.test(m) && /6|short|weak/i.test(m)
            ? "Mot de passe trop court ou trop simple (6 caractères minimum)."
            : /fetch|network/i.test(m)
              ? "Pas de connexion internet."
              : m;
const syMsg = (t) => {
  if ($("sym")) $("sym").textContent = t;
};
async function syLogin(signup) {
  const e = ($("sye").value || "").trim(),
    p = $("syp").value || "";
  if (!/^\S+@\S+\.\S+$/.test(e)) return syMsg("Indique une adresse e-mail valide.");
  if (p.length < 6) return syMsg("Le mot de passe doit faire au moins 6 caractères.");
  syMsg(signup ? "Création du compte…" : "Connexion…");
  const r = signup
    ? await SY.sb.auth.signUp({ email: e, password: p, options: { emailRedirectTo: location.href.split("#")[0] } })
    : await SY.sb.auth.signInWithPassword({ email: e, password: p });
  if (r.error) return syMsg(syTr(r.error.message));
  if (signup && !r.data.session)
    syMsg("Compte créé. Ouvre le lien reçu par e-mail pour le confirmer, puis reviens te connecter ici.");
}
async function syForgot() {
  const e = ($("sye").value || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(e)) return syMsg("Écris d’abord ton adresse e-mail ci-dessus.");
  const { error } = await SY.sb.auth.resetPasswordForEmail(e, { redirectTo: location.href.split("#")[0] });
  syMsg(error ? syTr(error.message) : "E-mail envoyé : ouvre le lien pour choisir un nouveau mot de passe.");
}
function syLogout() {
  ask(
    "Te déconnecter ? Tes données restent sur cet appareil, mais ne seront plus sauvegardées dans ton compte.",
    async () => {
      await syncNow();
      await SY.sb.auth.signOut();
      SY.meta = {};
      syMetaSave();
      render();
    },
    "Me déconnecter",
  );
}

// ---------- affichage ----------
const SYL = {
  off: "Synchronisation indisponible",
  out: "Non connecté : données seulement sur cet appareil",
  sync: "Synchronisation…",
  ok: "Synchronisé",
  err: "Erreur de synchronisation",
  offline: "Hors connexion : synchronisation à la reconnexion",
};
function syAgo() {
  if (!SY.last) return "";
  const s = Math.round((Date.now() - SY.last) / 1000);
  return s < 60 ? "à l’instant" : s < 3600 ? "il y a " + Math.round(s / 60) + " min" : "il y a " + Math.round(s / 3600) + " h";
}
// Petit indicateur dans la bannière.
function syBadge() {
  if (SY.st == "off") return "";
  const c = { out: "#ffd27a", sync: "#fff", ok: "#9be7a5", err: "#ff9b8f", offline: "#ffd27a" }[SY.st] || "#fff";
  return (
    '<button class="syb" id="syb" onclick="go(\'prof\');setTimeout(()=>jump(\'cpt\'),80)" title="' +
    SYL[SY.st] +
    '" aria-label="' +
    SYL[SY.st] +
    '"><i style="background:' +
    c +
    '"' +
    (SY.st == "sync" ? ' class="pu"' : "") +
    "></i>" +
    icn("cloud") +
    "</button>"
  );
}
function syBox() {
  if (!SY.sb)
    return '<div class="c"><p class="m" style="margin:0">Synchronisation indisponible : la bibliothèque n’a pas pu se charger. Vérifie ta connexion puis relance l’application.</p></div>';
  if (!SY.user)
    return (
      '<div class="c"><p style="margin-top:0">Connecte-toi pour sauvegarder automatiquement ton travail (PDF compris) et le retrouver sur ton iPhone et ton PC.</p><label class="f">E-mail</label><input type="text" id="sye" inputmode="email" autocomplete="email" autocapitalize="off"><label class="f">Mot de passe</label><input type="password" id="syp" autocomplete="current-password"><div class="r"><button class="b p" onclick="syLogin(0)">Se connecter</button><button class="b" onclick="syLogin(1)">Créer un compte</button><button class="b" onclick="syForgot()">Mot de passe oublié</button></div><p id="sym" class="m" role="status"></p></div>'
    );
  const m = syMeta(),
    pf = (m.pf || []).length;
  return (
    '<div class="c"><p style="margin-top:0">Connecté avec <b>' +
    esc(SY.user.email || "") +
    '</b></p><p class="m" style="margin:.2em 0">' +
    SYL[SY.st] +
    (SY.st == "ok" && SY.last ? " " + syAgo() : "") +
    (pf ? " · " + pf + " fichier" + (pf > 1 ? "s" : "") + " en attente d’envoi" : "") +
    "</p>" +
    (SY.st == "err" ? '<p class="wnl">' + esc(syTr(SY.err)) + "</p>" : "") +
    (SY.big ? '<p class="wnl">Un PDF dépasse la taille maximale (50 Mo) : il reste seulement sur cet appareil.</p>' : "") +
    '<div class="r"><button class="b p" onclick="syncNow()">Synchroniser maintenant</button><button class="b" onclick="syLogout()">Se déconnecter</button></div><small style="display:block;margin-top:8px">Tout est enregistré sur cet appareil, même hors connexion, puis envoyé dans ton compte quelques secondes après chaque modification.</small></div>'
  );
}
// Met à jour l'indicateur, le bloc Compte, et l'écran si les données ont changé.
function syUI(full) {
  const b = $("syb");
  if (b) b.outerHTML = syBadge();
  if ($("sybox") && !(document.activeElement && /INPUT/.test(document.activeElement.tagName) && document.activeElement.closest("#sybox")))
    $("sybox").innerHTML = syBox();
  if (full && !R.run && !$("md") && !(tab == "cours" && R.id)) render();
}
