const bt = (k, id) =>
  '<button class="b" aria-label="Modifier" onclick="editor(\'' +
  k +
  "','" +
  id +
  "')\">" +
  icn("edit") +
  '</button><button class="b" aria-label="Supprimer" onclick="del(\'' +
  k +
  "','" +
  id +
  "')\">" +
  icn("trash") +
  "</button>";
const tabsAdd = () =>
  '<div class="r" style="margin:0 0 10px">' +
  [
    ["qcm", "QCM"],
    ["card", "Flashcard"],
    ["json", "Import depuis Claude"],
    ["dossier", "Importer un dossier"],
    ["oc", "Schéma à trous"],
    ["cours", "Livret"],
    ["chap", "Chapitre"],
    ["mat", "UE"],
    ["gerer", "" + icn("gear") + " Gérer"],
  ]
    .map(
      (x) =>
        '<button class="b ' +
        (R.add === x[0] ? "p" : "") +
        '" onclick="R={add:\'' +
        x[0] +
        "'};render()\">" +
        x[1] +
        "</button>",
    )
    .join("") +
  "</div>";
// ================= Gérer : trois vues, filtres et pagination =================
// « Mes UE » (structure), « Contenu » (QCM, cartes, livrets filtrés et paginés), « À vérifier » (QCM importés).
// Les filtres ne redessinent que la liste (#glist) pour garder le focus dans la recherche.
const GPP = 20, // éléments par page
  GK = {
    qcm: ["QCM", "check", (x) => x.enonce],
    cards: ["Flashcards", "cards", (x) => x.recto || (x.oc ? "Schéma à trous" : "")],
    courses: ["Livrets", "file", (x) => x.titre],
  };
function gerer() {
  const v = R.gv || "ue",
    un = S.qcm.filter((q) => q.ai).length,
    tb = (k, l) => '<button class="' + (v == k ? "on" : "") + '" onclick="R.gv=\'' + k + "';R.gp=0;render()\">" + l + "</button>";
  return (
    '<div class="seg gseg">' +
    tb("ue", icn("book") + " Mes UE") +
    tb("ct", icn("cards") + " Contenu") +
    tb("av", icn("alert") + " À vérifier" + (un ? ' <span class="gbad">' + un + "</span>" : "")) +
    "</div>" +
    (v == "ue" ? gUE() : gFilters(v == "av") + '<div id="glist">' + gList() + "</div>")
  );
}
// ---------- vue « Mes UE » ----------
function gUE() {
  if (!S.mat.length) return '<p class="m">Aucune UE pour l’instant. Ajoute-en une, ou importe un dossier.</p>';
  const n = (k, chs) => S[k].filter((x) => chs.includes(x.ch)).length;
  return S.mat
    .map((m) => {
      const chs = S.chap.filter((c) => c.mid === m.id).sort((a, b) => natCmp(a.titre, b.titre)),
        ids = chs.map((c) => c.id),
        op = R.gm === m.id;
      return (
        '<div class="c gue' +
        (op ? " op" : "") +
        '"><div class="gueh" onclick="R.gm=R.gm===\'' +
        m.id +
        "'?'':'" +
        m.id +
        '\';render()"><span class="gic" style="--uc:' +
        esc(m.couleur || "var(--ac)") +
        '">' +
        ICO(m) +
        '</span><span style="flex:1;min-width:0"><b>' +
        esc(m.nom) +
        "</b><small>" +
        chs.length +
        " chapitre" +
        (chs.length > 1 ? "s" : "") +
        " · " +
        n("courses", ids) +
        " livrets · " +
        n("qcm", ids) +
        " QCM · " +
        n("cards", ids) +
        ' cartes</small></span><span class="gchev">' +
        icn("chev") +
        "</span></div>" +
        (op
          ? '<div class="r" style="margin:8px 0">' +
            bt("mat", m.id) +
            '<button class="b" onclick="R.gv=\'ct\';R.gfm=\'' +
            m.id +
            "';R.gfc='';R.gp=0;render()\">Voir tout le contenu</button></div>" +
            (chs.length
              ? chs
                  .map(
                    (c) =>
                      '<div class="gch"><span style="flex:1;min-width:0"><b>' +
                      esc(c.titre) +
                      "</b><small>" +
                      n("courses", [c.id]) +
                      " livrets · " +
                      n("qcm", [c.id]) +
                      " QCM · " +
                      n("cards", [c.id]) +
                      " cartes</small></span><button class=\"b\" onclick=\"R.gv='ct';R.gfm='" +
                      m.id +
                      "';R.gfc='" +
                      c.id +
                      "';R.gp=0;render()\">Contenu</button>" +
                      bt("chap", c.id) +
                      "</div>",
                  )
                  .join("")
              : '<p class="m">Aucun chapitre.</p>')
          : "") +
        "</div>"
      );
    })
    .join("");
}
// ---------- filtres (UE, chapitre, type, recherche) ----------
function gFilters(av) {
  const mid = R.gfm || "",
    chs = S.chap.filter((c) => !mid || c.mid === mid).sort((a, b) => natCmp(a.titre, b.titre)),
    k = av ? "qcm" : R.gk || "qcm";
  return (
    '<div class="c gflt"><div class="gfr"><select onchange="R.gfm=this.value;R.gfc=\'\';R.gp=0;render()"><option value="">Toutes les UE</option>' +
    S.mat.map((m) => '<option value="' + m.id + '"' + (m.id === mid ? " selected" : "") + ">" + esc(m.nom) + "</option>").join("") +
    '</select><select onchange="R.gfc=this.value;R.gp=0;gPaint()"><option value="">Tous les chapitres</option>' +
    chs
      .map((c) => '<option value="' + c.id + '"' + (c.id === R.gfc ? " selected" : "") + ">" + esc((mid ? "" : M(c.mid).nom + " · ") + c.titre) + "</option>")
      .join("") +
    "</select></div>" +
    (av
      ? ""
      : '<div class="lcr" style="margin:10px 0 0">' +
        Object.entries(GK)
          .map(([key, d]) => '<button class="' + (k == key ? "on" : "") + '" onclick="R.gk=\'' + key + "';R.gp=0;render()\">" + icn(d[1]) + d[0] + "</button>")
          .join("") +
        "</div>") +
    '<input type="text" inputmode="search" enterkeyhint="search" class="gq" placeholder="Rechercher…" value="' +
    esc(R.gq || "") +
    '" oninput="R.gq=this.value;R.gp=0;clearTimeout(R.gqt);R.gqt=setTimeout(gPaint,200)"></div>'
  );
}
const gPaint = () => {
  const e = $("glist");
  if (e) e.innerHTML = gList();
};
function gItems() {
  const av = R.gv == "av",
    k = av ? "qcm" : R.gk || "qcm",
    q = nrmT(R.gq || ""),
    chs = new Set(S.chap.filter((c) => (!R.gfm || c.mid === R.gfm) && (!R.gfc || c.id === R.gfc)).map((c) => c.id));
  return S[k].filter(
    (x) =>
      chs.has(x.ch) &&
      (!av || x.ai) &&
      (!q || nrmT([GK[k][2](x), x.verso, x.expl, x.texte, (x.props || []).map((p) => p.t).join(" ")].join(" ")).includes(q)),
  );
}
// ---------- liste paginée ----------
function gList() {
  const av = R.gv == "av",
    k = av ? "qcm" : R.gk || "qcm",
    L = gItems(),
    np = Math.max(1, Math.ceil(L.length / GPP)),
    p = Math.min(R.gp || 0, np - 1),
    pg = L.slice(p * GPP, p * GPP + GPP);
  if (!L.length)
    return '<p class="m" style="text-align:center;padding:18px 0">' + (av ? "Rien à vérifier ici ✔" : "Aucun élément ne correspond.") + "</p>";
  const row = (x) =>
    '<div class="gro"><span class="gtx"><b>' +
    esc(String(GK[k][2](x) || "(sans titre)").slice(0, 140)) +
    "</b><small>" +
    esc(M(CH(x.ch).mid).nom + " · " + CH(x.ch).titre) +
    (k == "qcm" && av
      ? " · Vraies : " +
        esc(
          x.props
            .filter((o) => o.ok)
            .map((o) => o.t)
            .join(" · ")
            .slice(0, 160),
        )
      : "") +
    (k == "courses" && x.pdf ? " · PDF" : "") +
    "</small></span>" +
    srcBtn(x) +
    (av ? '<button class="b p" onclick="aiOk(\'' + x.id + "')\">Vérifié</button>" : "") +
    bt(k, x.id) +
    "</div>";
  return (
    '<div class="ghd"><b>' +
    L.length +
    " " +
    (av ? "QCM à vérifier" : k == "qcm" ? "QCM" : GK[k][0].toLowerCase()) +
    "</b>" +
    (av && (R.gfc || R.gfm) ? '<button class="b" onclick="gAllOk()">Tout marquer vérifié</button>' : "") +
    (!av && (R.gfc || R.gq) && k != "courses" ? '<button class="b" onclick="gDelAll()">' + icn("trash") + " Supprimer ces " + L.length + "</button>" : "") +
    "</div>" +
    pg.map(row).join("") +
    (np > 1
      ? '<div class="gpg"><button class="b" ' +
        (p ? "" : "disabled") +
        ' onclick="R.gp=' +
        (p - 1) +
        ';gPaint();scrollTo(0,0)">‹ Précédent</button><span>Page ' +
        (p + 1) +
        " / " +
        np +
        '</span><button class="b" ' +
        (p < np - 1 ? "" : "disabled") +
        ' onclick="R.gp=' +
        (p + 1) +
        ';gPaint();scrollTo(0,0)">Suivant ›</button></div>'
      : "")
  );
}
function gAllOk() {
  const L = gItems();
  ask("Marquer ces " + L.length + " QCM comme vérifiés ?", () => {
    L.forEach((q) => delete q.ai);
    save();
    render();
  }, "Valider");
}
function gDelAll() {
  const k = R.gk || "qcm",
    L = new Set(gItems().map((x) => x.id));
  ask("Supprimer définitivement ces " + L.size + " éléments ?", () => {
    S[k] = S[k].filter((x) => !L.has(x.id));
    S.err = S.err.filter((e) => S.qcm.some((q) => q.id === e));
    save();
    render();
  });
}
function del(k, id) {
  ask(
    k == "mat"
      ? "Supprimer cette UE avec tous ses chapitres et contenus ?"
      : k == "chap"
        ? "Supprimer ce chapitre et son contenu ?"
        : "Supprimer cet élément ?",
    () => {
      const rm = (cs) =>
        ["courses", "cards", "qcm"].forEach((t) => (S[t] = S[t].filter((x) => !cs.includes(x.ch))));
      if (k == "mat") {
        rm(S.chap.filter((c) => c.mid === id).map((c) => c.id));
        S.chap = S.chap.filter((c) => c.mid !== id);
        S.mat = S.mat.filter((m) => m.id !== id);
      } else if (k == "chap") {
        rm([id]);
        S.chap = S.chap.filter((c) => c.id !== id);
      } else {
        if (k == "cards") pdfDel("im:" + id).catch(() => {});
        if (k == "courses") {
          PD = null;
          delete PTX[id];
          pdfDel(id).catch(() => {});
          pdfDel(id + ":t").catch(() => {});
        }
        S[k] = S[k].filter((x) => x.id !== id);
      }
      S.err = S.err.filter((e) => S.qcm.some((q) => q.id === e));
      save();
      render();
    },
    "Supprimer",
  );
}
function editor(k, id) {
  const o = S[k].find((x) => x.id === id),
    F = {
      mat: [
        ["nom", "Nom"],
        ["ic", "Icône", "i"],
        ["prof", "Professeur"],
      ],
      chap: [
        ["titre", "Titre"],
        ["prof", "Professeur"],
        ["info", "Infos"],
        ["mid", "UE", "mat"],
      ],
      courses: [
        ["titre", "Titre"],
        ["texte", "Contenu", "a"],
        ["ch", "Chapitre", "chap"],
      ],
      cards: [
        ["recto", "Recto", "a"],
        ["verso", "Verso", "a"],
        ["ch", "Chapitre", "chap"],
      ],
      qcm: [
        ["enonce", "Énoncé", "a"],
        ["expl", "Explication", "a"],
        ["an", "Annale (source ou année)"],
        ["ch", "Chapitre", "chap"],
      ],
    }[k];
  const fld = ([f, l, t]) =>
    '<label class="f">' +
    l +
    "</label>" +
    (t == "i"
      ? icPick("e_" + f, o.ic || OLDI[o.ico] || guessIc(o.nom))
      : t == "a"
        ? '<textarea id="e_' + f + '">' + esc(o[f]) + "</textarea>"
        : t
          ? '<select id="e_' +
            f +
            '">' +
            (t == "mat"
              ? S.mat
                  .map(
                    (x) =>
                      '<option value="' +
                      x.id +
                      '"' +
                      (x.id === o[f] ? " selected" : "") +
                      ">" +
                      esc(x.nom) +
                      "</option>",
                  )
                  .join("")
              : S.mat
                  .map(
                    (m) =>
                      '<optgroup label="' +
                      esc(m.nom) +
                      '">' +
                      S.chap
                        .filter((x) => x.mid === m.id)
                        .map(
                          (x) =>
                            '<option value="' +
                            x.id +
                            '"' +
                            (x.id === o[f] ? " selected" : "") +
                            ">" +
                            esc(x.titre) +
                            "</option>",
                        )
                        .join("") +
                      "</optgroup>",
                  )
                  .join("")) +
            "</select>"
          : '<input type="text" id="e_' + f + '" value="' + esc(o[f] || "") + '">');
  const pr =
    k == "qcm"
      ? '<label class="f">Propositions (coche les justes)</label><div id="erows">' +
        [...Array(Math.max(4, o.props.length)).keys()].map((i) => prow(i, "e", o.props[i])).join("") +
        '</div><button class="b" onclick="plus(\'e\')">+ Ajouter une proposition</button>'
      : "";
  const sr =
    k == "qcm" || k == "cards"
      ? '<label class="f">Lien vers le cours : livret et page</label><div class="r" style="margin:0;flex-wrap:nowrap"><select id="e_sl"><option value="">Aucun livret lié</option>' +
        S.courses
          .filter((c) => c.ch === o.ch)
          .map(
            (c) =>
              '<option value="' +
              c.id +
              '"' +
              (o.src && o.src.c === c.id ? " selected" : "") +
              ">" +
              esc(c.titre) +
              "</option>",
          )
          .join("") +
        '</select><input type="number" id="e_sp" min="1" placeholder="Page" value="' +
        (o.src ? o.src.p : "") +
        '" style="width:96px"></div>' +
        (k == "qcm" && o.ai
          ? '<label class="f"><input type="checkbox" id="e_ok"> J’ai vérifié cette correction avec mon cours</label>'
          : "")
      : "";
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>Modifier</h3>' +
    F.map(fld).join("") +
    pr +
    sr +
    '<p id="em" class="m" role="status"></p><div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Enregistrer</button></div></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("my").onclick = () => {
    const v = {};
    F.forEach(([f]) => (v[f] = $("e_" + f).value.trim()));
    if (!(v.nom || v.titre || v.recto || v.enonce))
      return ($("em").textContent = "Le champ principal est requis.");
    if (k == "qcm") {
      const p = [...Array(8).keys()]
        .filter((i) => $("ep" + i) && $("ep" + i).value.trim())
        .map((i, n) => ({ l: "ABCDEFGH"[n], t: $("ep" + i).value.trim(), ok: $("ek" + i).checked }));
      if (p.length < 2 || !p.some((x) => x.ok))
        return ($("em").textContent = "2 propositions minimum et au moins une juste.");
      o.props = p;
    }
    if (k == "qcm" || k == "cards") {
      o.src = $("e_sl").value ? { c: $("e_sl").value, p: Math.max(1, +$("e_sp").value || 1) } : null;
      if ($("e_ok") && $("e_ok").checked) delete o.ai;
    }
    Object.assign(o, v);
    save();
    d.remove();
    render();
  };
}
