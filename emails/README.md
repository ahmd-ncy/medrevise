# Modèles d'e-mails MedRevise

À coller dans Supabase → **Authentication** → **Emails** → **Templates** (disponible une fois l'envoi personnalisé SMTP activé).

| Modèle Supabase | Objet (Subject) | Contenu (Message body) |
|---|---|---|
| Confirm signup | `Confirme ton adresse e-mail · MedRevise` | [confirmation.html](confirmation.html) |
| Reset password | `Ton nouveau mot de passe MedRevise` | [mot-de-passe.html](mot-de-passe.html) |
| Change email address | `Confirme ta nouvelle adresse · MedRevise` | [changement-email.html](changement-email.html) |

Pour chaque modèle : ouvre le fichier, copie tout son contenu, colle-le dans le champ « Message body » (en remplaçant l'existant), mets l'objet, puis **Save**.
