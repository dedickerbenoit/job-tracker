# EPIC 01 : Authentification et gestion de compte

## Vue d'ensemble

Permettre aux utilisateurs de creer un compte, se connecter via email/mot de passe ou social login (Google, LinkedIn), et gerer leur profil.

## User stories incluses

- US-001 : Inscription par email et mot de passe
- US-002 : Connexion par email et mot de passe
- US-003 : Connexion via Google OAuth
- US-004 : Connexion via LinkedIn OAuth
- US-005 : Gestion du profil utilisateur
- US-006 : Reinitialisation du mot de passe
- US-007 : Authentification dans l'extension Chrome

## Priorite

P0 - Bloquant pour toutes les autres fonctionnalites

## Dependances techniques

- Backend : Laravel Sanctum ou Passport pour l'API
- Frontend : React Context API ou Redux pour la gestion de l'etat auth
- Extension : chrome.storage pour le token JWT

---

# US-001 : Inscription par email et mot de passe

## En tant que

Nouvel utilisateur

## Je veux

Creer un compte avec mon email et un mot de passe

## Afin de

Pouvoir acceder a l'application et sauvegarder mes candidatures

## Criteres d'acceptation

- [ ] Un formulaire d'inscription est accessible sur `/register`
- [ ] Le formulaire contient les champs : prenom, nom, email, mot de passe, confirmation mot de passe
- [ ] Validation front-end :
  - Email au format valide
  - Mot de passe minimum 8 caracteres avec au moins 1 majuscule, 1 chiffre, 1 caractere special
  - Confirmation identique au mot de passe
- [ ] Validation back-end :
  - Email unique (pas de doublon)
  - Mot de passe hache avec bcrypt
- [ ] En cas de succes : redirection vers `/dashboard` avec message de bienvenue
- [ ] En cas d'erreur : affichage des messages d'erreur sous chaque champ concerne
- [ ] Email de confirmation envoye apres inscription (lien de verification)
- [ ] Le compte est actif meme sans verification email (verification optionnelle pour V1)

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires backend (RegisterController)
- [ ] Tests E2E frontend (formulaire d'inscription)
- [ ] Code review effectuee
- [ ] Documentation API mise a jour
- [ ] Deploye en environnement de test

## Contexte technique

**Backend :**

- Route POST `/api/auth/register`
- Controller `AuthController@register`
- Model `User` avec fillable : `first_name`, `last_name`, `email`, `password`
- Migration users table avec champs supplementaires
- Validation Laravel avec Request `RegisterRequest`
- Retourne un token JWT + user data

**Frontend :**

- Page `/register` avec formulaire React
- Composant `RegisterForm.jsx`
- Gestion de l'etat avec React Hook Form ou Formik
- Appel API avec axios
- Stockage du token dans localStorage ou cookie httpOnly

**Base de donnees :**

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Dependances

- Bloque : US-002, US-007

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Prevoir un rate limiting sur l'endpoint d'inscription (max 5 tentatives par IP par heure)
- Ajouter un CAPTCHA si abus detectes
- Le prenom/nom sont optionnels mais recommandes

---

# US-002 : Connexion par email et mot de passe

## En tant que

Utilisateur inscrit

## Je veux

Me connecter avec mon email et mon mot de passe

## Afin de

Acceder a mon dashboard et mes candidatures

## Criteres d'acceptation

- [ ] Un formulaire de connexion est accessible sur `/login`
- [ ] Le formulaire contient : email, mot de passe, case "Se souvenir de moi"
- [ ] Validation front-end : champs requis
- [ ] Validation back-end : verification des credentials
- [ ] En cas de succes :
  - Token JWT genere et retourne
  - Redirection vers `/dashboard`
  - Message "Bienvenue [prenom]"
- [ ] En cas d'echec : message generique "Email ou mot de passe incorrect" (securite)
- [ ] Option "Se souvenir de moi" prolonge la duree de vie du token (30 jours au lieu de 24h)
- [ ] Lien "Mot de passe oublie ?" vers `/forgot-password`
- [ ] Rate limiting : max 5 tentatives par email par 15 minutes

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires backend (LoginController)
- [ ] Tests E2E frontend (formulaire de connexion)
- [ ] Tests de securite (tentatives repetees)
- [ ] Code review effectuee
- [ ] Documentation API mise a jour
- [ ] Deploye en environnement de test

## Contexte technique

**Backend :**

- Route POST `/api/auth/login`
- Controller `AuthController@login`
- Utilisation de Laravel Sanctum pour les tokens
- Middleware `throttle:5,15` pour le rate limiting
- Retourne : `{ token, user: { id, email, first_name, last_name } }`

**Frontend :**

- Page `/login` avec formulaire React
- Composant `LoginForm.jsx`
- Stockage du token dans localStorage
- Axios interceptor pour ajouter le token dans les headers

## Dependances

- Bloque par : US-001
- Bloque : US-007, toutes les US du dashboard

## Estimation

Story points : 3
Complexite : Faible

## Notes

- Ajouter un lien "Pas encore inscrit ? S'inscrire" sous le formulaire

---

# US-003 : Connexion via Google OAuth

## En tant que

Utilisateur

## Je veux

Me connecter avec mon compte Google

## Afin de

Gagner du temps et ne pas creer un nouveau mot de passe

## Criteres d'acceptation

- [ ] Un bouton "Se connecter avec Google" est present sur `/login` et `/register`
- [ ] Clic sur le bouton declenche le flow OAuth Google
- [ ] L'utilisateur est redirige vers Google pour autoriser l'application
- [ ] Apres autorisation, creation automatique du compte si nouvel utilisateur
- [ ] Si utilisateur existant (meme email), connexion directe
- [ ] Les informations recuperees : email, prenom, nom, photo de profil
- [ ] Token JWT genere et retourne
- [ ] Redirection vers `/dashboard` avec message de bienvenue

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires backend (GoogleOAuthController)
- [ ] Tests E2E frontend (bouton Google)
- [ ] Configuration Google Cloud Console effectuee
- [ ] Variables d'environnement documentees
- [ ] Code review effectuee
- [ ] Deploye en environnement de test

## Contexte technique

**Backend :**

- Package Laravel Socialite
- Route GET `/api/auth/google/redirect`
- Route GET `/api/auth/google/callback`
- Controller `GoogleOAuthController`
- Stockage du `google_id` dans la table users
- Si email existe : lier le compte Google
- Si email inexistant : creer un nouveau user

**Frontend :**

- Bouton avec icone Google
- Redirection vers `/api/auth/google/redirect`
- Gestion du callback avec le token

**Base de donnees :**

```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL;
```

**Configuration :**

- Google Cloud Console : creer un projet OAuth
- Variables `.env` : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

## Dependances

- Bloque par : US-001, US-002

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Gerer le cas ou l'utilisateur refuse l'autorisation Google
- Permettre de deconnecter le compte Google depuis le profil

---

# US-004 : Connexion via LinkedIn OAuth

## En tant que

Utilisateur chercheur d'emploi

## Je veux

Me connecter avec mon compte LinkedIn

## Afin de

Utiliser le meme compte que celui que j'utilise pour postuler

## Criteres d'acceptation

- [ ] Un bouton "Se connecter avec LinkedIn" est present sur `/login` et `/register`
- [ ] Clic sur le bouton declenche le flow OAuth LinkedIn
- [ ] L'utilisateur est redirige vers LinkedIn pour autoriser l'application
- [ ] Apres autorisation, creation automatique du compte si nouvel utilisateur
- [ ] Si utilisateur existant (meme email), connexion directe
- [ ] Les informations recuperees : email, prenom, nom, photo de profil
- [ ] Token JWT genere et retourne
- [ ] Redirection vers `/dashboard` avec message de bienvenue

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires backend (LinkedInOAuthController)
- [ ] Tests E2E frontend (bouton LinkedIn)
- [ ] Configuration LinkedIn Developer Portal effectuee
- [ ] Variables d'environnement documentees
- [ ] Code review effectuee
- [ ] Deploye en environnement de test

## Contexte technique

**Backend :**

- Package Laravel Socialite avec provider LinkedIn
- Route GET `/api/auth/linkedin/redirect`
- Route GET `/api/auth/linkedin/callback`
- Controller `LinkedInOAuthController`
- Stockage du `linkedin_id` dans la table users

**Frontend :**

- Bouton avec icone LinkedIn (couleur #0077B5)
- Redirection vers `/api/auth/linkedin/redirect`
- Gestion du callback avec le token

**Base de donnees :**

```sql
ALTER TABLE users ADD COLUMN linkedin_id VARCHAR(255) NULL UNIQUE;
```

**Configuration :**

- LinkedIn Developer Portal : creer une app OAuth
- Variables `.env` : `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`

## Dependances

- Bloque par : US-001, US-002

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Tres pertinent pour un outil de recherche d'emploi
- Potentiellement permettre d'importer les candidatures depuis LinkedIn (V2)

---

# US-005 : Gestion du profil utilisateur

## En tant que

Utilisateur connecte

## Je veux

Consulter et modifier mes informations personnelles

## Afin de

Garder mes informations a jour

## Criteres d'acceptation

- [ ] Une page `/profile` est accessible depuis le menu utilisateur (header)
- [ ] La page affiche : prenom, nom, email, photo de profil, date d'inscription
- [ ] Un bouton "Modifier" permet d'editer les informations
- [ ] Champs modifiables : prenom, nom, photo de profil
- [ ] L'email n'est pas modifiable (securite)
- [ ] Upload de photo de profil (max 2Mo, formats : jpg, png, webp)
- [ ] Validation front et back pour la photo
- [ ] Bouton "Changer le mot de passe" redirige vers `/change-password`
- [ ] Section "Comptes lies" affiche les comptes Google/LinkedIn connectes
- [ ] Possibilite de lier/delier un compte Google ou LinkedIn
- [ ] Bouton "Supprimer mon compte" (confirmation obligatoire)

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires backend (ProfileController)
- [ ] Tests E2E frontend (formulaire de profil)
- [ ] Code review effectuee
- [ ] Deploye en environnement de test

## Contexte technique

**Backend :**

- Route GET `/api/user/profile` (auth middleware)
- Route PUT `/api/user/profile` (auth middleware)
- Route POST `/api/user/avatar` (upload)
- Route DELETE `/api/user/account` (soft delete)
- Validation : `ProfileUpdateRequest`
- Stockage des avatars dans `storage/app/public/avatars`

**Frontend :**

- Page `/profile` avec React
- Composant `ProfileForm.jsx`
- Upload de fichier avec preview
- Confirmation modale pour la suppression de compte

## Dependances

- Bloque par : US-002

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Soft delete pour la suppression de compte (conserver les donnees 30 jours)
- Anonymiser les donnees apres 30 jours si non restauration

---

# US-006 : Reinitialisation du mot de passe

## En tant que

Utilisateur ayant oublie son mot de passe

## Je veux

Recevoir un lien par email pour reinitialiser mon mot de passe

## Afin de

Retrouver l'acces a mon compte

## Criteres d'acceptation

- [ ] Page `/forgot-password` avec formulaire (champ email uniquement)
- [ ] Validation : email au format valide
- [ ] Apres soumission : message generique "Si cet email existe, un lien a ete envoye" (securite)
- [ ] Email envoye avec lien de reinitialisation valide 1 heure
- [ ] Le lien redirige vers `/reset-password?token=xxx`
- [ ] Page de reinitialisation avec : nouveau mot de passe, confirmation
- [ ] Validation du token (existant, non expire, non utilise)
- [ ] Validation du nouveau mot de passe (memes regles que l'inscription)
- [ ] Apres succes : redirection vers `/login` avec message "Mot de passe modifie avec succes"
- [ ] Le token est invalide apres utilisation

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires backend (PasswordResetController)
- [ ] Tests E2E frontend (flow complet)
- [ ] Tests email (envoi et contenu)
- [ ] Code review effectuee
- [ ] Deploye en environnement de test

## Contexte technique

**Backend :**

- Route POST `/api/auth/forgot-password`
- Route POST `/api/auth/reset-password`
- Controller `PasswordResetController`
- Table `password_resets` (Laravel native)
- Notification Laravel pour l'email
- Rate limiting : 1 email par 5 minutes par email

**Frontend :**

- Page `/forgot-password`
- Page `/reset-password`
- Composants React

**Base de donnees :**

```sql
CREATE TABLE password_resets (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255),
    created_at TIMESTAMP
);
```

## Dependances

- Bloque par : US-002

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Utiliser Laravel Notifications pour l'email
- Template email sobre et clair
- Nettoyer les tokens expires avec un scheduler Laravel

---

# US-007 : Authentification dans l'extension Chrome

## En tant que

Utilisateur de l'extension Chrome

## Je veux

Me connecter dans l'extension pour pouvoir sauvegarder des offres

## Afin de

Utiliser l'extension sans avoir a ouvrir le dashboard a chaque fois

## Criteres d'acceptation

- [ ] Au clic sur l'icone extension, si non connecte : affichage d'un bouton "Se connecter"
- [ ] Clic sur "Se connecter" ouvre une nouvelle fenetre vers le dashboard `/login`
- [ ] Apres connexion reussie sur le dashboard, le token JWT est recupere par l'extension
- [ ] Le token est stocke dans `chrome.storage.local`
- [ ] L'extension detecte automatiquement la connexion et affiche "Connecte en tant que [prenom]"
- [ ] Si le token expire, l'extension affiche a nouveau "Se connecter"
- [ ] Un bouton "Se deconnecter" dans l'extension supprime le token du storage
- [ ] Le token est envoye dans le header Authorization de chaque requete API

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels de l'extension
- [ ] Code review effectuee
- [ ] Extension testee sur Chrome et Edge

## Contexte technique

**Extension :**

- Fichier `popup.html` avec UI de connexion
- Fichier `popup.js` pour la logique
- Utilisation de `chrome.storage.local` pour stocker le token
- Communication avec le dashboard via `chrome.runtime.sendMessage`
- Ecoute du postMessage depuis le dashboard apres connexion

**Flow technique :**

1. Extension ouvre le dashboard avec un param `?source=extension`
2. Apres connexion, le dashboard envoie le token via `window.postMessage`
3. L'extension ecoute le message et stocke le token
4. L'extension peut ensuite faire des requetes API avec le token

**Securite :**

- Valider l'origine du postMessage (meme domaine uniquement)
- Token stocke de maniere securisee dans chrome.storage.local
- Refresh token pour eviter de se reconnecter trop souvent

## Dependances

- Bloque par : US-002
- Bloque : US-101 (capture d'offres)

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- Gerer le cas ou l'utilisateur se connecte depuis l'extension puis change de compte sur le dashboard
- Ajouter un indicateur visuel (icone verte) sur l'extension quand connecte
