let AI = null,
  AIC = null;
if (window.claude && claude.use)
  claude
    .use("sample")
    .then((f) => {
      if (f) {
        AI = f;
        document.body.classList.add("ai");
      }
    })
    .catch(() => {});
const AIE = {
    not_granted: "Tu n’as pas autorisé l’IA pour cette page.",
    rate_limited: "Limite d’utilisation atteinte : réessaie plus tard.",
    session_expired: "Reconnecte-toi à Claude puis réessaie.",
    refused: "La demande a été refusée.",
    sampling_disabled: "L’IA n’est pas disponible sur ce compte.",
  },
  aiErr = (e) => AIE[e && e.code] || "L’IA n’a pas pu répondre. Réessaie dans un instant.";
const RULES =
  "Tu aides un étudiant en première année de médecine (PASS, France). Réponds en français, en texte simple sans Markdown, en moins de 200 mots. Appuie-toi d’abord sur l’extrait de cours fourni ; si tu ajoutes une information qui n’y figure pas, signale-le par « (hors cours) ». Si tu n’es pas sûr, dis-le.";
async function pdfPages(id) {
  if (PTX[id]) return PTX[id];
  let a = await pdfGet(id + ":t").catch(() => null);
  if (!a) {
    const buf = await pdfGet(id);
    if (buf) await pdfLib().catch(() => {});
    if (!buf || !window.pdfjsLib) return [];
    pdfjsLib.GlobalWorkerOptions.workerSrc = WK;
    const doc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
    a = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      a.push(tc.items.map((x) => x.str).join(" "));
    }
    pdfPut(id + ":t", a).catch(() => {});
  }
  return (PTX[id] = a);
}
async function pdfText(id, a, b) {
  const pg = await pdfPages(id);
  return pg.slice(Math.max(1, a) - 1, b).join("\n");
}
const nrm = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
let ST = 0,
  SQ = 0;
function pdfSearchSoon() {
  clearTimeout(ST);
  ST = setTimeout(pdfSearch, 350);
}
async function pdfSearch() {
  const box = $("pdfhits");
  if (!box) return;
  const q = nrm((R.sq || "").trim()),
    my = ++SQ,
    cs = S.courses.filter((c) => c.pdf);
  if (q.length < 3 || !cs.length) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = '<p class="m">Recherche dans les PDF…</p>';
  let out = "",
    nb = 0;
  for (const c of cs) {
    let pg = [];
    try {
      pg = await pdfPages(c.id);
    } catch (e) {}
    if (my !== SQ || !$("pdfhits")) return;
    pg.forEach((t, i) => {
      const k = nrm(t).indexOf(q);
      if (k < 0 || nb >= 30) return;
      nb++;
      out +=
        '<button class="rs" style="--sc:' +
        mof(c).couleur +
        '" onclick="openAt(\'' +
        c.id +
        "'," +
        (i + 1) +
        ')"><span><small>' +
        esc(c.titre) +
        " · page " +
        (i + 1) +
        "</small><br>…" +
        esc(t.slice(Math.max(0, k - 50), k + q.length + 70)) +
        "…</span></button>";
    });
  }
  $("pdfhits").innerHTML = out
    ? '<div class="lb" style="margin-bottom:8px">Dans les PDF (' + nb + ")</div>" + out
    : '<p class="m">Aucun résultat dans les PDF.</p>';
}
function openAt(id, p) {
  S.pp = S.pp || {};
  S.pp[id] = p;
  save();
  if (tab !== "cours") go("cours");
  R = { id };
  render();
  scrollTo(0, 0);
}
// ---- surlignages ----
let HG = null;
function hlGrab() {
  HG = null;
  const sel = getSelection(),
    w = $("pgw");
  if (!w || !sel.rangeCount || !String(sel).trim() || !w.contains(sel.anchorNode)) return;
  const b = w.getBoundingClientRect();
  HG = {
    t: String(sel).replace(/\s+/g, " ").trim().slice(0, 400),
    r: [...sel.getRangeAt(0).getClientRects()]
      .filter((r) => r.width > 2 && r.height > 2)
      .slice(0, 80)
      .map((r) =>
        [(r.left - b.left) / b.width, (r.top - b.top) / b.height, r.width / b.width, r.height / b.height].map(
          (v) => +v.toFixed(4),
        ),
      ),
  };
}
function hlAdd() {
  const c = S.courses.find((x) => x.id === R.id);
  if (!c) return;
  if (!HG || !HG.r.length) {
    ask(
      "Sélectionne d’abord un passage dans la page du PDF, puis clique sur « Surligner la sélection ».",
      () => {},
      "OK",
    );
    return;
  }
  c.hl = c.hl || [];
  c.hl.push({ id: uid(), p: (S.pp || {})[c.id] || 1, t: HG.t, r: HG.r, n: "" });
  HG = null;
  save();
  getSelection().removeAllRanges();
  hlDraw();
}
function hlDraw() {
  const c = S.courses.find((x) => x.id === R.id);
  if (!c || !$("phl")) return;
  const p = (S.pp || {})[c.id] || 1,
    L = c.hl || [];
  $("phl").innerHTML = L.filter((h) => h.p === p)
    .map((h) =>
      h.r
        .map(
          (r) =>
            '<i style="left:' +
            r[0] * 100 +
            "%;top:" +
            r[1] * 100 +
            "%;width:" +
            r[2] * 100 +
            "%;height:" +
            r[3] * 100 +
            '%"></i>',
        )
        .join(""),
    )
    .join("");
  $("hll").innerHTML = L.length
    ? '<div class="lb">Surlignages de ce livret (' +
      L.length +
      ")</div>" +
      L.slice()
        .sort((a, b) => a.p - b.p)
        .map(
          (h) =>
            '<div class="hl1"><button class="b" onclick="pdfGo(' +
            h.p +
            ')">p. ' +
            h.p +
            '</button><span style="flex:1;min-width:140px"><mark>' +
            esc(h.t) +
            "</mark>" +
            (h.n ? "<br><small>" + esc(h.n) + "</small>" : "") +
            '</span><button class="b" onclick="hlNote(\'' +
            h.id +
            '\')">Note</button><button class="b" aria-label="Supprimer le surlignage" onclick="hlDel(\'' +
            h.id +
            "')\">" +
            icn("trash") +
            "</button></div>",
        )
        .join("")
    : "";
}
function hlNote(id) {
  const c = S.courses.find((x) => x.id === R.id),
    h = c.hl.find((x) => x.id === id);
  askForm(
    "Note",
    '<label class="f">Ta note sur ce passage</label><input type="text" value="' + esc(h.n || "") + '">',
    (v) => {
      h.n = v[0];
      save();
      hlDraw();
    },
  );
}
function hlDel(id) {
  const c = S.courses.find((x) => x.id === R.id);
  c.hl = c.hl.filter((x) => x.id !== id);
  save();
  hlDraw();
}
function hlAll() {
  const cs = S.courses.filter((c) => (c.hl || []).length);
  return cs.length
    ? "<h3>Mes surlignages</h3>" +
        cs
          .map(
            (c) =>
              '<div class="c" style="border-left:6px solid ' +
              mof(c).couleur +
              '"><b>' +
              esc(c.titre) +
              "</b>" +
              c.hl
                .slice()
                .sort((a, b) => a.p - b.p)
                .map(
                  (h) =>
                    '<div class="hl1"><button class="b" onclick="openAt(\'' +
                    c.id +
                    "'," +
                    h.p +
                    ')">p. ' +
                    h.p +
                    '</button><span style="flex:1"><mark>' +
                    esc(h.t) +
                    "</mark>" +
                    (h.n ? "<br><small>" + esc(h.n) + "</small>" : "") +
                    "</span></div>",
                )
                .join("") +
              "</div>",
          )
          .join("")
    : "";
}
// ---- lien question -> page du cours ----
const slOpts = (ch) =>
  '<option value="">Aucun livret lié</option>' +
  S.courses
    .filter((c) => c.ch === ch)
    .map((c) => '<option value="' + c.id + '">' + esc(c.titre) + "</option>")
    .join("");
function fillSl() {
  const e = $("sl");
  if (e) e.innerHTML = slOpts($("ch").value);
}
const srcf = () =>
  '<label class="f">Lien vers le cours : livret et page (facultatif)</label><div class="r" style="margin:0;flex-wrap:nowrap"><select id="sl">' +
  slOpts((S.chap.find((c) => c.id === AC && c.mid === AU) || S.chap.find((c) => c.mid === AU) || {}).id) +
  '</select><input type="number" id="sp" min="1" placeholder="Page" style="width:96px"></div>';
const srcv = () =>
  $("sl") && $("sl").value ? { c: $("sl").value, p: Math.max(1, +$("sp").value || 1) } : null;
const srcBtn = (x) =>
  x.src && S.courses.some((c) => c.id === x.src.c)
    ? '<button class="b" onclick=\'peek(' +
      JSON.stringify(x.src) +
      ")'>" +
      icn("book") +
      " Voir dans le cours" +
      (S.courses.find((c) => c.id === x.src.c).pdf ? " (p. " + x.src.p + ")" : "") +
      "</button>"
    : "";
async function peek(src) {
  const c = S.courses.find((x) => x.id === src.c);
  if (!c) return;
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" style="max-width:720px" role="dialog" aria-modal="true"><h3>' +
    esc(c.titre) +
    (c.pdf ? " · page " + src.p : "") +
    '</h3><div id="pk">' +
    (c.pdf
      ? '<p class="m">Chargement…</p>'
      : '<div class="rd" style="font-size:16px">' + md(c.texte) + "</div>") +
    '</div><button class="big" id="mn">Fermer</button></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  if (!c.pdf) return;
  try {
    const buf = await pdfGet(c.id);
    if (buf) await pdfLib().catch(() => {});
    if (!buf || !window.pdfjsLib) throw 0;
    pdfjsLib.GlobalWorkerOptions.workerSrc = WK;
    const doc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise,
      pg = await doc.getPage(Math.min(doc.numPages, src.p)),
      bx = $("pk");
    if (!bx) return;
    const k =
        ((bx.clientWidth || 320) / pg.getViewport({ scale: 1 }).width) *
        Math.min(2, window.devicePixelRatio || 1),
      vp = pg.getViewport({ scale: k }),
      cv = document.createElement("canvas");
    cv.width = vp.width;
    cv.height = vp.height;
    cv.style.cssText = "width:100%;display:block;border:1px solid var(--bd)";
    await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
    if ($("pk")) {
      bx.innerHTML = "";
      bx.appendChild(cv);
    }
  } catch (e) {
    if ($("pk")) $("pk").innerHTML = '<p class="m">PDF indisponible sur cet appareil.</p>';
  }
}
const aiTag = (q) =>
  q.ai
    ? '<span class="tag" style="background:var(--wnb);color:var(--wn)">Généré par IA · non vérifié</span><button class="b" onclick="aiOk(\'' +
      q.id +
      "')\">Marquer comme vérifié</button>"
    : "";
function aiOk(id) {
  const o = S.qcm.find((x) => x.id === id);
  if (o) delete o.ai;
  if (R.q && R.q[R.i]) delete R.q[R.i].ai;
  save();
  render();
}
async function ctxOf(ch) {
  const c = S.courses.find((x) => x.ch === ch && x.texte) || S.courses.find((x) => x.ch === ch && x.pdf);
  if (!c) return "";
  if (c.texte) return c.texte.slice(0, 12000);
  try {
    return (await pdfText(c.id, 1, 8)).slice(0, 12000);
  } catch (e) {
    return "";
  }
}
function aiBox(title) {
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>' +
    esc(title) +
    '</h3><div id="aio" class="t" style="font-weight:500" aria-live="polite">Réflexion…</div><small style="display:block;margin-top:10px">Réponse générée par une IA : elle peut se tromper. Ton cours fait foi.</small><button class="big" id="mn">Fermer</button></div>';
  document.body.appendChild(d);
  const c = (AIC = new AbortController());
  $("mn").onclick = () => {
    c.abort();
    d.remove();
  };
  return c;
}
function askForm(title, html, ok) {
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb" role="dialog" aria-modal="true"><h3>' +
    title +
    "</h3>" +
    html +
    '<div class="r2"><button class="big" style="background:var(--mut)" id="mn">Annuler</button><button class="big" id="my">Continuer</button></div></div>';
  document.body.appendChild(d);
  $("mn").onclick = () => d.remove();
  $("my").onclick = () => {
    const v = [...d.querySelectorAll("input")].map((i) => i.value.trim());
    d.remove();
    ok(v);
  };
}
async function aiAsk(title, build) {
  if (!AI) return;
  const c = aiBox(title);
  try {
    const p = await build();
    await AI(RULES + "\n\n" + p, {
      signal: c.signal,
      onText: ({ text }) => {
        const o = $("aio");
        if (o) o.textContent = text;
      },
    });
  } catch (e) {
    const o = $("aio");
    if (o && (!e || e.code !== "cancelled")) o.textContent = (e && e.text ? e.text + "\n\n" : "") + aiErr(e);
  }
}
function aiQcm() {
  const q = R.q[R.i],
    sel = R.sel.slice();
  aiAsk(
    "Explication",
    async () =>
      "Question de QCM : " +
      q.enonce +
      "\nPropositions :\n" +
      q.props
        .map(
          (p, j) =>
            p.l +
            ". " +
            p.t +
            " — " +
            (p.ok === null ? "correction inconnue" : p.ok ? "VRAIE" : "FAUSSE") +
            (sel.includes(j) ? " (cochée par l’étudiant)" : ""),
        )
        .join("\n") +
      (q.expl ? "\nCorrection officielle : " + q.expl : "") +
      "\n\nExplique proposition par proposition pourquoi elle est vraie ou fausse, sans contredire la correction officielle, puis donne un moyen de retenir.\n\nExtrait du cours :\n" +
      ((await ctxOf(q.ch)) || "(aucun cours disponible pour ce chapitre)"),
  );
}
function aiSel(id) {
  if (!AI) return;
  const c = S.courses.find((x) => x.id === id),
    sel = (SEL || "").trim().slice(0, 1500),
    go2 = (t) =>
      aiAsk(
        "Explication",
        async () =>
          "Explique simplement ce passage ou ce terme à l’étudiant : « " +
          t +
          " »\nDonne une définition claire, un exemple ou une analogie, et le lien avec le reste du cours.\n\nExtrait du cours :\n" +
          ((await ctxOf(c.ch)) || "(aucun cours disponible)"),
      );
  if (sel) return go2(sel);
  askForm(
    "Que veux-tu comprendre ?",
    '<label class="f">Terme ou notion</label><input type="text"><small>Astuce : dans un cours en texte, sélectionne un passage avant de cliquer.</small>',
    (v) => v[0] && go2(v[0]),
  );
}
function aiGen(id, kind) {
  if (!AI) return;
  const c = S.courses.find((x) => x.id === id),
    sel = (SEL || "").trim(),
    Q = kind === "qcm";
  let pg0 = (S.pp || {})[id] || 1;
  const run = async (src) => {
    const k = aiBox(Q ? "QCM proposés" : "Flashcards proposées");
    try {
      const text = await src();
      if (!text.trim()) throw { nt: 1 };
      const a = await AI.json(
          "Tu aides un étudiant en première année de médecine. À partir du texte de cours ci-dessous UNIQUEMENT, sans rien ajouter d’extérieur, " +
            (Q
              ? 'propose 4 à 6 QCM en français, de type concours : un énoncé clair, 4 ou 5 propositions qui sont des phrases complètes, entre 1 et 3 propositions vraies, et une explication courte tirée du texte. Réponds uniquement avec un tableau JSON d’objets {"enonce": string, "propositions": [{"texte": string, "correcte": boolean}], "explication": string}.'
              : 'propose 6 à 10 flashcards en français : une seule idée par carte, question précise, réponse courte. Réponds uniquement avec un tableau JSON d’objets {"recto": string, "verso": string}.') +
            "\n\nTexte :\n" +
            text.slice(0, 12000),
          { signal: k.signal },
        ),
        L = (Array.isArray(a) ? a : [])
          .filter(
            (x) =>
              x &&
              (Q
                ? x.enonce &&
                  Array.isArray(x.propositions) &&
                  x.propositions.length >= 2 &&
                  x.propositions.some((p) => p && p.correcte === true)
                : x.recto && x.verso),
          )
          .slice(0, 12),
        o = $("aio");
      if (!o) return;
      if (!L.length) {
        o.textContent = "Aucune proposition exploitable.";
        return;
      }
      o.innerHTML = L.map(
        (x, i) =>
          '<label class="pr" style="align-items:flex-start"><input type="checkbox" checked id="gc' +
          i +
          '" style="position:static;opacity:1;width:20px;height:20px;flex:none"><span>' +
          (Q
            ? "<b>" +
              esc(x.enonce) +
              "</b>" +
              x.propositions
                .slice(0, 8)
                .map((p) => "<br>" + (p.correcte === true ? "✔ " : "✘ ") + esc(p.texte))
                .join("")
            : "<b>" + esc(x.recto) + "</b><br>" + esc(x.verso)) +
          "</span></label>",
      ).join("");
      const b = document.createElement("button");
      b.className = "big";
      b.textContent = Q ? "Ajouter les QCM cochés" : "Ajouter les cartes cochées";
      b.onclick = () => {
        let n = 0;
        const src = c.pdf ? { c: c.id, p: sel ? (S.pp || {})[c.id] || 1 : pg0 } : null;
        L.forEach((x, i) => {
          if (!$("gc" + i).checked) return;
          n++;
          if (Q)
            S.qcm.push({
              id: uid(),
              ch: c.ch,
              enonce: String(x.enonce),
              img: "",
              props: x.propositions
                .slice(0, 8)
                .map((p, j) => ({ l: "ABCDEFGH"[j], t: String(p.texte), ok: p.correcte === true })),
              expl: String(x.explication || ""),
              ai: 1,
              src,
            });
          else
            S.cards.push({
              id: uid(),
              ch: c.ch,
              recto: String(x.recto),
              verso: String(x.verso),
              img: "",
              src,
            });
        });
        save();
        o.textContent =
          n +
          (Q
            ? " QCM ajouté(s), marqués « générés par IA, non vérifiés ». Vérifie chaque correction avec ton cours avant de t’y fier."
            : " carte(s) ajoutée(s) au chapitre. Relis-les : corrige ou supprime celles qui sont floues.");
        b.remove();
      };
      o.after(b);
    } catch (e) {
      const o = $("aio");
      if (o && (!e || e.code !== "cancelled"))
        o.textContent = e && e.nt ? "Aucun texte à analyser sur ces pages (PDF scanné ?)." : aiErr(e);
    }
  };
  if (sel) return run(async () => sel);
  if (c.texte) return run(async () => c.texte);
  askForm(
    "Pages à utiliser",
    '<label class="f">De la page</label><input type="number" min="1" value="' +
      pg0 +
      '"><label class="f">à la page</label><input type="number" min="1" value="' +
      (pg0 + 2) +
      '"><small>3 à 4 pages à la fois donnent de meilleurs résultats.</small>',
    (v) => {
      pg0 = +v[0] || 1;
      run(() => pdfText(c.id, pg0, +v[1] || pg0 + 2));
    },
  );
}
const aiCards = (id) => aiGen(id, "cards");
function carte() {
  const all = S.chap.map((c) => {
      const t = S.cs[c.id];
      return {
        c,
        p: t && t.n ? t.ok / t.n : null,
        age: t && t.d ? Math.round((new Date(day()) - new Date(t.d)) / 864e5) : 0,
      };
    }),
    weak = all
      .filter((x) => x.p !== null && x.p < 0.6)
      .sort((a, b) => a.p - b.p)
      .slice(0, 3);
  return (
    (weak.length ? '<h3>Priorités</h3><div class="g">' + weak.map(tile).join("") + "</div>" : "") +
    "<h3>Maîtrise par UE</h3>" +
    S.mat
      .map((m) => {
        const l = all.filter((x) => x.c.mid === m.id),
          t = l.filter((x) => x.p !== null),
          av = t.length ? t.reduce((a, x) => a + x.p, 0) / t.length : null;
        return (
          '<details class="c" style="--sc:' +
          m.couleur +
          '"><summary class="ds"><span>' +
          ICO(m) +
          " <b>" +
          esc(m.nom) +
          '</b></span><span class="bar"><i style="width:' +
          (av === null ? 0 : Math.round(av * 100)) +
          '%"></i></span><small>' +
          (av === null ? "—" : Math.round(av * 100) + " %") +
          '</small></summary><div class="g" style="margin:10px 0 0">' +
          l.map(tile).join("") +
          '</div><button class="b" style="margin-top:8px" onclick="qs(\'m:' +
          m.id +
          "')\">S’entraîner sur toute l’UE</button></details>"
        );
      })
      .join("")
  );
}
