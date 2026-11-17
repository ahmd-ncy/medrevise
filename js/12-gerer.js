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
    ["json", "Importer JSON"],
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
function gerer() {
  const it = [
    ["courses", "" + icn("file") + "", "titre"],
    ["cards", "" + icn("cards") + "", "recto"],
    ["qcm", "" + icn("check") + "", "enonce"],
  ];
  const un = S.qcm.filter((q) => q.ai);
  return (
    '<p class="m">Modifier, déplacer (en changeant de chapitre) ou supprimer ton contenu.</p>' +
    (un.length
      ? '<div class="c" style="border-left:6px solid var(--wn)"><b>QCM générés par IA à vérifier (' +
        un.length +
        ')</b><p class="m" style="margin:.3em 0">Compare chaque correction à ton cours, puis valide, corrige ou supprime.</p>' +
        un
          .map(
            (q) =>
              '<div class="hl1"><span style="flex:1;min-width:160px"><b>' +
              esc(q.enonce) +
              "</b><br><small>Vraies : " +
              esc(
                q.props
                  .filter((p) => p.ok)
                  .map((p) => p.t)
                  .join(" · "),
              ) +
              "</small></span>" +
              srcBtn(q) +
              '<button class="b p" onclick="aiOk(\'' +
              q.id +
              "')\">Vérifié</button>" +
              bt("qcm", q.id) +
              "</div>",
          )
          .join("") +
        "</div>"
      : "") +
    S.mat
      .map(
        (m) =>
          '<div class="c"><div class="r" style="margin:0;align-items:center"><b style="flex:1">' +
          ICO(m) +
          " " +
          esc(m.nom) +
          "</b>" +
          bt("mat", m.id) +
          "</div>" +
          S.chap
            .filter((c) => c.mid === m.id)
            .map(
              (c) =>
                '<details style="margin-top:8px"><summary><b>' +
                esc(c.titre) +
                '</b></summary><div class="r" style="margin:4px 0">' +
                bt("chap", c.id) +
                "</div>" +
                it
                  .map(([k, i, f]) =>
                    S[k]
                      .filter((x) => x.ch === c.id)
                      .map(
                        (x) =>
                          '<div class="r" style="align-items:center;margin:4px 0"><span style="flex:1">' +
                          i +
                          " " +
                          esc(String(x[f]).slice(0, 60)) +
                          "</span>" +
                          bt(k, x.id) +
                          "</div>",
                      )
                      .join(""),
                  )
                  .join("") +
                "</details>",
            )
            .join("") +
          "</div>",
      )
      .join("")
  );
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
