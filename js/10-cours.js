function list() {
  const lc = S.courses.find((x) => x.id === S.lc);
  return (
    '<h2 class="ti">Cours</h2>' +
    atlasCard() +
    (lc
      ? '<button class="rs" style="--sc:' +
        mof(lc).couleur +
        '" onclick="R={id:\'' +
        lc.id +
        "'};render();scrollTo(0,0)\"><span><small>Reprendre la lecture</small><br><b>" +
        esc(lc.titre) +
        "</b></span></button>"
      : "") +
    '<input type="text" placeholder="Rechercher dans les titres, les textes et les PDF…" aria-label="Rechercher" value="' +
    esc(R.sq || "") +
    '" oninput="R.sq=this.value;$(\'lst\').innerHTML=lst();pdfSearchSoon()"><div id="lst">' +
    lst() +
    '</div><div id="pdfhits"></div>'
  );
}
const OP = {};
function lst() {
  const q = (R.sq || "").toLowerCase(),
    mt = (x) => !q || x.titre.toLowerCase().includes(q) || x.texte.toLowerCase().includes(q);
  return (
    S.mat
      .map((m, i) => {
        const cc = S.chap.filter((c) => c.mid === m.id);
        let nl = 0;
        const chs = cc
          .map((c, j) => {
            const cs = S.courses.filter((x) => x.ch === c.id && mt(x));
            nl += cs.length;
            return cs.length || !q
              ? '<div class="ch"><div class="chh"><span class="no">' +
                  String(j + 1).padStart(2, "0") +
                  '</span><div style="flex:1"><b>' +
                  esc(c.titre) +
                  "</b><small>" +
                  esc([c.prof, c.info].filter(Boolean).join(" · ")) +
                  "</small></div>" +
                  jBadge(c.id) +
                  '<button class="b" style="padding:4px 9px" onclick="openSyn(\'' +
                  c.id +
                  "')\">Fiche</button></div>" +
                  (cs
                    .map(
                      (x) =>
                        '<button class="ln" style="--sc:' +
                        m.couleur +
                        '" onclick="R={id:\'' +
                        x.id +
                        "'};render();scrollTo(0,0)\"><span>" +
                        esc(x.titre) +
                        "</span><i></i><small>" +
                        (x.pdf && !x.texte
                          ? "PDF"
                          : Math.max(1, Math.round(x.texte.split(/\s+/).length / 200)) + " min") +
                        "</small></button>",
                    )
                    .join("") ||
                    '<small style="display:block;padding-left:36px">Aucun livret dans ce chapitre.</small>') +
                  "</div>"
              : "";
          })
          .join("");
        return chs || !q
          ? '<details class="ue" style="--sc:' +
              m.couleur +
              '" ' +
              (q || OP[m.id] ? "open " : "") +
              "ontoggle=\"OP['" +
              m.id +
              '\']=this.open"><summary class="uh"><span class="pm"></span><span style="flex:1"><span class="un">UE ' +
              (i + 1) +
              "</span><h3>" +
              ICO(m) +
              " " +
              esc(m.nom) +
              "</h3><small>" +
              esc(m.prof || "") +
              "</small></span><small>" +
              cc.length +
              " chap. · " +
              nl +
              " livret" +
              (nl > 1 ? "s" : "") +
              "</small></summary>" +
              (chs ||
                '<small style="display:block;padding-bottom:12px">Aucun chapitre dans cette UE.</small>') +
              "</details>"
          : "";
      })
      .join("") ||
    ill(
      q ? "search" : "book",
      q ? "Aucun résultat dans les titres et les textes." : "Aucune UE pour l’instant : va dans « Ajouter ».",
    )
  );
}
function md(t) {
  let n = 0;
  return esc(t)
    .split("\n")
    .map((l) =>
      /^\|[\s|:-]+\|$/.test(l)
        ? ""
        : l.startsWith("|")
          ? "<tr>" +
            l
              .split("|")
              .slice(1, -1)
              .map((c, i) => "<t" + (i ? "d" : "h") + ">" + c.trim() + "</t" + (i ? "d" : "h") + ">")
              .join("") +
            "</tr>"
          : l.startsWith("&gt; ")
            ? "<blockquote>" + l.slice(5) + "</blockquote>"
            : l.startsWith("## ")
              ? "<h4>" + l.slice(3) + "</h4>"
              : l.startsWith("# ")
                ? '<h3 class="h3" id="s' + n++ + '">' + l.slice(2) + "</h3>"
                : l.startsWith("- ")
                  ? "<li>" + l.slice(2) + "</li>"
                  : l.trim()
                    ? "<p>" + l + "</p>"
                    : "",
    )
    .join("")
    .replace(/\*\*(.+?)\*\*/g, '<b class="hl">$1</b>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/(<li>.*?<\/li>)+/g, (m) => "<ul>" + m + "</ul>")
    .replace(/(<tr>.*?<\/tr>)+/g, (m) => '<div class="tw"><table>' + m + "</table></div>");
}
const fz = (d) => {
  S.fz = Math.min(26, Math.max(15, (S.fz || 18) + d * 2));
  save();
  render();
};
onscroll = () => {
  const e = $("pg");
  if (e) {
    const h = document.documentElement;
    e.style.width = Math.min(100, (scrollY / Math.max(1, h.scrollHeight - innerHeight)) * 100) + "%";
  }
};
function course() {
  const c = S.courses.find((x) => x.id === R.id);
  if (!c) {
    R = {};
    return list();
  }
  const m = mof(c),
    ch = CH(c.ch),
    hs = c.texte
      .split("\n")
      .filter((l) => l.startsWith("# "))
      .map((l) => l.slice(2));
  S.lc = c.id;
  bump("read", 1);
  jStart(c.ch);
  save();
  return (
    '<div class="prog"><i id="pg"></i></div><button class="b" onclick="R={};render();scrollTo(0,0)">← Tous les cours</button><article class="art" style="--sc:' +
    m.couleur +
    '"><span class="un">' +
    esc(m.nom) +
    " · " +
    esc(ch.titre) +
    '</span><h1 class="at">' +
    esc(c.titre) +
    '</h1><div class="meta">' +
    (ch.prof ? "<span>" + esc(ch.prof) + "</span>" : "") +
    (c.texte
      ? "<span>~" + Math.max(1, Math.round(c.texte.split(/\s+/).length / 200)) + " min de lecture</span>"
      : "<span>PDF : " + esc(c.pdf ? c.pdf.name : "") + "</span>") +
    '<span class="fsz"><button class="b" onclick="foTog()" aria-label="Mode concentration">' +
    icn("focus") +
    '</button><button class="b" onclick="fz(-1)" aria-label="Réduire le texte">A−</button><button class="b" onclick="fz(1)" aria-label="Agrandir le texte">A+</button></span></div>' +
    '<div class="r" style="margin:0 0 12px"><button class="b aib" onpointerdown="SEL=String(getSelection())" onclick="aiSel(\'' +
    c.id +
    '\')">Expliquer avec l’IA</button><button class="b aib" onpointerdown="SEL=String(getSelection())" onclick="aiCards(\'' +
    c.id +
    '\')">Générer des flashcards</button><button class="b aib" onpointerdown="SEL=String(getSelection())" onclick="aiGen(\'' +
    c.id +
    "','qcm')\">Générer des QCM</button></div>" +
    (hs.length > 1
      ? '<div class="toc"><b>Sommaire</b>' +
        hs
          .map(
            (h, i) =>
              "<button onclick=\"document.getElementById('s" +
              i +
              "').scrollIntoView({behavior:'smooth'})\">" +
              (i + 1) +
              ". " +
              h.replace(/[<>&]/g, "") +
              "</button>",
          )
          .join("") +
        "</div>"
      : "") +
    '<div class="split"><div>' +
    (c.pdf ? '<div id="pdfv" class="pdfv"><p class="m">Chargement du PDF…</p></div>' : "") +
    (c.texte ? '<div class="rd" style="font-size:' + (S.fz || 18) + 'px">' + md(c.texte) + "</div>" : "") +
    (c.imgs || []).map(im).join("") +
    '</div><aside class="side"><div class="lb" style="margin-top:0">Mes notes sur ce livret</div><textarea aria-label="Mes notes sur ce livret" placeholder="Écris tes notes ici. Elles sont enregistrées automatiquement et reprises dans la fiche de synthèse." oninput="CNT(this.value)">' +
    esc(c.nt || "") +
    '</textarea><div id="hll"></div>' +
    ((k) =>
      k.length
        ? '<details style="margin-top:10px"><summary><b>Cartes du chapitre (' +
          k.length +
          ")</b></summary>" +
          k
            .map(
              (x) =>
                '<div class="hl1"><span style="flex:1"><b>' +
                esc(x.recto) +
                "</b><br><small>" +
                esc(x.verso) +
                "</small></span></div>",
            )
            .join("") +
          "</details>"
        : "")(S.cards.filter((x) => x.ch === c.ch)) +
    '<div class="r"><button class="b" onclick="openSyn(\'' +
    c.ch +
    "')\">Fiche de synthèse du chapitre</button></div></aside></div>" +
    '<div class="end"><b>S’entraîner sur ce chapitre</b><div class="r"><button class="b p" onclick="qs(\'c:' +
    c.ch +
    "')\">QCM</button><button class=\"b\" onclick=\"go('cards');R.f='c:" +
    c.ch +
    '\';render()">Flashcards</button><button class="b" onpointerdown="SEL=String(getSelection())" onclick="mkCard(\'' +
    c.ch +
    '\')">+ Créer une flashcard</button><button class="b" onpointerdown="SEL=String(getSelection())" onclick="mkCloze(\'' +
    c.ch +
    '\')">+ Carte à trous</button></div>' +
    (c.pdf
      ? '<div class="pdfc"><span class="dri">' +
        icn("file") +
        '</span><span class="drt"><b>' +
        esc(c.pdf.name || "PDF du livret") +
        "</b><small>PDF" +
        (c.pdf.size ? " · " + fsz(c.pdf.size) : "") +
        '</small></span><span class="pdfa"><label class="b">Remplacer<input type="file" accept="application/pdf,.pdf" hidden onchange="addPdf(this,\'' +
        c.id +
        '\')"></label><button class="b" onclick="rmPdf(\'' +
        c.id +
        "')\">Retirer</button></span></div>"
      : fDrop({ accept: "application/pdf,.pdf", icon: "file", t: "Ajouter le PDF du livret", s: "Il s’affichera ici, page par page", on: "addPdf(this,\'" + c.id + "\')" })) +
    '<div class="r"><label class="b" style="cursor:pointer">' +
    icn("image") +
    ' Ajouter un schéma<input type="file" accept="image/*" hidden onchange="shrink(this,u=>{(S.courses.find(x=>x.id===\'' +
    c.id +
    '\').imgs||[]).push(u);save();render()})"></label>' +
    "<button class=\"b\" onclick=\"editor('courses','" +
    c.id +
    "')\">Modifier</button><button class=\"b\" onclick=\"del('courses','" +
    c.id +
    "')\">Supprimer</button></div></div></article>"
  );
}
function shrink(inp, cb, mx) {
  const f = inp.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    const i = new Image();
    i.onload = () => {
      const s = Math.min(1, (mx || 900) / i.width),
        cv = document.createElement("canvas");
      cv.width = i.width * s;
      cv.height = i.height * s;
      cv.getContext("2d").drawImage(i, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL("image/jpeg", mx ? 0.9 : 0.75));
    };
    i.src = fr.result;
  };
  fr.readAsDataURL(f);
}
