# MedRevise

Application de révision pour la médecine (PASS/LAS) : livrets de cours et PDF, QCM au barème de Nancy, flashcards avec répétition espacée (FSRS), schémas à trous, méthode des J avec planning, statistiques.

Elle s'installe sur l'écran d'accueil de l'iPhone et sur le bureau de l'ordinateur, fonctionne hors connexion, et synchronise les données (PDF compris) avec un compte Supabase.

Adresse : https://ahmd-ncy.github.io/medrevise/

## Mise en route (une seule fois)

### 1. Base de données Supabase

1. Dans le projet Supabase, ouvre **SQL Editor** → **New query**.
2. Colle tout le contenu du fichier [`supabase.sql`](supabase.sql), puis clique sur **Run**.
3. Dans **Authentication** → **URL Configuration**, mets `https://ahmd-ncy.github.io/medrevise/` dans **Site URL**, et ajoute-la aussi dans **Redirect URLs**. C'est l'adresse où mènent les liens de confirmation et de mot de passe oublié.

4. **Accès sur invitation** : après avoir créé ton propre compte dans l'app, vérifie dans **Authentication → Users** que tu es le seul compte, puis exécute de la même façon le fichier [`supabase-invitations.sql`](supabase-invitations.sql). Ton compte devient administrateur. Exécute ensuite [`supabase-maj-2.sql`](supabase-maj-2.sql) (durées et gestion des membres). Ensuite, personne ne peut utiliser l'app ni stocker de données sans un code d'invitation que tu crées dans **Profil → Compte et synchronisation**. Tu choisis combien de temps le code reste utilisable et combien de temps dure l'accès (de 1 heure à 1 an, ou illimité), et tu peux modifier ou retirer l'accès de chaque membre.

### 2. Mise en ligne (GitHub Pages)

Dans le dépôt GitHub : **Settings** → **Pages** → **Source : Deploy from a branch** → branche **main**, dossier **/ (root)** → **Save**. L'adresse est active une à deux minutes plus tard.

### 3. Installation

- **iPhone** : ouvre l'adresse dans **Safari**, touche **Partager** puis **Sur l'écran d'accueil**.
- **Ordinateur** : ouvre l'adresse dans **Chrome** ou **Edge**, puis clique sur l'icône **Installer** à droite de la barre d'adresse. Sur Mac avec Safari : **Fichier** → **Ajouter au Dock**.

Ensuite, dans l'app : **Profil** → **Compte et synchronisation** → crée ton compte, puis connecte-toi avec le même compte sur chaque appareil.

## Comment ça marche

- Tout est enregistré d'abord sur l'appareil (IndexedDB), même hors connexion, puis envoyé au compte quelques secondes après chaque modification.
- Les données sont découpées en morceaux (réglages, statistiques, puis QCM, cartes et livrets par chapitre) : seuls les morceaux modifiés sont envoyés.
- Les PDF et images de schémas sont stockés dans l'espace privé « fichiers » de Supabase (50 Mo maximum par fichier).
- Chaque utilisateur ne peut lire et modifier que ses propres données (règles de sécurité dans `supabase.sql`).
- La clé écrite dans `js/00-config.js` est la clé publique (« publishable ») : elle est faite pour être visible. Ne jamais y mettre la clé secrète.

## Structure du code

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'entrée (générée par `build.py`) |
| `css/app.css` | Styles |
| `js/00-config.js` | Adresse et clé publique Supabase |
| `js/01` à `js/21` | Modules de l'app, chargés dans l'ordre (icônes, état, accueil, cours, séances, planning, import JSON…) |
| `js/22-sync.js` | Compte, synchronisation et invitations |
| `js/23-aide.js` | Bulles d'aide « ? » |
| `js/24-tuto.js` | Visite guidée |
| `js/99-demarrage.js` | Démarrage |
| `sw.template.js` → `sw.js` | Fonctionnement hors connexion (généré par `build.py`) |
| `vendor/` | pdf.js et supabase-js, embarqués pour marcher hors connexion |
| `supabase.sql` | Création de la base et du stockage |
| `supabase-invitations.sql`, `supabase-maj-2.sql` | Accès sur invitation, durées, membres |

Après avoir ajouté, renommé ou modifié des fichiers, lance `python3 build.py` : il régénère `index.html` et `sw.js` (avec un nouveau numéro de version, pour que les appareils récupèrent la mise à jour).
