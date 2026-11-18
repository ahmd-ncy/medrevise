// ================= Compte et synchronisation (Supabase) =================
// Les données sont découpées en morceaux (« base », « stats », puis QCM, cartes et livrets par chapitre),
// et seuls les morceaux modifiés sont envoyés. Chaque morceau est une ligne de la table « etat ».
// Les PDF et images vont dans le stockage « fichiers », dans un dossier propre à l'utilisateur.
// Mémoire de synchronisation (localStorage « mr_sync ») : uid, sent (empreinte de chaque morceau envoyé),
// remote (date distante de chaque morceau connu), pf (fichiers à envoyer), pd (fichiers à supprimer).
const SY = { sb: null, user: null, st: "off", busy: 0, again: 0, t: 0, meta: null, last: 0, err: "", ready: 0, role: null, gt: "in" };
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
    SY.ready = 1;
    if (ev === "PASSWORD_RECOVERY") setTimeout(syNewPass, 50);
    if (!u) {
      SY.st = "out";
      SY.role = null;
    }
    if (u && u.id !== was) {
      // rôle mémorisé (permet d'ouvrir l'app hors connexion), puis vérifié auprès du serveur
      const c = syRoleCache();
      SY.role = c && c.uid === u.id ? c.role : null;
      setTimeout(syCheckMember, 0);
    }
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
  if (!SY.sb || !SY.user || !SY.role) return;
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
          const ui = ["pal", "mode", "bg", "bgd", "fx", "font", "rad", "tsz", "mono", "acc", "anim", "theme"].reduce((o, k) => ((o[k] = S[k]), o), {});
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
    // 5) profil visible par l'administrateur (prénom, photo, filière, résumé de progression)
    await syProfil();
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
    '<div class="mb" role="dialog" aria-modal="true"><h3>Nouveau mot de passe</h3>' +
    pwFields("snp", "Choisis un nouveau mot de passe") +
    '<p id="em" class="m" role="status"></p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Enregistrer</button></div></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("my").onclick = async () => {
    const pe = pwErr("snp");
    if (pe) return ($("em").textContent = pe);
    const { error } = await SY.sb.auth.updateUser({ password: $("snpp").value });
    if (error) return ($("em").textContent = syTr(error.message));
    d.remove();
    toast("Mot de passe modifié ✔");
    render();
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
            ? "Mot de passe trop faible : au moins 8 caractères, avec des lettres, des chiffres et un symbole."
            : /could not find the function|schema cache/i.test(m)
              ? "Mise à jour de la base nécessaire : exécute le fichier supabase.sql dans Supabase (SQL Editor)."
              : /fetch|network/i.test(m)
              ? "Pas de connexion internet."
              : m;
const syMsg = (t) => {
  if ($("sym")) $("sym").textContent = t;
};
async function syLogin(signup) {
  const e = ($("sye").value || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(e)) return syMsg("Indique une adresse e-mail valide.");
  let code = "",
    p = "",
    nm = "";
  if (signup) {
    code = ($("syc").value || "").trim();
    nm = ($("syn").value || "").trim();
    if (!code) return syMsg("Entre ton code d’invitation.");
    if (!nm) return syMsg("Indique ton prénom.");
    const pe = pwErr("syw");
    if (pe) return syMsg(pe);
    p = $("sywp").value;
    syMsg("Vérification du code…");
    const v = await SY.sb.rpc("invitation_valide", { p_code: code });
    if (v.error) return syMsg(syTr(v.error.message));
    if (!v.data) return syMsg("Code invalide, expiré ou déjà utilisé. Demande un nouveau code.");
  } else {
    p = $("syp").value || "";
    if (!p) return syMsg("Entre ton mot de passe.");
  }
  syMsg(signup ? "Création du compte…" : "Connexion…");
  const r = signup
    ? await SY.sb.auth.signUp({
        email: e,
        password: p,
        options: { emailRedirectTo: location.href.split("#")[0], data: { prenom: nm } },
      })
    : await SY.sb.auth.signInWithPassword({ email: e, password: p });
  if (r.error) return syMsg(syTr(r.error.message));
  if (signup) {
    if (!S.name) {
      S.name = nm;
      save();
    }
    if (!r.data.session) {
      try {
        localStorage.setItem("mr_code", code);
      } catch (x) {}
      return syMsg("Compte créé. Ouvre le lien reçu par e-mail pour le confirmer, puis reviens te connecter ici.");
    }
    const u = await SY.sb.rpc("utiliser_invitation", { p_code: code });
    if (u.error || !u.data) syMsg(u.error ? syTr(u.error.message) : "Le code n’a pas pu être utilisé : il vient peut-être d’expirer.");
    await syCheckMember();
  }
}
// Changer son mot de passe depuis l'app (vérifie d'abord le mot de passe actuel).
function syChangePass() {
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>Changer mon mot de passe</h3><label class="f">Mot de passe actuel</label><div class="pwi"><input type="password" id="cpo" autocomplete="current-password"><button type="button" class="eye" onclick="pwEye(this)" aria-label="Afficher">' +
    icn("eye") +
    "</button></div>" +
    pwFields("cpn", "Nouveau mot de passe") +
    '<p id="em" class="m" role="status"></p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Enregistrer</button></div><button class="lnk" onclick="document.getElementById(\'md\').remove();syForgotMe()">J’ai oublié mon mot de passe actuel</button></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("my").onclick = async () => {
    const pe = pwErr("cpn");
    if (pe) return ($("em").textContent = pe);
    if ($("cpnp").value === $("cpo").value) return ($("em").textContent = "Choisis un mot de passe différent de l’actuel.");
    $("em").textContent = "Vérification…";
    const v = await SY.sb.auth.signInWithPassword({ email: SY.user.email, password: $("cpo").value });
    if (v.error) return ($("em").textContent = "Mot de passe actuel incorrect.");
    const { error } = await SY.sb.auth.updateUser({ password: $("cpnp").value });
    if (error) return ($("em").textContent = syTr(error.message));
    d.remove();
    toast("Mot de passe modifié ✔");
  };
}
async function syForgotMe() {
  const { error } = await SY.sb.auth.resetPasswordForEmail(SY.user.email, { redirectTo: location.href.split("#")[0] });
  toast(error ? syMailErr(error) : "E-mail envoyé à " + esc(SY.user.email) + " : ouvre le lien pour choisir un nouveau mot de passe.");
}
// Erreurs d'envoi d'e-mail : Supabase a deux limites différentes.
// - « you can only request this after N seconds » : délai entre deux demandes pour la même adresse ;
// - « email rate limit exceeded » : quota d'e-mails par heure pour tout le projet (Authentication → Rate Limits).
function syMailErr(er) {
  const m = (er && er.message) || "",
    c = (er && er.code) || "",
    n = (m.match(/after (\d+) second/) || [])[1];
  if (n) return "Un e-mail vient d’être envoyé à cette adresse. Tu pourras en redemander un dans " + n + " s.";
  if (c == "over_email_send_rate_limit" || /email rate limit/i.test(m))
    return "Trop d’e-mails envoyés par l’app cette heure-ci (limite de Supabase). Réessaie plus tard, ou demande à l’administrateur de relever la limite.";
  if (c == "over_request_rate_limit" || /too many|rate limit/i.test(m)) return "Trop de demandes depuis cet appareil : réessaie dans quelques minutes.";
  if (/sending|smtp|mail/i.test(m)) return "L’e-mail n’a pas pu partir (réglage d’envoi à vérifier côté administrateur).";
  return syTr(m) + (c ? " (" + c + ")" : "");
}
// Envoi du lien « mot de passe oublié », avec un état visible et un délai maximum.
async function syForgot() {
  const e = ($("sye").value || "").trim(),
    b = $("fpb");
  if (!/^\S+@\S+\.\S+$/.test(e)) return syMsg("Indique l’adresse e-mail de ton compte.");
  if (b) {
    b.disabled = true;
    b.textContent = "Envoi…";
  }
  syMsg("");
  let r;
  try {
    r = await Promise.race([
      SY.sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin + location.pathname }),
      new Promise((_, ko) => setTimeout(() => ko(new Error("délai")), 15000)),
    ]);
  } catch (x) {
    r = { error: { message: x.message == "délai" ? "Le serveur ne répond pas. Vérifie ta connexion et réessaie." : x.message } };
  }
  if (b) {
    b.disabled = false;
    b.textContent = "Envoyer le lien";
  }
  if (r && r.error) {
    console.warn("Mot de passe oublié :", r.error);
    return syMsg(syMailErr(r.error));
  }
  const g = document.querySelector(".gcard");
  if (g)
    g.innerHTML =
      '<div class="gok">' +
      icn("check") +
      '<h3>E-mail envoyé</h3><p>Si un compte existe pour <b>' +
      esc(e) +
      "</b>, tu vas recevoir un lien dans quelques instants. Pense à regarder dans les spams.</p><p>Le lien s’ouvre dans ton navigateur : choisis ton nouveau mot de passe, puis reviens te connecter ici.</p><button class=\"big gbtn\" onclick=\"SY.gt='in';render()\">Retour à la connexion</button></div>";
}
function syLogout() {
  ask(
    "Te déconnecter ? Tes données restent sur cet appareil, mais ne seront plus sauvegardées dans ton compte.",
    async () => {
      await syncNow();
      await syOut();
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
    '<button class="syb" id="syb" onclick="profGo(\'compte\')" title="' +
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
      '<div class="c"><p style="margin:0">Non connecté.</p></div>'
    );
  const m = syMeta(),
    pf = (m.pf || []).length;
  return (
    '<div class="c"><p style="margin-top:0">Connecté avec <b>' +
    esc(SY.user.email || "") +
    '</b>' +
    (SY.acc && SY.acc.expire && SY.role != "admin" ? "<br><small>Accès jusqu’au " + fdt(SY.acc.expire) + "</small>" : "") +
    '</p><p class="m" style="margin:.2em 0">' +
    SYL[SY.st] +
    (SY.st == "ok" && SY.last ? " " + syAgo() : "") +
    (pf ? " · " + pf + " fichier" + (pf > 1 ? "s" : "") + " en attente d’envoi" : "") +
    "</p>" +
    (SY.st == "err" ? '<p class="wnl">' + esc(syTr(SY.err)) + "</p>" : "") +
    (SY.big ? '<p class="wnl">Un PDF dépasse la taille maximale (50 Mo) : il reste seulement sur cet appareil.</p>' : "") +
    '<div class="r"><button class="b p" onclick="syncNow()">Synchroniser maintenant</button><button class="b" onclick="syChangePass()">Changer mon mot de passe</button><button class="b" onclick="syLogout()">Se déconnecter</button></div><small style="display:block;margin-top:8px">Tout est enregistré sur cet appareil, même hors connexion, puis envoyé dans ton compte quelques secondes après chaque modification.</small></div>' +
    (SY.role == "admin"
      ? '<button class="rs" style="--sc:var(--c1);margin-top:10px" onclick="profGo(\'admin\')">' +
        icn("shield") +
        "<span><b>Administration</b><br><small>Membres, invitations et accès</small></span></button>"
      : "")
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

// ================= Accès sur invitation =================
// Seuls les « membres » (table membres) peuvent utiliser l'app et synchroniser : la base le vérifie elle-même.
// On devient membre avec un code d'invitation à usage unique, créé par l'administrateur (24 h par défaut).
function syRoleCache(v) {
  try {
    if (v !== undefined) localStorage.setItem("mr_mbr", JSON.stringify(v));
    return JSON.parse(localStorage.getItem("mr_mbr"));
  } catch (e) {
    return null;
  }
}
async function syCheckMember() {
  if (!SY.user) return;
  const uid = SY.user.id;
  try {
    let role = null,
      r0 = await SY.sb.rpc("mon_acces");
    if (r0.error && /function|schema cache/i.test(r0.error.message || "")) {
      // base pas encore mise à jour (supabase.sql) : ancien contrôle
      const r1 = await SY.sb.rpc("mon_role");
      if (r1.error) throw r1.error;
      role = r1.data;
      SY.acc = null;
    } else {
      if (r0.error) throw r0.error;
      SY.acc = r0.data || null;
      role = SY.acc && !SY.acc.expire_deja ? SY.acc.role : null;
    }
    // code saisi à l'inscription, quand le compte devait d'abord être confirmé par e-mail
    let pend = null;
    try {
      pend = localStorage.getItem("mr_code");
    } catch (e) {}
    if (!role && pend) {
      const r = await SY.sb.rpc("utiliser_invitation", { p_code: pend });
      if (!r.error && r.data) role = "membre";
      try {
        localStorage.removeItem("mr_code");
      } catch (e) {}
    }
    SY.role = role || null;
    SY.roleErr = 0;
    const pm = SY.user.user_metadata && SY.user.user_metadata.prenom;
    if (role && !S.name && pm) {
      S.name = String(pm).slice(0, 40);
      save();
    }
    syRoleCache(role ? { uid, role } : null);
  } catch (e) {
    SY.roleErr = 1; // hors connexion : on garde le rôle mémorisé
  }
  syUI(true);
  if (SY.role) syncNow();
}
// L'app est-elle verrouillée (pas de compte membre) ?
const syGate = () => !!SY.sb && !(SY.user && SY.role);
async function syOut() {
  await SY.sb.auth.signOut();
  SY.meta = {};
  syMetaSave();
  syRoleCache(null);
  SY.role = null;
  render();
}
// ---------- mot de passe solide ----------
const PWBAD = ["motdepasse", "password", "azerty", "qwerty", "123456", "soleil", "medecine", "medrevise", "bonjour", "iloveyou"];
function pwScore(p) {
  const c = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length,
    low = p.toLowerCase(),
    bad = PWBAD.some((w) => low.includes(w)) || /^(.)\1+$/.test(p) || /0123|1234|2345|3456|4567|5678|6789|abcd/i.test(p);
  let sc = 0;
  if (p.length >= 8) sc++;
  if (p.length >= 12) sc++;
  if (c >= 3) sc++;
  if (c >= 4 || (p.length >= 16 && c >= 2)) sc++;
  if (bad) sc = Math.min(sc, 1);
  return { sc, ok: p.length >= 8 && c >= 3 && !bad, c, bad };
}
// Champs « nouveau mot de passe » + confirmation, avec jauge et consignes.
function pwFields(pre, lab) {
  return (
    '<label class="f">' +
    (lab || "Mot de passe") +
    '</label><div class="pwi"><input type="password" id="' +
    pre +
    'p" autocomplete="new-password" oninput="pwUpd(\'' +
    pre +
    '\')"><button type="button" class="eye" onclick="pwEye(this)" aria-label="Afficher le mot de passe">' +
    icn("eye") +
    '</button></div><div class="pwm" id="' +
    pre +
    'm"><i></i><i></i><i></i><i></i><small></small></div><ul class="pwr" id="' +
    pre +
    'r"><li data-k="l">Au moins 8 caractères (12 c’est mieux)</li><li data-k="c">Au moins 3 types parmi : minuscules, majuscules, chiffres, symboles</li><li data-k="b">Pas de mot courant ni de suite (azerty, 1234…)</li></ul><label class="f">Confirme le mot de passe</label><div class="pwi"><input type="password" id="' +
    pre +
    'c" autocomplete="new-password" oninput="pwUpd(\'' +
    pre +
    '\')"><button type="button" class="eye" onclick="pwEye(this)" aria-label="Afficher le mot de passe">' +
    icn("eye") +
    '</button></div><small class="pwk" id="' +
    pre +
    'k"></small>'
  );
}
function pwUpd(pre) {
  if ($("sym")) $("sym").textContent = "";
  const p = $(pre + "p").value,
    c = $(pre + "c").value,
    r = pwScore(p),
    m = $(pre + "m"),
    L = ["Trop faible", "Faible", "Moyen", "Solide", "Très solide"],
    col = ["var(--ko)", "var(--ko)", "var(--wn)", "var(--ok)", "var(--ok)"];
  [...m.querySelectorAll("i")].forEach((x, i) => (x.style.background = p && i < Math.max(1, r.sc) ? col[r.sc] : ""));
  m.querySelector("small").textContent = p ? L[r.sc] : "";
  const R_ = $(pre + "r");
  R_.querySelector('[data-k="l"]').className = p.length >= 8 ? "ok" : "";
  R_.querySelector('[data-k="c"]').className = r.c >= 3 ? "ok" : "";
  R_.querySelector('[data-k="b"]').className = p && !r.bad ? "ok" : "";
  const k = $(pre + "k");
  k.textContent = c ? (c === p ? "✓ Les deux mots de passe sont identiques" : "✗ Les deux mots de passe sont différents") : "";
  k.className = "pwk " + (c ? (c === p ? "ok" : "ko") : "");
}
function pwEye(b) {
  const i = b.previousElementSibling;
  i.type = i.type == "password" ? "text" : "password";
  b.classList.toggle("on", i.type == "text");
}
// Renvoie le message d'erreur, ou "" si le nouveau mot de passe est valable.
function pwErr(pre) {
  const p = $(pre + "p").value,
    r = pwScore(p);
  if (!r.ok) return "Mot de passe trop faible : suis les consignes sous le champ.";
  if ($(pre + "c").value !== p) return "Les deux mots de passe ne sont pas identiques.";
  return "";
}
const codeFmt = (i) => {
  const v = i.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  i.value = v.length > 4 ? v.slice(0, 4) + "-" + v.slice(4) : v;
};
// ---------- écran de connexion ----------
function gate() {
  const inp = (id, lab, t, ac, ph, ic, extra) =>
    '<label class="f">' +
    lab +
    '</label><div class="gi">' +
    icn(ic || "user") +
    '<input type="' +
    (t || "text") +
    '" id="' +
    id +
    '"' +
    (ac ? ' autocomplete="' + ac + '"' : "") +
    (ph ? ' placeholder="' + ph + '"' : "") +
    (extra || "") +
    ' autocapitalize="off"></div>';
  let body;
  if (!SY.ready) body = '<div class="gload"><span></span><p>Chargement…</p></div>';
  else if (!SY.user)
    body =
      '<div class="gseg"><button class="' +
      (SY.gt != "up" ? "on" : "") +
      "\" onclick=\"SY.gt='in';render()\">Connexion</button><button class=\"" +
      (SY.gt == "up" ? "on" : "") +
      "\" onclick=\"SY.gt='up';render()\">J’ai un code d’invitation</button></div>" +
      (SY.gt == "up"
        ? '<p class="gsub">Bienvenue ! Crée ton compte avec le code que tu as reçu.</p>' +
          inp("syc", "Code d’invitation", "text", "off", "XXXX-XXXX", "shield", ' oninput="codeFmt(this)" style="text-transform:uppercase;letter-spacing:.12em;font-weight:700"') +
          inp("syn", "Prénom", "text", "given-name", "Ton prénom", "user", ' maxlength="40" autocapitalize="words"') +
          inp("sye", "E-mail", "email", "email", "toi@exemple.fr", "cloud") +
          pwFields("syw") +
          '<button class="big gbtn" onclick="syLogin(1)">Créer mon compte</button><p class="gsw">Déjà un compte ? <button class="lnk" onclick="SY.gt=\'in\';render()">Connecte-toi</button></p>'
        : SY.gt == "fp"
          ? '<p class="gsub">Mot de passe oublié</p><p style="margin:.2em 0 .4em;font-size:14px">Entre l’adresse de ton compte : tu recevras un e-mail avec un lien pour choisir un nouveau mot de passe.</p>' +
            inp("sye", "E-mail", "email", "email", "toi@exemple.fr", "cloud", ' onkeydown="if(event.key===\'Enter\')syForgot()"') +
            '<button class="big gbtn" id="fpb" onclick="syForgot()">Envoyer le lien</button><p class="gsw"><button class="lnk" onclick="SY.gt=\'in\';render()">← Retour à la connexion</button></p>'
        : '<p class="gsub">Content de te revoir.</p>' +
          inp("sye", "E-mail", "email", "email", "toi@exemple.fr", "cloud") +
          '<label class="f">Mot de passe</label><div class="gi">' +
          icn("shield") +
          '<input type="password" id="syp" autocomplete="current-password" onkeydown="if(event.key===\'Enter\')syLogin(0)"><button type="button" class="eye" onclick="pwEye(this)" aria-label="Afficher le mot de passe">' +
          icn("eye") +
          '</button></div><button class="big gbtn" onclick="syLogin(0)">Se connecter</button><button class="lnk" style="display:block;margin:8px auto 0" onclick="SY.gt=\'fp\';render()">Mot de passe oublié ?</button><p class="gsw">Pas encore de compte ? <button class="lnk" onclick="SY.gt=\'up\';render()">Inscris-toi avec ton code d’invitation</button></p>')
  else
    body = SY.roleErr
      ? '<p>Connexion internet nécessaire pour vérifier ton accès.</p><button class="big gbtn" onclick="syCheckMember()">Réessayer</button><button class="lnk" style="display:block;margin:6px auto 0" onclick="syOut()">Se déconnecter</button>'
      : "<p>Connecté avec <b>" +
        esc(SY.user.email || "") +
        "</b>, " +
        (SY.acc && SY.acc.expire_deja
          ? "mais ton accès a expiré le " + fdt(SY.acc.expire) + ". Demande un nouveau code."
          : "mais ce compte n’a pas encore accès à l’app.") +
        "</p>" +
        inp("syc", "Code d’invitation", "text", "off", "XXXX-XXXX", "shield", ' oninput="codeFmt(this)" style="text-transform:uppercase;letter-spacing:.12em;font-weight:700"') +
        '<button class="big gbtn" onclick="syJoin()">Valider le code</button><button class="lnk" style="display:block;margin:6px auto 0" onclick="syOut()">Se déconnecter</button>';
  return (
    '<div class="gwrap"><div class="gbg" aria-hidden="true"><i class="g1"></i><i class="g2"></i><i class="g3"></i><svg class="ecg" viewBox="0 0 1200 200" preserveAspectRatio="none"><path d="M0 120 H380 L410 120 L430 60 L455 175 L480 25 L505 150 L525 120 H760 L785 120 L800 95 L815 120 H1200"/></svg></div><div class="gcol"><div class="glogo">' +
    LOGO +
    '</div><h1 class="gtt">MedRevise</h1><p class="gtag">Ton outil de révision n°1</p><div class="gfeat"><span>Méthode des J</span><span>Flashcards intelligentes</span><span>QCM au barème de Nancy</span></div><div class="gcard">' +
    body +
    '<p id="sym" class="gmsg" role="status"></p></div><p class="gfoot">' +
    icn("shield") +
    " Accès sur invitation · tes données restent privées</p></div></div>"
  );
}
async function syJoin() {
  const c = ($("syc").value || "").trim();
  if (!c) return syMsg("Entre ton code d’invitation.");
  syMsg("Vérification…");
  const { data, error } = await SY.sb.rpc("utiliser_invitation", { p_code: c });
  if (error) return syMsg(syTr(error.message));
  if (!data) return syMsg("Code invalide, expiré ou déjà utilisé. Demande un nouveau code.");
  await syCheckMember();
}
// ---------- panneau administrateur ----------
// Seul l'administrateur (le premier compte créé) peut inviter. Il choisit combien de temps le code reste
// utilisable et combien de temps dure l'accès donné (de 1 heure à 1 an, ou illimité).
const DUR = [
    [1, "1 heure"],
    [6, "6 heures"],
    [24, "24 heures"],
    [72, "3 jours"],
    [168, "7 jours"],
    [720, "30 jours"],
    [2160, "3 mois"],
    [4320, "6 mois"],
    [8760, "1 an"],
  ],
  durLab = (h) =>
    h == null
      ? "illimité"
      : h % 8760 == 0
        ? h / 8760 + " an" + (h > 8760 ? "s" : "")
        : h % 720 == 0
          ? h / 720 + " mois"
          : h % 24 == 0
            ? h / 24 + " jour" + (h > 24 ? "s" : "")
            : h + " heure" + (h > 1 ? "s" : ""),
  fdt = (d) =>
    new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function durPick(id, def, inf) {
  return (
    '<select id="' +
    id +
    '" onchange="$(\'' +
    id +
    "c').hidden=this.value!='c'\">" +
    (inf ? '<option value=""' + (def === "" ? " selected" : "") + ">Illimitée</option>" : "") +
    DUR.map(([h, l]) => '<option value="' + h + '"' + (h === def ? " selected" : "") + ">" + l + "</option>").join("") +
    '<option value="c">Personnalisée…</option></select><div id="' +
    id +
    'c" class="r" hidden style="margin:0;flex-wrap:nowrap"><input type="number" id="' +
    id +
    'n" min="1" value="2" aria-label="Nombre"><select id="' +
    id +
    'u" aria-label="Unité"><option value="1">heures</option><option value="24" selected>jours</option><option value="720">mois</option></select></div>'
  );
}
function durVal(id) {
  const v = $(id).value;
  if (v === "") return null;
  if (v === "c") return Math.min(8784, Math.max(1, Math.round((+$(id + "n").value || 0) * +$(id + "u").value)));
  return +v;
}
// ================= Profil envoyé au serveur =================
async function syProfil() {
  const m = syMeta();
  if (m.noProf && Date.now() - m.noProf < 6 * 3600e3) return; // table pas encore créée (supabase.sql)
  const st = stats(),
    ph = S.photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(S.photo) && S.photo.length < 150000 ? S.photo : null,
    o = {
      user_id: SY.user.id,
      prenom: (S.name || "").slice(0, 60) || null,
      nom: (S.lname || "").slice(0, 60) || null,
      filiere: (S.fil || "").slice(0, 30) || null,
      fac: (S.fac || "").slice(0, 60) || null,
      bio: (S.bio || "").slice(0, 160) || null,
      photo: ph,
      banniere: banOk(S.ban) ? S.ban : null,
      stats: {
        qcm: st.n,
        moy: st.moy === "–" ? null : +st.moy,
        flamme: flame(),
        jours: S.days.length,
        cartes: S.fc || 0,
        nbcartes: S.cards.length,
        nbqcm: S.qcm.length,
        chapitres: S.chap.length,
        commences: Object.keys(S.jm || {}).length,
        erreurs: S.err.length,
        temps: Math.round(Object.values(S.tm || {}).reduce((a, b) => a + b, 0) / 60),
        derniere: Object.keys(S.act || {}).sort().pop() || null,
        gel: !!(S.gel && S.gel.has),
      },
    },
    h = hs(JSON.stringify(o));
  if (m.prof === h) return;
  let { error } = await SY.sb.from("profils").upsert(o);
  // colonne « banniere » pas encore créée (ancien supabase.sql) : on envoie le reste du profil
  if (error && /banniere/i.test(error.message || "")) {
    delete o.banniere;
    ({ error } = await SY.sb.from("profils").upsert(o));
  }
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message || "")) {
      m.noProf = Date.now();
      return;
    }
    throw error;
  }
  m.prof = h;
  delete m.noProf;
  syMetaSave();
}
