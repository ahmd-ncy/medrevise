// ================= Administration (Profil → Administration, administrateur seulement) =================
// Tableau de bord, membres (fiche détaillée et actions), codes d'invitation (création, partage, archivage).
// Tout ce qui vient des membres (noms, bio, photo…) est échappé avant affichage : ce sont des données non fiables.
let AD = { list: null, inv: null, q: "", f: "tous", fi: "actifs", err: "", last: "" };
const adPhoto = (p) => (p && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p) ? p : ""),
  adNum = (x) => (Number.isFinite(+x) ? +x : 0),
  adName = (m) => [m.prenom, m.nom].filter(Boolean).join(" ") || (m.email || "?").split("@")[0],
  adAv = (m, cls) => {
    const p = adPhoto(m.photo);
    return '<span class="adp ' + (cls || "") + '">' + (p ? '<img src="' + p + '" alt="">' : esc(adName(m)[0].toUpperCase())) + "</span>";
  },
  adAgo = (d) => {
    if (!d) return "jamais";
    const s = (Date.now() - new Date(d)) / 1000;
    return s < 3600
      ? "il y a " + Math.max(1, Math.round(s / 60)) + " min"
      : s < 86400
        ? "il y a " + Math.round(s / 3600) + " h"
        : s < 86400 * 30
          ? "il y a " + Math.round(s / 86400) + " j"
          : "le " + new Date(d).toLocaleDateString("fr-FR");
  },
  // dernière présence : la plus récente entre la connexion et le dernier envoi du profil (toutes les ~4 min quand l'app est ouverte)
  adSeen = (m) => {
    const t = Math.max(m.maj ? +new Date(m.maj) : 0, m.derniere_connexion ? +new Date(m.derniere_connexion) : 0);
    return t ? new Date(t) : null;
  },
  adSeenTxt = (m) => {
    const t = adSeen(m);
    return t && Date.now() - t < 6 * 60e3 ? '<b class="onl">● en ligne</b>' : t ? "vu " + adAgo(t) : "jamais vu";
  },
  adSize = (n) => (n > 1e6 ? (n / 1e6).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(n / 1e3)) + " Ko"),
  adSt = (m) => {
    if (m.role == "admin") return ["ad", "Administrateur"];
    if (!m.expire) return ["ok", "Accès illimité"];
    const t = new Date(m.expire) - Date.now();
    return t <= 0 ? ["ko", "Accès terminé"] : t < 7 * 864e5 ? ["wn", "Finit " + adAgo(Date.now() - t).replace("il y a", "dans")] : ["ok", "Jusqu’au " + new Date(m.expire).toLocaleDateString("fr-FR")];
  },
  adActive = (m) => m.role == "admin" || !m.expire || new Date(m.expire) > Date.now(),
  adDays = (m) => {
    const d = m.stats && m.stats.derniere;
    return d ? Math.round((new Date(day() + "T12:00") - new Date(d + "T12:00")) / 864e5) : 999;
  },
  invState = (i) => (i.archive ? "archives" : i.utilise_le ? "utilises" : new Date(i.expire) < Date.now() ? "expires" : "actifs");
// compatibilité avec les anciens appels
const syInvLoad = () => adLoad();
async function adLoad() {
  let r = await SY.sb.rpc("admin_membres");
  AD.err = "";
  if (r.error) {
    if (/function|schema cache/i.test(r.error.message || "")) {
      AD.err = "Pour profiter de toute l’administration, exécute de nouveau le fichier supabase.sql dans Supabase (SQL Editor).";
      r = await SY.sb.rpc("liste_membres");
    }
    if (r.error) AD.err = syTr(r.error.message);
  }
  AD.list = r.data || [];
  const v = await SY.sb.rpc("liste_invitations");
  AD.inv = v.error ? [] : v.data || [];
  if (v.error && !AD.err) AD.err = syTr(v.error.message);
  adPaint();
}
function admin() {
  if (!AD.list) setTimeout(adLoad, 0);
  return '<div id="adm">' + adView() + "</div>";
}
function adPaint() {
  const e = $("adm");
  if (e) e.innerHTML = adView();
  routeSync();
}
function adView() {
  if (!AD.list) return '<p class="m">Chargement…</p>';
  if (R.adm) return adMember(R.adm);
  const v = R.at || "mem";
  return (
    (AD.err ? '<p class="wnl">' + esc(AD.err) + "</p>" : "") +
    adDash() +
    '<div class="seg"><button class="' +
    (v == "mem" ? "on" : "") +
    '" onclick="R.at=\'mem\';adPaint()">Membres (' +
    AD.list.length +
    ')</button><button class="' +
    (v == "inv" ? "on" : "") +
    '" onclick="R.at=\'inv\';adPaint()">Invitations (' +
    (AD.inv || []).filter((i) => invState(i) == "actifs").length +
    " en attente)</button></div>" +
    (v == "inv" ? adInv() : adMembers())
  );
}
// ---------- tableau de bord ----------
function adDash() {
  const L = AD.list,
    act = L.filter(adActive),
    today = L.filter((m) => adDays(m) == 0).length,
    week = L.filter((m) => adDays(m) <= 6).length,
    soon = L.filter((m) => m.expire && new Date(m.expire) > Date.now() && new Date(m.expire) - Date.now() < 7 * 864e5).length,
    pend = (AD.inv || []).filter((i) => invState(i) == "actifs").length,
    k = (ic, n, l, c) => '<div class="psi" style="--sc:' + c + '">' + icn(ic) + "<b>" + n + "</b><small>" + l + "</small></div>";
  return (
    '<div class="pst">' +
    k("people", act.length, "membres actifs", "var(--c1)") +
    k("flame", today, "actifs aujourd’hui", "var(--c5)") +
    k("chart", week, "actifs cette semaine", "var(--c2)") +
    k("clock", soon, "accès finissent sous 7 j", "var(--c3)") +
    k("shield", pend, "codes en attente", "var(--c4)") +
    "</div>" +
    adLead()
  );
}
// ---------- classement (administrateur seulement : les données viennent de admin_membres) ----------
const LCRIT = [
  ["pts", "Score", "star", (t) => adPts(t), (v) => v + " pts"],
  ["flamme", "Flamme", "flame", (t) => adNum(t.flamme), (v) => v + " j"],
  ["qcm", "QCM", "check", (t) => adNum(t.qcm), (v) => v + " QCM"],
  ["moy", "Moyenne", "target", (t) => (adNum(t.qcm) >= 10 && t.moy != null ? adNum(t.moy) : null), (v) => String(v).replace(".", ",") + "/20"],
  ["temps", "Temps", "clock", (t) => adNum(t.temps), (v) => fmtH(v * 60)],
  ["cartes", "Cartes", "cards", (t) => adNum(t.cartes), (v) => v + " cartes"],
];
// Score : régularité d'abord (journées bouclées, flamme), puis volume de travail.
const adPts = (t) =>
  Math.round(adNum(t.jours) * 10 + adNum(t.flamme) * 5 + adNum(t.qcm) + adNum(t.cartes) / 2 + adNum(t.temps) / 5),
  // médaille dessinée : ruban + disque dégradé + numéro
  adMedal = (r) =>
    '<svg class="mdl" viewBox="0 0 40 48" aria-label="' +
    r +
    (r == 1 ? "er" : "e") +
    '"><defs><linearGradient id="mg' +
    r +
    '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' +
    ["#fde68a", "#f1f5f9", "#fed7aa"][r - 1] +
    '"/><stop offset=".55" stop-color="' +
    ["#f59e0b", "#94a3b8", "#c2410c"][r - 1] +
    '"/><stop offset="1" stop-color="' +
    ["#b45309", "#475569", "#7c2d12"][r - 1] +
    '"/></linearGradient></defs><path d="M10 0h8l4 14-6 6zM30 0h-8l-4 14 6 6z" fill="' +
    ["#3b82f6", "#a855f7", "#14b8a6"][r - 1] +
    '"/><circle cx="20" cy="30" r="15" fill="url(#mg' +
    r +
    ')" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/><circle cx="20" cy="30" r="10.5" fill="none" stroke="rgba(255,255,255,.35)"/><text x="20" y="35" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" style="paint-order:stroke" stroke="rgba(0,0,0,.25)" stroke-width="1.2">' +
    r +
    "</text></svg>";
function adLead() {
  const k = AD.lc || "pts",
    C = LCRIT.find((c) => c[0] == k),
    rows = AD.list
      .filter((m) => adActive(m) && m.stats)
      .map((m) => ({ m, v: C[3](m.stats) }))
      .filter((x) => x.v != null)
      .sort((a, b) => b.v - a.v || adNum(b.m.stats.flamme) - adNum(a.m.stats.flamme)),
    mx = Math.max(1, ...rows.map((x) => x.v)),
    open = (m) => ' onclick="adOpen(\'' + esc(m.user_id) + "')\"",
    pod = (x, r) =>
      !x
        ? '<div class="pdm e"></div>'
        : '<button class="pdm r' +
          r +
          '"' +
          open(x.m) +
          ">" +
          (r == 1 ? '<span class="crw">' + icn("crown") + "</span>" : "") +
          '<span class="pda">' +
          adAv(x.m) +
          adMedal(r) +
          "</span><b>" +
          esc(adName(x.m)) +
          "</b><small>" +
          esc(C[4](x.v)) +
          '</small><span class="pdb"><i>' +
          r +
          "</i></span></button>",
    rest = rows.slice(3, AD.la ? 100 : 10);
  if (!rows.length && k == "pts") return "";
  return (
    '<div class="c ldc"><div class="ldh"><span class="ldi">' +
    icn("trophy") +
    '</span><div style="flex:1"><b>Classement</b><br><small class="m">' +
    rows.length +
    " membre" +
    (rows.length > 1 ? "s" : "") +
    " classé" +
    (rows.length > 1 ? "s" : "") +
    (k == "moy" ? " · 10 QCM minimum" : "") +
    '</small></div><span class="lpv">' +
    icn("shield") +
    " Visible par toi seul</span></div>" +
    '<div class="lcr">' +
    LCRIT.map((c) => '<button class="' + (c[0] == k ? "on" : "") + '" onclick="AD.lc=\'' + c[0] + "';adPaint()\">" + icn(c[2]) + c[1] + "</button>").join("") +
    "</div>" +
    (rows.length
      ? '<div class="pod">' +
        pod(rows[1], 2) +
        pod(rows[0], 1) +
        pod(rows[2], 3) +
        "</div>" +
        (rest.length
          ? '<div class="lead">' +
            rest
              .map(
                (x, i) =>
                  '<button class="ldr"' +
                  open(x.m) +
                  '><span class="rk">' +
                  (i + 4) +
                  "</span>" +
                  adAv(x.m, "sm") +
                  '<span class="ldn"><b>' +
                  esc(adName(x.m)) +
                  '</b><span class="ldbar"><i style="width:' +
                  Math.round((x.v / mx) * 100) +
                  '%"></i></span></span><span class="lst">' +
                  esc(C[4](x.v)) +
                  "</span></button>",
              )
              .join("") +
            "</div>"
          : "") +
        (rows.length > 10
          ? '<button class="lnk" style="display:block;margin:8px auto 0" onclick="AD.la=!AD.la;adPaint()">' +
            (AD.la ? "Réduire" : "Voir tout le classement (" + rows.length + ")") +
            "</button>"
          : "") +
        (k == "pts"
          ? '<small class="m" style="display:block;margin-top:10px">Score = 10 pts par journée bouclée, 5 par jour de flamme, 1 par QCM, 1 pour 2 cartes et 1 pour 5 min de travail.</small>'
          : "")
      : '<p class="m">Personne n’a encore assez répondu pour ce classement.</p>') +
    "</div>"
  );
}
const adOpen = (uid) => {
  R.adm = uid;
  adPaint();
  scrollTo(0, 0);
};
// ---------- liste des membres ----------
function adMembers() {
  const L = AD.list,
    n = (f) => L.filter(f).length,
    F = {
      tous: () => true,
      actifs: adActive,
      bientot: (m) => m.expire && new Date(m.expire) > Date.now() && new Date(m.expire) - Date.now() < 7 * 864e5,
      termines: (m) => !adActive(m),
    };
  return (
    '<div class="r" style="margin:0 0 8px"><input type="text" id="adq" placeholder="Rechercher un membre (nom, e-mail, filière)…" value="' +
    esc(AD.q) +
    '" oninput="AD.q=this.value;$(\'adl\').innerHTML=adList()"></div><div class="chips">' +
    [
      ["tous", "Tous"],
      ["actifs", "Actifs"],
      ["bientot", "Finissent bientôt"],
      ["termines", "Accès terminé"],
    ]
      .map((x) => '<button class="chip' + (AD.f == x[0] ? " on" : "") + '" onclick="AD.f=\'' + x[0] + "';adPaint()\">" + x[1] + " (" + n(F[x[0]]) + ")</button>")
      .join("") +
    '</div><div id="adl" class="amg">' +
    adList() +
    "</div>"
  );
}
function adList() {
  const F = {
      tous: () => true,
      actifs: adActive,
      bientot: (m) => m.expire && new Date(m.expire) > Date.now() && new Date(m.expire) - Date.now() < 7 * 864e5,
      termines: (m) => !adActive(m),
    },
    q = AD.q.toLowerCase(),
    l = AD.list.filter(F[AD.f] || F.tous).filter((m) => !q || [m.prenom, m.nom, m.email, m.filiere].join(" ").toLowerCase().includes(q));
  return (
    l
      .map((m) => {
        const st = m.stats || {},
          s = adSt(m);
        return (
          '<button class="amc" onclick="adOpen(\'' +
          esc(m.user_id) +
          '\')"><span class="amb" style="' +
          banCss(m.banniere) +
          '"></span>' +
          adAv(m) +
          "<b>" +
          esc(adName(m)) +
          "</b><small>" +
          esc(m.filiere || m.email || "") +
          '</small><span class="stb ' +
          s[0] +
          '">' +
          s[1] +
          '</span><span class="ams"><span class="amf">' + icn("flame") + ' ' +
          adNum(st.flamme) +
          "</span><span>" +
          adNum(st.qcm) +
          " QCM</span><span>" +
          (st.moy == null ? "–" : String(adNum(st.moy)).replace(".", ",")) +
          "/20</span></span><small>" +
          adSeenTxt(m) +
          "</small></button>"
        );
      })
      .join("") || '<p class="m">Aucun membre trouvé.</p>'
  );
}
// ---------- fiche d'un membre ----------
function adMember(uid) {
  const m = AD.list.find((x) => x.user_id === uid);
  if (!m) {
    R.adm = "";
    return adView();
  }
  const st = m.stats || {},
    s = adSt(m),
    em = m.email || "",
    adm = m.role == "admin",
    tile = (ic, n, l, c) => '<div class="psi" style="--sc:' + c + '">' + icn(ic) + "<b>" + n + "</b><small>" + l + "</small></div>",
    row = (l, v) => '<div class="ln" style="cursor:default;padding-left:0"><span>' + l + "</span><i></i><b>" + v + "</b></div>",
    bar = (l, a, b) =>
      '<div class="lb">' +
      l +
      '</div><div class="r" style="margin:0;align-items:center"><span class="bar" style="flex:1"><i style="width:' +
      (b ? Math.min(100, (a / b) * 100) : 0) +
      '%"></i></span><small>' +
      a +
      " / " +
      b +
      "</small></div>",
    u = esc(uid);
  return (
    '<button class="b" onclick="R.adm=\'\';adPaint()">← Tous les membres</button>' +
    '<div class="pcov" style="margin-top:10px"><div class="pcbg" style="' +
    banCss(m.banniere) +
    '"></div>' +
    adAv(m, "pcav2") +
    '<div class="pcin"><h2>' +
    esc(adName(m)) +
    '</h2><div class="pcch">' +
    [m.filiere, m.fac ? "Fac de " + m.fac : ""]
      .filter(Boolean)
      .map((x) => "<span>" + esc(x) + "</span>")
      .join("") +
    '<span class="stb ' +
    s[0] +
    '">' +
    s[1] +
    "</span>" +
    (st.gel ? '<span class="gelp">❄ gel dispo</span>' : "") +
    "</div>" +
    (m.bio ? '<p class="pcq">« ' + esc(m.bio) + " »</p>" : "") +
    '<p class="m" style="margin:0">' +
    esc(em) +
    "</p></div></div>" +
    '<div class="pst">' +
    tile("flame", adNum(st.flamme), "jours d’affilée", "var(--c5)") +
    tile("check", adNum(st.qcm), "QCM répondus", "var(--c4)") +
    tile("target", st.moy == null ? "–" : String(adNum(st.moy)).replace(".", ","), "moyenne /20", "var(--c1)") +
    tile("cards", adNum(st.cartes), "cartes révisées", "var(--c3)") +
    tile("clock", fmtH(adNum(st.temps) * 60), "de travail", "var(--c2)") +
    "</div>" +
    '<div class="pgrid"><div class="c"><b>Progression</b>' +
    bar("Chapitres commencés", adNum(st.commences), adNum(st.chapitres)) +
    row("Journées bouclées", adNum(st.jours)) +
    row("Erreurs en attente", adNum(st.erreurs)) +
    row("QCM dans son app", adNum(st.nbqcm)) +
    row("Flashcards dans son app", adNum(st.nbcartes)) +
    '</div><div class="c"><b>Informations</b>' +
    row("Membre depuis", m.depuis ? new Date(m.depuis).toLocaleDateString("fr-FR") : "—") +
    row("Dernière présence", adSeenTxt(m)) +
    row("Dernière connexion", adAgo(m.derniere_connexion)) +
    row("Dernière activité", st.derniere ? new Date(st.derniere + "T12:00").toLocaleDateString("fr-FR") : "—") +
    (m.taille_donnees != null ? row("Données stockées", adSize(adNum(m.taille_donnees))) + row("Fichiers (PDF, schémas)", adNum(m.nb_fichiers)) : "") +
    "</div></div>" +
    (adm
      ? ""
      : '<div class="c"><b>Accès</b><p class="m" style="margin:.3em 0 .6em">' +
        s[1] +
        (m.expire ? " (" + fdt(m.expire) + ")" : "") +
        '.</p><div class="r" style="margin:0">' +
        (m.expire && new Date(m.expire) > Date.now()
          ? '<button class="b" onclick="adDo(\'prolonger_acces\',{p_user:\'' + u + "',p_heures:168},'Accès prolongé de 7 jours')\">+7 jours</button><button class=\"b\" onclick=\"adDo('prolonger_acces',{p_user:'" + u + "',p_heures:720},'Accès prolongé de 30 jours')\">+30 jours</button><button class=\"b\" onclick=\"adDo('prolonger_acces',{p_user:'" + u + "',p_heures:8760},'Accès prolongé d’un an')\">+1 an</button>"
          : "") +
        (m.expire ? '<button class="b" onclick="adDo(\'modifier_acces\',{p_user:\'' + u + "',p_heures:null},'Accès rendu illimité')\">Rendre illimité</button>" : "") +
        '<button class="b" onclick="adDur(\'' +
        u +
        "')\">Durée personnalisée…</button>" +
        (adActive(m)
          ? '<button class="b" onclick="adConfirm(\'Suspendre l’accès de ce membre ? Il ne pourra plus utiliser l’app jusqu’à ce que tu le réactives. Ses données sont conservées.\',\'suspendre_membre\',{p_user:\'' + u + "'},'Accès suspendu','Suspendre')\">Suspendre</button>"
          : '<button class="b p" onclick="adDo(\'modifier_acces\',{p_user:\'' + u + "',p_heures:720},'Accès réactivé pour 30 jours')\">Réactiver (30 jours)</button>") +
        '<button class="b ko2" onclick="adConfirm(\'Retirer définitivement l’accès de ce membre ? Il devra recevoir un nouveau code pour revenir. Ses données sont conservées.\',\'retirer_membre\',{p_user:\'' +
        u +
        "'},'Accès retiré','Retirer l’accès')\">Retirer l’accès</button></div></div>") +
    (adm || m.atlas === undefined
      ? ""
      : '<div class="c"><b>Atlas 3D</b><p class="m" style="margin:.3em 0 .6em">' +
        (m.atlas
          ? "Ce membre peut ouvrir l’atlas 3D depuis sa page Cours."
          : "Ce membre ne voit pas l’atlas 3D. Le fichier reste unique et partagé : donner l’accès ne prend aucune place en plus.") +
        '</p><button class="b' +
        (m.atlas ? "" : " p") +
        '" onclick="adDo(\'donner_atlas\',{p_user:\'' +
        u +
        "',p_ok:" +
        !m.atlas +
        "},'" +
        (m.atlas ? "Accès à l’atlas retiré" : "Accès à l’atlas donné") +
        "')\">" +
        (m.atlas ? "Retirer l’accès à l’atlas" : "Donner l’accès à l’atlas") +
        "</button></div>") +
    (adm ? "" : pkContent(uid) + pkSend(uid)) +
    '<div class="c"><b>Contact</b><div class="r"><a class="b" href="mailto:' +
    encodeURIComponent(em).replace(/%40/g, "@") +
    '">' +
    icn("pen") +
    " Écrire un e-mail</a><button class=\"b\" onclick=\"navigator.clipboard.writeText(adMail('" +
    u +
    "')).then(()=>toast('Adresse copiée'))\">Copier l’e-mail</button>" +
    (adm ? "" : '<button class="b" onclick="adReset(\'' + u + '\')">Envoyer un lien de mot de passe</button>') +
    "</div></div>" +
    (adm
      ? ""
      : '<div class="c"><b>Note privée</b><p class="m" style="margin:.2em 0 .4em">Visible par toi seul.</p><textarea id="adn" maxlength="1000" placeholder="Ex. : rencontré au tutorat, accès jusqu’aux partiels…">' +
        esc(m.note || "") +
        '</textarea><div class="r" style="margin:6px 0 0"><button class="b p" onclick="adDo(\'admin_note\',{p_user:\'' +
        u +
        "',p_note:$('adn').value},'Note enregistrée')\">Enregistrer la note</button></div></div>")
  );
}
const adMail = (uid) => ((AD.list || []).find((x) => x.user_id === uid) || {}).email || "";
async function adDo(fn, args, msg) {
  const { error } = await SY.sb.rpc(fn, args);
  if (error) return toast(esc(syTr(error.message)));
  toast(msg + " ✔");
  adLoad();
}
function adConfirm(q, fn, args, msg, ok) {
  ask(q, () => adDo(fn, args, msg), ok);
}
function adDur(uid) {
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>Durée d’accès</h3><p class="m" style="font-weight:500">' +
    esc(adMail(uid) || "Ce membre") +
    " aura accès pendant, à partir de maintenant :</p>" +
    durPick("dmem", 720, 1) +
    '<p id="em" class="m" role="status"></p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Appliquer</button></div></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("my").onclick = async () => {
    const { error } = await SY.sb.rpc("modifier_acces", { p_user: uid, p_heures: durVal("dmem") });
    if (error) return ($("em").textContent = syTr(error.message));
    d.remove();
    toast("Durée d’accès modifiée ✔");
    adLoad();
  };
}
async function adReset(uid) {
  const em = adMail(uid);
  if (!em) return;
  const { error } = await SY.sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + "/" });
  toast(error ? esc(syMailErr(error)) : "Lien de mot de passe envoyé à " + esc(em));
}
// ---------- codes d'invitation ----------
function adInv() {
  const I = AD.inv || [],
    n = (k) => I.filter((i) => invState(i) == k).length,
    l = I.filter((i) => invState(i) == AD.fi);
  return (
    '<div class="c"><b>Créer un code</b> ' +
    helpBtn("inv") +
    '<label class="f">Pour qui ? (facultatif, visible par toi seul)</label><input type="text" id="dlab" maxlength="60" placeholder="Ex. : Léa, tutorat PASS">' +
    '<div class="r" style="margin:0;align-items:flex-end"><div style="flex:1;min-width:150px"><label class="f">Le code doit être utilisé dans les</label>' +
    durPick("dcode", 24) +
    '</div><div style="flex:1;min-width:150px"><label class="f">Durée de l’accès</label>' +
    durPick("dacc", "", 1) +
    '</div></div><button class="big" onclick="adCreate()">Créer le code</button><div id="synew">' +
    (AD.last || "") +
    "</div></div>" +
    '<div class="chips">' +
    [
      ["actifs", "En attente"],
      ["utilises", "Utilisés"],
      ["expires", "Expirés"],
      ["archives", "Archivés"],
    ]
      .map((x) => '<button class="chip' + (AD.fi == x[0] ? " on" : "") + '" onclick="AD.fi=\'' + x[0] + "';adPaint()\">" + x[1] + " (" + n(x[0]) + ")</button>")
      .join("") +
    '</div><div class="c">' +
    (l
      .map((i) => {
        const k = invState(i),
          c = esc(i.code);
        return (
          '<div class="aiv"><div style="flex:1;min-width:170px"><b class="mono">' +
          c +
          "</b>" +
          (i.libelle ? ' <span class="tag">' + esc(i.libelle) + "</span>" : "") +
          "<br><small>Accès " +
          durLab(i.acces_heures ?? null) +
          " · " +
          (k == "utilises" || (k == "archives" && i.utilise_le)
            ? "utilisé par " + esc(i.email || "un compte supprimé") + " le " + fdt(i.utilise_le)
            : new Date(i.expire) < Date.now()
              ? "expiré le " + fdt(i.expire)
              : "à utiliser avant le " + fdt(i.expire)) +
          '</small></div><div class="r" style="margin:0">' +
          (k == "actifs"
            ? '<button class="b sm" onclick="adCopy(\'' + c + "')\">Copier</button><button class=\"b sm\" onclick=\"adShare('" + c + "')\">Partager</button><button class=\"b sm\" onclick=\"adConfirm('Annuler ce code ? Il ne pourra plus être utilisé.','supprimer_invitation',{p_code:'" + c + "'},'Code annulé','Annuler le code')\">Annuler</button>"
            : (k == "archives"
                ? '<button class="b sm" onclick="adDo(\'archiver_invitation\',{p_code:\'' + c + "',p_archive:false},'Code désarchivé')\">Désarchiver</button>"
                : '<button class="b sm" onclick="adDo(\'archiver_invitation\',{p_code:\'' + c + "',p_archive:true},'Code archivé')\">Archiver</button>") +
              "<button class=\"b sm\" onclick=\"adConfirm('Supprimer ce code de la liste ? L’accès du membre qui l’a utilisé n’est pas modifié.','supprimer_invitation',{p_code:'" +
              c +
              "'},'Code supprimé','Supprimer')\">Supprimer</button>") +
          "</div></div>"
        );
      })
      .join("") || '<p class="m" style="margin:0">Aucun code ici.</p>') +
    "</div>"
  );
}
const adMsg = (c) => "Rejoins-moi sur MedRevise, ton outil de révision n°1 ! Ton code d’invitation : " + c + ". Inscris-toi sur https://medrevise.fr (« J’ai un code d’invitation »).";
function adCopy(c) {
  navigator.clipboard.writeText(c).then(() => toast("Code copié")).catch(() => {});
}
async function adShare(c) {
  try {
    if (navigator.share) return await navigator.share({ title: "Invitation MedRevise", text: adMsg(c) });
  } catch (e) {
    if (e && e.name == "AbortError") return;
  }
  navigator.clipboard
    .writeText(adMsg(c))
    .then(() => toast("Message d’invitation copié : colle-le où tu veux"))
    .catch(() => {});
}
async function adCreate() {
  const h = durVal("dcode"),
    acc = durVal("dacc"),
    lab = ($("dlab").value || "").trim(),
    { data, error } = await SY.sb.rpc("creer_invitation", { p_heures: h, p_acces: acc, p_libelle: lab || null });
  if (error) return ($("synew").innerHTML = '<p class="wnl">' + esc(syTr(error.message)) + "</p>");
  const c = esc(data);
  AD.last =
    '<div class="bn good"><b>Nouveau code' +
    (lab ? " pour " + esc(lab) : "") +
    ' : <span class="mono" style="font-size:1.4rem;letter-spacing:.08em">' +
    c +
    "</span></b><p>À utiliser dans les " +
    durLab(h) +
    ", une seule fois. Accès donné : " +
    durLab(acc) +
    '.</p><div class="r" style="margin:0"><button class="b" onclick="adCopy(\'' +
    c +
    "')\">Copier le code</button><button class=\"b p\" onclick=\"adShare('" +
    c +
    "')\">Partager l’invitation</button></div></div>";
  AD.fi = "actifs";
  adLoad();
}
