// ================= Contenu des membres et packs de cours =================
// L'administrateur peut consulter, en lecture seule, les UE, chapitres et livrets d'un membre et sa progression,
// et lui envoyer un « pack » de ses propres cours (UE, chapitres, livrets PDF, QCM, flashcards).
// Le pack n'est ajouté chez le membre que s'il l'accepte depuis son app ; il peut aussi le refuser.
// Côté serveur : fonctions admin_contenu, envoyer_pack, repondre_pack, annuler_pack et table packs (supabase.sql).
const PK = { ct: {}, sent: {}, sel: {}, busy: 0, seen: {}, last: 0, open: 0 },
  pkName = (id) => String(id).replace(/[^a-zA-Z0-9_-]/g, "_"),
  pkSql = (e) =>
    /function|schema cache|relation .*packs|does not exist/i.test((e && e.message) || "")
      ? "Exécute de nouveau le fichier supabase.sql dans Supabase (SQL Editor) pour activer cette fonction."
      : syTr((e && e.message) || String(e)),
  pkN = (n, s, p) => n + " " + (n > 1 ? p || s + "s" : s);

// ---------- administrateur : contenu d'un membre ----------
async function pkLoadContent(uid) {
  PK.ct[uid] = { load: 1 };
  adPaint();
  const r = await SY.sb.rpc("admin_contenu", { p_user: uid });
  PK.ct[uid] = r.error ? { err: pkSql(r.error) } : r.data || {};
  adPaint();
}
function pkContent(uid) {
  const c = PK.ct[uid],
    u = esc(uid);
  let h = '<div class="c"><b>Ses cours</b>';
  if (!c)
    return (
      h +
      '<p class="m" style="margin:.3em 0 .6em">Ses UE, chapitres et livrets, et où il en est dans chacun. Lecture seule : tu ne modifies rien chez lui.</p><button class="b" onclick="pkLoadContent(\'' +
      u +
      "')\">" +
      icn("book") +
      " Voir ses cours</button></div>"
    );
  if (c.load) return h + '<p class="m">Chargement…</p></div>';
  if (c.err) return h + '<p class="wnl">' + esc(c.err) + "</p></div>";
  const mat = c.mat || [],
    chap = c.chap || [],
    n = c.n || {},
    jm = c.jm || {},
    cs = c.cs || {},
    lv = c.livrets || [];
  if (!chap.length) return h + '<p class="m">Aucun cours dans son app pour l’instant.</p></div>';
  const tot = (k) => Object.keys(n).filter((x) => x.startsWith(k + ":")).reduce((a, x) => a + n[x], 0);
  h +=
    '<p class="m" style="margin:.3em 0 .5em">' +
    pkN(mat.length, "UE") +
    " · " +
    pkN(chap.length, "chapitre") +
    " · " +
    pkN(lv.length, "livret") +
    " · " +
    pkN(tot("qcm"), "QCM", "QCM") +
    " · " +
    pkN(tot("cards"), "flashcard") +
    (c.exam ? " · concours le " + new Date(c.exam + "T12:00").toLocaleDateString("fr-FR") : "") +
    "</p>";
  h += mat
    .map((m) => {
      const chs = chap.filter((x) => x.mid === m.id),
        st = chs.filter((x) => jm[x.id]).length;
      return (
        '<details class="pkue" style="--sc:' +
        esc(m.couleur || "var(--ac)") +
        '"><summary><b>' +
        esc(m.nom) +
        "</b><small>" +
        st +
        "/" +
        chs.length +
        " chapitres commencés</small></summary>" +
        chs
          .map((x) => {
            const j = jm[x.id],
              s = cs[x.id],
              nl = lv.filter((l) => l.ch === x.id).length,
              pr = s && s.n >= 5 ? Math.round((s.ok / s.n) * 100) + " % de réussite" : "";
            return (
              '<div class="pkch"><div style="flex:1;min-width:150px"><b>' +
              esc(x.titre) +
              "</b><br><small>" +
              [pkN(nl, "livret"), pkN(n["qcm:" + x.id] || 0, "QCM", "QCM"), pkN(n["cards:" + x.id] || 0, "carte")].join(" · ") +
              "</small></div>" +
              (j ? '<span class="tag">commencé · ' + pkN(j.k || 0, "rappel") + (pr ? " · " + pr : "") + "</span>" : '<span class="tag" style="opacity:.6">pas commencé</span>') +
              "</div>"
            );
          })
          .join("") +
        "</details>"
      );
    })
    .join("");
  return h + '<div class="r" style="margin:8px 0 0"><button class="b sm" onclick="pkLoadContent(\'' + u + "')\">Actualiser</button></div></div>";
}

// ---------- administrateur : envoyer un pack ----------
async function pkLoadSent(uid) {
  const r = await SY.sb.from("packs").select("id,titre,statut,cree,repondu,resume").eq("pour", uid).order("cree", { ascending: false }).limit(20);
  PK.sent[uid] = r.error ? { err: pkSql(r.error) } : { list: r.data || [] };
  adPaint();
}
const pkUeStat = (mid) => {
  const ch = new Set(S.chap.filter((c) => c.mid === mid).map((c) => c.id));
  return {
    ch: ch.size,
    l: S.courses.filter((x) => ch.has(x.ch)).length,
    q: S.qcm.filter((x) => ch.has(x.ch)).length,
    c: S.cards.filter((x) => ch.has(x.ch)).length,
  };
};
function pkSend(uid) {
  const u = esc(uid),
    s = PK.sent[uid];
  if (!s) setTimeout(() => pkLoadSent(uid), 0);
  const sel = PK.sel[uid] || (PK.sel[uid] = {}),
    ues = S.mat.filter((m) => S.chap.some((c) => c.mid === m.id)),
    lab = { attente: ["en attente", "var(--wn)"], accepte: ["accepté ✔", "var(--ok)"], refuse: ["refusé", "var(--ko)"], annule: ["annulé", "var(--mut)"] };
  let h =
    '<div class="c"><b>Lui envoyer des cours</b><p class="m" style="margin:.3em 0 .6em">Choisis tes UE à lui envoyer : livrets PDF, QCM et flashcards compris. Il reçoit une demande dans son app et choisit d’accepter ou de refuser. Rien n’est ajouté sans son accord, et ce qu’il a déjà n’est pas ajouté deux fois.</p>';
  if (!ues.length) h += '<p class="m">Tu n’as pas encore de cours à envoyer.</p>';
  else {
    h +=
      '<div class="pksel">' +
      ues
        .map((m) => {
          const t = pkUeStat(m.id);
          return (
            '<label class="pc" style="--sc:' +
            m.couleur +
            '"><input type="checkbox" ' +
            (sel[m.id] ? "checked " : "") +
            "onchange=\"PK.sel['" +
            u +
            "']['" +
            m.id +
            "']=this.checked;adPaint()\"><span style=\"flex:1\"><b>" +
            esc(m.nom) +
            "</b><br><small>" +
            [pkN(t.ch, "chapitre"), pkN(t.l, "livret"), pkN(t.q, "QCM", "QCM"), pkN(t.c, "flashcard")].join(" · ") +
            "</small></span></label>"
          );
        })
        .join("") +
      "</div>";
    const n = ues.filter((m) => sel[m.id]).length;
    h +=
      '<div class="r" style="margin:8px 0 0"><button class="b p" ' +
      (n && !PK.busy ? "" : "disabled ") +
      "onclick=\"pkSendGo('" +
      u +
      "')\">" +
      icn("upload") +
      (PK.busy ? " Envoi…" : " Envoyer " + (n ? pkN(n, "UE") : "")) +
      '</button></div><p id="pkmsg" class="m" role="status"></p>';
  }
  if (s && s.err) h += '<p class="wnl">' + esc(s.err) + "</p>";
  else if (s && s.list && s.list.length)
    h +=
      '<div class="lb">Déjà envoyés</div>' +
      s.list
        .map((p) => {
          const l = lab[p.statut] || [p.statut, "var(--mut)"];
          return (
            '<div class="pkch"><div style="flex:1;min-width:150px"><b>' +
            esc(p.titre) +
            "</b><br><small>Envoyé le " +
            fdt(p.cree) +
            (p.repondu && p.statut != "attente" ? " · réponse le " + fdt(p.repondu) : "") +
            '</small></div><span class="tag" style="color:' +
            l[1] +
            '">' +
            l[0] +
            "</span>" +
            (p.statut == "attente" ? "<button class=\"b sm\" onclick=\"pkCancel('" + esc(p.id) + "','" + u + "')\">Annuler</button>" : "") +
            "</div>"
          );
        })
        .join("");
  return h + "</div>";
}
// Prépare le contenu du pack à partir des UE choisies (sans tes révisions, surlignages ni notes).
function pkBuild(mids) {
  const chs = S.chap.filter((c) => mids.includes(c.mid)),
    cid = new Set(chs.map((c) => c.id)),
    strip = (x, ks) => {
      const o = { ...x };
      ks.forEach((k) => delete o[k]);
      return o;
    },
    courses = S.courses.filter((x) => cid.has(x.ch)).map((x) => strip(x, ["hl", "nt"])),
    qcm = S.qcm.filter((x) => cid.has(x.ch)).map((x) => strip(x, ["fs", "due"])),
    cards = S.cards.filter((x) => cid.has(x.ch)).map((x) => strip(x, ["fs", "due"])),
    files = courses.filter((x) => x.pdf).map((x) => x.id).concat(cards.filter((x) => x.oc).map((x) => "im:" + x.id));
  return {
    data: {
      v: 1,
      mat: S.mat.filter((m) => mids.includes(m.id)).map((m) => ({ id: m.id, nom: m.nom, couleur: m.couleur })),
      chap: chs.map((c) => ({ id: c.id, mid: c.mid, titre: c.titre, prof: c.prof || "", info: c.info || "" })),
      courses,
      qcm,
      cards,
      files,
    },
    resume: {
      de: (S.name || "L’administrateur").slice(0, 60) + (S.lname ? " " + S.lname.slice(0, 60) : ""),
      ue: S.mat.filter((m) => mids.includes(m.id)).map((m) => m.nom.slice(0, 40)),
      ch: chs.length,
      l: courses.length,
      q: qcm.length,
      c: cards.length,
    },
  };
}
async function pkSendGo(uid) {
  if (PK.busy) return;
  const mids = Object.keys(PK.sel[uid] || {}).filter((k) => PK.sel[uid][k] && S.mat.some((m) => m.id === k));
  if (!mids.length) return;
  const msg = (t) => $("pkmsg") && ($("pkmsg").innerHTML = t);
  PK.busy = 1;
  adPaint();
  try {
    const p = pkBuild(mids);
    // les fichiers du pack doivent d'abord être dans ton compte
    msg("Vérification que tes PDF sont bien envoyés dans ton compte…");
    for (let i = 0; i < 90; i++) {
      const pend = (syMeta().pf || []).filter((x) => p.data.files.includes(x));
      if (!pend.length) break;
      if (!SY.busy) syncNow();
      msg("Envoi de tes PDF dans ton compte (" + pend.length + " restants)…");
      await new Promise((r) => setTimeout(r, 2000));
      if (i == 89) throw new Error("Tes PDF ne sont pas encore tous dans ton compte. Vérifie ta connexion puis réessaie.");
    }
    const titre = p.resume.ue.join(" + ");
    msg("Envoi du pack…");
    const r = await SY.sb.rpc("envoyer_pack", {
      p_user: uid,
      p_titre: titre,
      p_resume: p.resume,
      p_contenu: JSON.stringify(p.data),
      p_fichiers: p.data.files.map(pkName),
    });
    if (r.error) throw r.error;
    PK.sel[uid] = {};
    PK.busy = 0;
    toast("Pack envoyé ✔ Il pourra l’accepter depuis son app.");
    await pkLoadSent(uid);
  } catch (e) {
    PK.busy = 0;
    adPaint();
    msg('<span class="wn">' + esc(pkSql(e)) + "</span>");
  }
}
function pkCancel(id, uid) {
  ask(
    "Annuler ce pack ? Il disparaîtra de son app s’il ne l’a pas encore accepté.",
    async () => {
      const r = await SY.sb.rpc("annuler_pack", { p_id: id });
      if (r.error) return toast(pkSql(r.error));
      toast("Pack annulé");
      pkLoadSent(uid);
    },
    "Annuler le pack",
  );
}

// ---------- membre : packs reçus ----------
// Vérifié après chaque synchronisation (toutes les 5 minutes au plus).
async function pkCheck(force) {
  if (!SY.sb || !SY.user || !SY.role || PK.open || PK.busy) return;
  if (!force && Date.now() - PK.last < 300000) return;
  PK.last = Date.now();
  let r;
  try {
    r = await SY.sb.from("packs").select("id,titre,resume,cree").eq("pour", SY.user.id).eq("statut", "attente").order("cree");
  } catch (e) {
    return;
  }
  if (!r || r.error || !r.data) return;
  const p = r.data.find((x) => !PK.seen[x.id]);
  if (p) pkAsk(p);
}
function pkAsk(p) {
  const s = p.resume || {},
    d = document.createElement("div");
  PK.open = 1;
  d.id = "pkm";
  d.className = "pkm";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true" aria-labelledby="pkt"><div class="pkic">' +
    icn("book") +
    '</div><h3 id="pkt">' +
    esc(s.de || "L’administrateur") +
    " t’envoie des cours</h3><p><b>" +
    esc(p.titre) +
    '</b></p><p class="m" style="margin:.2em 0 .8em">' +
    [pkN(s.ch || 0, "chapitre"), pkN(s.l || 0, "livret PDF", "livrets PDF"), pkN(s.q || 0, "QCM", "QCM"), pkN(s.c || 0, "flashcard")].join(" · ") +
    '</p><p class="m" style="font-weight:500">Si tu acceptes, ils s’ajoutent à ton app. Ce que tu as déjà n’est pas ajouté deux fois, et tes révisions ne sont pas touchées.</p><div id="pkp" role="status"></div><div class="r" id="pkb" style="margin-top:12px"><button class="b p" id="pky">Accepter</button><button class="b" id="pkn">Refuser</button><button class="b" id="pkl" style="background:none">Plus tard</button></div></div>';
  document.body.appendChild(d);
  const close = () => {
    d.remove();
    PK.open = 0;
  };
  $("pkl").onclick = () => {
    PK.seen[p.id] = 1;
    close();
  };
  $("pkn").onclick = () =>
    ask(
      "Refuser ces cours ? Tu ne pourras plus les accepter ensuite, sauf s’ils te sont renvoyés.",
      async () => {
        await SY.sb.rpc("repondre_pack", { p_id: p.id, p_ok: false });
        PK.seen[p.id] = 1;
        close();
        toast("Cours refusés");
        setTimeout(() => pkCheck(1), 500);
      },
      "Refuser",
    );
  $("pky").onclick = async () => {
    $("pkb").style.display = "none";
    try {
      const n = await pkAccept(p, (t) => ($("pkp").innerHTML = '<p class="m">' + t + "</p>"));
      PK.seen[p.id] = 1;
      close();
      toast(n, 1);
      render();
      setTimeout(() => pkCheck(1), 500);
    } catch (e) {
      $("pkp").innerHTML = '<p class="wnl">' + esc(pkSql(e)) + "</p>";
      $("pkb").style.display = "";
    }
  };
}
// Télécharge les fichiers du pack, puis ajoute son contenu sans doublons, puis confirme au serveur.
async function pkAccept(p, prog) {
  prog("Préparation…");
  const r = await SY.sb.from("packs").select("de,contenu").eq("id", p.id).single();
  if (r.error) throw r.error;
  if (!r.data || !r.data.contenu) throw new Error("Ce pack n’est plus disponible.");
  const D = JSON.parse(r.data.contenu),
    de = r.data.de,
    norm = (t) =>
      String(t || "")
        .trim()
        .toLowerCase(),
    mm = {},
    cm = {},
    lm = {};
  // UE : même identifiant ou même nom
  (D.mat || []).forEach((m) => {
    const ex = S.mat.find((x) => x.id === m.id) || S.mat.find((x) => norm(x.nom) === norm(m.nom));
    if (ex) mm[m.id] = ex.id;
    else {
      S.mat.push({ id: m.id, nom: m.nom, couleur: m.couleur || "#38f" });
      mm[m.id] = m.id;
    }
  });
  // chapitres : même identifiant, ou même titre ou même numéro dans l'UE
  (D.chap || []).forEach((c) => {
    const mid = mm[c.mid];
    if (!mid) return;
    let ex = S.chap.find((x) => x.id === c.id) || dFindChap(mid, c.titre);
    if (ex) {
      if (ex.titre !== c.titre && /^chapitre \d+$/i.test(ex.titre)) ex.titre = c.titre;
    } else S.chap.push((ex = { id: c.id, mid, titre: c.titre, prof: c.prof || "", info: c.info || "" }));
    cm[c.id] = ex.id;
  });
  // livrets : même identifiant, ou même titre dans le chapitre
  const newC = [],
    need = [];
  (D.courses || []).forEach((x) => {
    const ch = cm[x.ch];
    if (!ch) return;
    const ex = S.courses.find((y) => y.id === x.id) || S.courses.find((y) => y.ch === ch && norm(y.titre) === norm(x.titre));
    if (ex) return (lm[x.id] = ex.id);
    lm[x.id] = x.id;
    newC.push({ ...x, ch });
    if (x.pdf) need.push(x.id);
  });
  const src = (s) => (s && s.c ? (lm[s.c] ? { ...s, c: lm[s.c] } : null) : s || null),
    newQ = [],
    newK = [];
  (D.qcm || []).forEach((q) => {
    const ch = cm[q.ch];
    if (!ch || S.qcm.some((y) => y.id === q.id || (y.ch === ch && norm(y.enonce) === norm(q.enonce)))) return;
    newQ.push({ ...q, ch, src: src(q.src) });
  });
  (D.cards || []).forEach((c) => {
    const ch = cm[c.ch];
    if (!ch || S.cards.some((y) => y.id === c.id || (!c.oc && y.ch === ch && norm(y.recto) === norm(c.recto)))) return;
    newK.push({ ...c, ch, src: src(c.src) });
    if (c.oc) need.push("im:" + c.id);
  });
  // fichiers : copiés depuis le dossier de l'expéditeur vers cet appareil, puis envoyés dans ton compte
  const st = SY.sb.storage.from("fichiers");
  let fail = 0;
  for (let i = 0; i < need.length; i++) {
    const id = need[i];
    prog("Téléchargement des PDF : " + (i + 1) + " / " + need.length + "…");
    try {
      const { data, error } = await st.download(de + "/" + pkName(id));
      if (error || !data) throw error || new Error("vide");
      await pdfPut(id, /^im:/.test(id) ? await data.text() : await data.arrayBuffer());
    } catch (e) {
      fail++;
      if (!/^im:/.test(id)) {
        const c = newC.find((x) => x.id === id);
        if (c) delete c.pdf;
      }
    }
  }
  S.courses.push(...newC);
  S.qcm.push(...newQ);
  S.cards.push(...newK);
  save();
  const a = await SY.sb.rpc("repondre_pack", { p_id: p.id, p_ok: true });
  if (a.error) console.warn("Réponse au pack :", a.error);
  syncSoon();
  return (
    "Cours ajoutés ✔ " +
    [pkN(newC.length, "livret"), pkN(newQ.length, "QCM", "QCM"), pkN(newK.length, "flashcard")].join(", ") +
    (fail ? " (" + pkN(fail, "fichier") + " n’a pas pu être téléchargé)" : "") +
    "."
  );
}
