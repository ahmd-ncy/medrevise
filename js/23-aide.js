// ================= Bulles d'aide « ? » =================
// helpBtn("j") affiche un petit bouton rond ; helpShow("j") ouvre l'explication correspondante.
const HELP = {
  j: [
    "La méthode des J",
    "<p>C’est une méthode de révision espacée <b>par chapitre</b>. Le jour où tu travailles un chapitre pour la première fois, c’est son <b>J0</b>. Tu le revois ensuite à <b>J1, J3, J7, J14 et J30</b>, puis tous les 30 jours.</p><p>Chaque rappel arrive juste avant que tu commences à oublier : c’est ce qui fixe le cours dans la mémoire à long terme, avec beaucoup moins d’heures qu’en relisant tout en boucle.</p><p><b>Dans MedRevise :</b> un rappel se valide tout seul quand tu as vraiment travaillé le chapitre : 5 réponses à ses QCM ou ses cartes dans la journée, ou, s’il n’a qu’un livret, 10 minutes de lecture. Le bouton « Faire le rappel » lance directement ce travail, et une barre montre où tu en es. Les écarts raccourcissent si tu réussis moins de 60 % du chapitre, et s’allongent au-delà de 85 %. Tu peux changer les jours dans le Planning.</p>",
  ],
  plan: [
    "Le planning",
    "<p>Le planning organise tes journées à partir de la méthode des J. Il place d’abord les <b>rappels</b> les plus urgents (les plus proches de J0), puis les <b>nouveaux chapitres</b>, dans la limite du temps que tu as indiqué par jour.</p><p>Ce qui ne tient pas dans ta journée est <b>reporté au lendemain</b>. Avec une date de concours (dans Profil → Réglages), il calcule combien de chapitres commencer par semaine pour avoir tout vu à temps, et te prévient si ton temps ne suffit pas.</p><p>Dans « À commencer », tu choisis l’ordre des chapitres, tu en retires du programme, ou tu indiques la date à laquelle tu as déjà vu un chapitre en cours.</p>",
  ],
  fsrs: [
    "La répétition espacée des cartes",
    "<p>Après chaque carte, dis honnêtement si tu la savais : <b>À revoir</b> (oubliée), <b>Difficile</b>, <b>Bien</b> ou <b>Facile</b>. Le délai affiché sous chaque bouton est le moment où la carte reviendra.</p><p>L’algorithme (FSRS, le même qu’Anki) calcule pour chaque carte le meilleur moment pour la revoir : une carte bien sue revient après 3 jours, puis 11, 35, 100 jours… Une carte oubliée revient tout de suite en fin de séance.</p><p>Fais simplement tes <b>cartes du jour</b> chaque jour : c’est la régularité qui compte. Les QCM réussis ou ratés sont programmés de la même façon (« À revoir aujourd’hui » dans l’onglet QCM).</p>",
  ],
  import: [
    "Import depuis Claude",
    "<p>Plutôt que de taper tes QCM et tes flashcards un par un, tu peux les faire préparer par Claude à partir de ton cours :</p><p><b>1.</b> Copie le prompt avec le bouton ci-dessous.<br><b>2.</b> Ouvre une nouvelle conversation avec Claude, colle le prompt, complète l’UE et le chapitre à la fin, et joins ton cours en PDF.<br><b>3.</b> Claude répond avec un bloc de texte (au format JSON) : copie-le en entier et colle-le ici, puis « Vérifier » et « Importer ».</p><p>L’app vérifie chaque question avant l’import, ignore les doublons, et marque les QCM « à vérifier » : relis leurs corrections avec ton cours dans Ajouter → Gérer.</p>",
  ],
  err: [
    "La page Erreurs",
    "<p><b>Carnet d’erreurs :</b> chaque QCM raté y entre, et en sort dès que tu le réussis sans faute. « Corriger mes erreurs » te les repose.</p><p><b>Faux sûrs :</b> les questions ratées alors que tu t’étais dit « sûr(e) » (option « niveau de confiance » des QCM). Ce sont les plus dangereuses le jour du concours : à revoir en priorité.</p><p><b>Cartes difficiles :</b> les flashcards que tu as oubliées plusieurs fois et qui ne sont pas encore acquises.</p><p><b>Pourquoi je me trompe :</b> après une erreur, indique sa cause (je ne savais pas, confusion, piège, inattention) pour obtenir des conseils adaptés.</p>",
  ],
  obj: [
    "Objectifs du jour et flamme",
    "<p>Chaque jour, l’app te fixe jusqu’à trois objectifs tirés de ton planning : tes rappels de la méthode des J, tes nouveaux chapitres, tes cartes du jour ou un nombre de QCM.</p><p>Quand tous les objectifs sont faits, la journée est <b>bouclée</b> et ta <b>flamme</b> gagne un jour. Si tu sautes une journée, elle repart de zéro. L’anneau autour de la flamme montre où tu en es aujourd’hui.</p>",
  ],
  gel: [
    "Le gel de flamme",
    "<p>Un gel protège ta flamme si tu rates <b>une journée</b> : il s’utilise tout seul le lendemain, et ta série continue (sans gagner de jour).</p><p>Tu reçois <b>un gel par mois</b>. Tu peux aussi en gagner un en tenant une série de <b>60 jours d’affilée</b>. Les gels ne se cumulent pas : tu en as au plus un à la fois, et un gel inutilisé ne s’ajoute pas à celui du mois suivant.</p>",
  ],
  inv: [
    "Inviter quelqu’un",
    "<p>Toi seul peux créer des codes. Chaque code ne sert <b>qu’une fois</b>.</p><p><b>« Le code doit être utilisé dans les… »</b> : passé ce délai, le code ne marche plus s’il n’a pas servi.</p><p><b>« Durée de l’accès »</b> : combien de temps la personne pourra utiliser l’app après avoir utilisé le code (de 1 heure à 1 an, ou illimité). Tu peux changer cette durée ou retirer l’accès à tout moment dans « Membres ».</p><p>Donne le code avec l’adresse de l’app : la personne choisit « J’ai un code d’invitation ». Ses données restent séparées des tiennes.</p>",
  ],
};
const helpBtn = (k) =>
  '<button type="button" class="hq" onclick="event.stopPropagation();helpShow(\'' +
  k +
  '\')" aria-label="Aide : ' +
  esc(HELP[k][0]) +
  '">?</button>';
function helpShow(k) {
  const h = HELP[k];
  if (!h) return;
  const d = document.createElement("div");
  d.id = "md";
  d.innerHTML =
    '<div class="mb hlp" role="dialog" aria-modal="true"><h3>' +
    h[0] +
    "</h3>" +
    h[1] +
    '<button class="big" id="mn">Compris</button></div>';
  document.body.appendChild(d);
  d.onclick = (e) => {
    if (e.target === d) d.remove();
  };
  $("mn").onclick = () => d.remove();
  $("mn").focus();
}

// Petit message temporaire en bas de l'écran.
// keep = message important (ex. bienvenue) : les autres messages attendent qu'il ait disparu.
function toast(msg, keep) {
  const now = Date.now();
  if (!keep && toast.lock > now) return setTimeout(() => toast(msg), toast.lock - now + 300);
  if (keep) toast.lock = now + 4500;
  let t = $("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.innerHTML = msg;
  t.className = "on";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = ""), 4500);
}
// ================= Gel de flamme =================
// Un gel par mois (non cumulable), ou un gel gagné après 60 jours d'affilée. Il protège une journée manquée.
function gelTick() {
  const g = (S.gel = S.gel || { has: 0, m: "", used: [] }),
    mo = day().slice(0, 7);
  let ch = 0;
  if (g.m !== mo) {
    if (!g.has) {
      g.has = 1;
      ch = 1;
      setTimeout(() => toast("❄ Ton gel de flamme du mois est disponible."), 900);
    }
    g.m = mo;
    ch = 1;
  }
  const y = day(-1),
    has = (d) => S.days.includes(d) || g.used.includes(d);
  if (g.has && !has(y) && has(day(-2))) {
    g.used = g.used.concat(y).slice(-24);
    g.has = 0;
    ch = 1;
    setTimeout(() => toast("❄ Ton gel de flamme a protégé ta série hier : ta flamme continue !"), 900);
  }
  if (ch) save();
}
// Après une journée bouclée : un gel gagné tous les 60 jours d'affilée (si tu n'en as pas déjà un).
function gelEarn() {
  const g = (S.gel = S.gel || { has: 0, m: "", used: [] }),
    f = flame();
  if (f > 0 && f % 60 === 0 && !g.has && g.e !== day()) {
    g.has = 1;
    g.e = day();
    setTimeout(() => toast("❄ 60 jours d’affilée : tu gagnes un gel de flamme !"), 600);
  }
}
