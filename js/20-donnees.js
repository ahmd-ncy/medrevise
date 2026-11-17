// Enregistre un fichier texte : téléchargement intégré à Claude, feuille de partage (iPhone) ou téléchargement classique.
async function dlFile(name, text, type) {
  try {
    const d = window.claude && claude.use ? await claude.use("downloads") : null;
    if (d) {
      await d.save({ filename: name, data: text });
      return true;
    }
  } catch (e) {}
  try {
    const f = new File([text], name, { type: type || "text/plain" });
    if (/iPhone|iPad|iPod/.test(navigator.userAgent) && navigator.canShare && navigator.canShare({ files: [f] })) {
      await navigator.share({ files: [f], title: name });
      return true;
    }
  } catch (e) {
    if (e && e.name == "AbortError") return true;
  }
  try {
    const u = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })),
      a = document.createElement("a");
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
    return true;
  } catch (e) {}
  return false;
}
function data() {
  return '<h2>Données</h2><div class="c"><b>Importer un JSON</b><p class="m">Restaure une sauvegarde, ou importe des QCM et flashcards au format MedRevise (le prompt à donner à Claude est dans Ajouter → Importer JSON).</p><textarea id="ta" style="font:13px monospace"></textarea><div class="r"><input type="file" accept=".json" onchange="this.files[0].text().then(t=>$(\'ta\').value=t)"><button class="b p" onclick="imp($(\'ta\').value)">Importer</button></div><div id="msg" role="status"></div></div><div class="c"><b>Sauvegarde</b><p class="m">Contient tes UE, cours en texte, QCM, cartes et statistiques. Les PDF ne sont pas inclus. Une fois connecté (Profil → Compte), tout est sauvegardé automatiquement dans ton compte, PDF compris.</p><div class="r"><button class="b" onclick="exp()">Exporter tout</button><button class="b" onclick="resetDlg()">Réinitialiser</button></div></div>';
}
async function exp() {
  const j = JSON.stringify(S),
    m = $("msg"),
    say = (t) => {
      if (m) m.innerHTML = "<p>" + t + "</p>";
    };
  if (await dlFile("medrevise-sauvegarde-" + day() + ".json", j, "application/json"))
    return say("Sauvegarde enregistrée.");
  const t = $("ta");
  if (t) {
    t.value = j;
    t.select();
    try {
      await navigator.clipboard.writeText(j);
      say(
        "Téléchargement indisponible ici : la sauvegarde est copiée et affichée ci-dessus. Colle-la dans une note pour la garder.",
      );
    } catch (e) {
      say("Téléchargement indisponible ici : copie le texte affiché ci-dessus et garde-le dans une note.");
    }
  }
}
function ens(mn, cn, pr) {
  let m = S.mat.find((x) => x.nom === mn);
  if (!m)
    S.mat.push(
      (m = { id: uid(), nom: mn, prof: "", ic: guessIc(mn), couleur: COL[S.mat.length % COL.length] }),
    );
  let c = S.chap.find((x) => x.mid === m.id && x.titre === cn);
  if (!c) S.chap.push((c = { id: uid(), mid: m.id, titre: cn, prof: pr || "", info: "" }));
  return c.id;
}
function imp(txt) {
  let d,
    err = [],
    n = 0;
  const out = (m) => {
    $("msg").innerHTML =
      "<p>" + m + "</p>" + err.map((e) => '<p class="m">' + icn("alert") + " " + esc(e) + "</p>").join("");
  };
  try {
    d = JSON.parse(txt);
  } catch (e) {
    return out("JSON illisible : " + esc(e.message));
  }
  if (d.mat && d.chap && d.qcm) {
    S = d;
    save();
    return out("Sauvegarde restaurée.");
  }
  if (Array.isArray(d) || d.format === "medrevise") {
    go("add");
    R = { add: "json" };
    render();
    $("jt").value = txt;
    return jCheck();
  }
  const ch = ens(d.ue || d.matiere || "Sans UE", d.chapitre || "Général", d.prof);
  if (d.format === "medrevise-qcm")
    (d.questions || []).forEach((q, i) => {
      if (!q.enonce || !Array.isArray(q.propositions) || q.propositions.length < 2)
        return err.push("Question " + (i + 1) + " ignorée");
      S.qcm.push({
        id: uid(),
        ch,
        enonce: q.enonce,
        img: q.image || "",
        props: q.propositions.map((p) => ({
          l: p.lettre,
          t: p.texte,
          ok: p.correcte === true ? true : p.correcte === false ? false : null,
        })),
        expl: q.explication || "",
        an: q.annale || d.annale || "",
      });
      n++;
    });
  else if (d.format === "medrevise-flashcards")
    (d.cartes || []).forEach((c, i) => {
      let r = c.recto,
        vv = c.verso;
      if (c.type === "trous" && c.texte) {
        r = c.texte.replace(/\{\{.*?\}\}/g, "[...]");
        vv = c.texte.replace(/\{\{(.*?)\}\}/g, "$1");
      }
      if (!r || !vv) return err.push("Carte " + (i + 1) + " ignorée");
      S.cards.push({ id: uid(), ch, recto: r, verso: vv, img: c.image || "" });
      n++;
    });
  else if (d.format === "medrevise-cours") {
    if (!d.contenu) return out("Cours sans « contenu ».");
    S.courses.push({
      id: uid(),
      ch,
      titre: d.titre || d.chapitre || "Sans titre",
      texte: d.contenu,
      imgs: d.images || [],
    });
    n = 1;
  } else return out("Format inconnu.");
  save();
  out(n + " élément(s) importé(s).");
}
