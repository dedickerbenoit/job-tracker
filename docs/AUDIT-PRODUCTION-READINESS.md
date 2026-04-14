# Audit Production-Readiness -- JobTracker

**Date** : 2026-04-13
**Perimetre** : Monorepo complet (Laravel backend + React frontend + Chrome Extension)
**Type** : Audit code source (RGPD, Securite OWASP, SEO)

---

## Synthese executive

| Domaine | Score | Critique | Eleve | Moyen | Faible |
|---------|-------|----------|-------|-------|--------|
| **Securite (OWASP)** | **68/100** | 2 | 5 | 8 | 5 |
| **RGPD** | **25/100** | 11 bloquants | 8 importants | 5 mineurs | - |
| **SEO** | **55/100** *(ajuste app privee)* | 3 bloquants | 5 importants | 6 mineurs | - |

**Verdict** : Le projet dispose d'une base technique saine (policies, validation, SQL parametre) mais il manque des elements essentiels pour une mise en production, notamment cote RGPD ou quasi rien n'est implemente malgre une documentation d'architecture tres complete.

**Effort total estime** : ~50-55 heures

---

# 1. AUDIT SECURITE (OWASP Top 10)

## 1.1 Vulnerabilites critiques (P0)

### SEC-001 -- APP_KEY exposee localement

- **OWASP** : A02 (Cryptographic Failures)
- **Localisation** : `backend/.env:3`
- **Description** : Le `.env` contient `APP_KEY=base64:CBBkfgfuwkNZQ8YvolXXYQHRfzjfwro0B6oyuf0UJ/A=`. Bien que non suivi par git, si cette cle est compromise toutes les donnees chiffrees (sessions, cookies) sont dechiffrables.
- **Impact** : Compromission totale du chiffrement applicatif. Forge de sessions, deserialisation de payloads malveillants.
- **Correction** : Regenerer avec `php artisan key:generate` si exposee. En production, utiliser des variables d'environnement systeme.
- **Effort** : 5 min

### SEC-002 -- Mode debug actif dans .env.example

- **OWASP** : A05 (Security Misconfiguration)
- **Localisation** : `backend/.env:4` et `backend/.env.example:4`
- **Description** : `APP_DEBUG=true` dans le `.env` ET le `.env.example`. En production, Laravel expose les stack traces completes, variables d'environnement (APP_KEY, credentials BDD), queries SQL via les pages d'erreur.
- **Impact** : Fuite de secrets (APP_KEY, credentials BDD, chemins serveur).
- **Correction** :
```env
# .env.example
APP_ENV=production
APP_DEBUG=false
```
- **Effort** : 5 min

---

## 1.2 Vulnerabilites elevees (P1)

### SEC-003 -- Absence de configuration CORS explicite

- **OWASP** : A05 (Security Misconfiguration)
- **Localisation** : Fichier `backend/config/cors.php` absent
- **Description** : Le package `fruitcake/php-cors` est installe mais aucun fichier de configuration n'est publie. Les defaults pourraient autoriser toutes les origines (`allowed_origins: ['*']`).
- **Impact** : Requetes cross-origin malveillantes exploitant le token de l'utilisateur authentifie.
- **Correction** :
```php
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => true,
];
```
- **Effort** : 15 min

### SEC-004 -- Absence de headers de securite HTTP

- **OWASP** : A05 (Security Misconfiguration)
- **Localisation** : `backend/bootstrap/app.php` (middleware vide, lignes 14-16)
- **Description** : Aucun header de securite configure : CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy.
- **Impact** : Clickjacking, MIME-type sniffing, pas de HSTS.
- **Correction** : Creer `app/Http/Middleware/SecurityHeaders.php` qui ajoute :
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
L'enregistrer dans `bootstrap/app.php` :
```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
})
```
- **Effort** : 30 min

### SEC-005 -- Autorisation manquante sur timeline et stats

- **OWASP** : A01 (Broken Access Control)
- **Localisation** : `backend/app/Http/Controllers/ApplicationController.php:161-210`
- **Description** : Les methodes `timeline()` et `stats()` n'appellent pas `$this->authorize()` contrairement a toutes les autres methodes CRUD. Bien que les donnees soient scopees par `$request->user()`, c'est une inconsistance architecturale.
- **Impact** : Risque faible actuel, mais la coherence est rompue.
- **Correction** :
```php
public function timeline(Request $request): AnonymousResourceCollection
{
    $this->authorize('viewAny', Application::class);
    // ...
}

public function stats(Request $request): JsonResponse
{
    $this->authorize('viewAny', Application::class);
    // ...
}
```
- **Effort** : 5 min

### SEC-006 -- Pas de validation from_date / to_date

- **OWASP** : A03 (Injection)
- **Localisation** : `backend/app/Http/Controllers/ApplicationController.php:41-47` et `:173-179`
- **Description** : `from_date` et `to_date` sont injectes dans des clauses `where('created_at', '>=', ...)` sans validation de format. Bien que Eloquent utilise des parametres lies, des valeurs malformees pourraient causer des erreurs SQL selon le driver.
- **Impact** : Injection potentielle selon le driver DB, erreurs imprevisibles.
- **Correction** :
```php
$request->validate([
    'from_date' => ['nullable', 'date', 'date_format:Y-m-d'],
    'to_date' => ['nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:from_date'],
]);
```
- **Effort** : 10 min

### SEC-008 -- Politique de mot de passe insuffisante

- **OWASP** : A07 (Authentication Failures)
- **Localisation** : `backend/app/Http/Requests/Auth/RegisterRequest.php:20`
- **Description** : Validation `'min:8'` sans exigence de complexite. Pas de verification HaveIBeenPwned. "12345678" ou "password" sont acceptes.
- **Impact** : Brute-force trivial.
- **Correction** :
```php
use Illuminate\Validation\Rules\Password;

'password' => ['required', 'string', Password::min(8)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->uncompromised(), 'confirmed'],
```
- **Effort** : 10 min

---

## 1.3 Vulnerabilites moyennes (P2)

### SEC-009 -- Token Sanctum expire en 7 jours

- **Localisation** : `backend/config/sanctum.php:50`
- **Description** : `'expiration' => 60 * 24 * 7` (10080 min). Fenetre d'exploitation trop large en cas de vol.
- **Correction** : Reduire a 24h : `'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 60 * 24)`
- **Effort** : 5 min

### SEC-010 -- Token dans localStorage (vulnerable XSS)

- **Localisation** : `frontend/src/stores/authStore.ts:52`, `frontend/src/services/api.ts:28`
- **Description** : `localStorage` est accessible via JavaScript. En cas de XSS, un attaquant vole le token.
- **Correction** : Migrer vers le mode SPA de Sanctum avec cookies HttpOnly. A defaut, s'assurer qu'aucun XSS n'est possible (aucun `dangerouslySetInnerHTML` detecte actuellement).
- **Effort** : 2-4h

### SEC-011 -- Pas de rate limiting sur routes authentifiees

- **Localisation** : `backend/routes/api.php:13-27`
- **Description** : Seules les routes auth ont `throttle:5,1`. Les routes CRUD n'ont aucune limitation.
- **Impact** : DoS, scraping massif.
- **Correction** : `Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(...)`
- **Effort** : 5 min

### SEC-012 -- Pas de limite de taille description/notes

- **Localisation** : `backend/app/Http/Requests/StoreApplicationRequest.php:24,27`
- **Description** : Champs `TEXT` sans `max`, un utilisateur peut soumettre des Mo.
- **Correction** : `'description' => ['nullable', 'string', 'max:50000']`, `'notes' => ['nullable', 'string', 'max:10000']`
- **Effort** : 5 min

### SEC-013 -- Sessions non chiffrees

- **Localisation** : `backend/.env:33` (`SESSION_ENCRYPT=false`)
- **Correction** : `SESSION_ENCRYPT=true`
- **Effort** : 1 min

### SEC-014 -- API URL HTTP dans l'extension Chrome

- **Localisation** : `extension/utils/api.js:3`
- **Description** : `http://localhost:8000/api` en dur. En production les credentials transitent en clair.
- **Correction** : Rendre l'URL configurable via settings de l'extension, forcer HTTPS.
- **Effort** : 30 min

### SEC-015 -- Fonctions globales window dans l'extension

- **Localisation** : `extension/content/scrapers/helpers.js:13,32,42,66`
- **Description** : `window.extractField`, `window.scrapeLinkedIn`, etc. sont overridables par du code tiers.
- **Correction** : Utiliser `Object.defineProperty` avec `writable: false, configurable: false`.
- **Effort** : 45 min

### SEC-018 -- Absence de logging securite

- **Localisation** : `backend/app/Http/Controllers/AuthController.php:35-55`
- **Description** : Aucun log des tentatives de connexion echouees, creations de comptes, deconnexions. Pas de rotation des logs.
- **Correction** :
```php
Log::warning('Failed login attempt', ['email' => $validated['email'], 'ip' => $request->ip()]);
Log::info('Successful login', ['user_id' => $user->id, 'ip' => $request->ip()]);
```
Configurer `LOG_STACK=daily`.
- **Effort** : 1h

---

## 1.4 Vulnerabilites faibles (P3)

| ID | Probleme | Localisation | Correction | Effort |
|----|----------|-------------|------------|--------|
| SEC-016 | Pas de CSP dans extension manifest | `extension/manifest.json` | Ajouter `content_security_policy` explicite | 5 min |
| SEC-017 | `host_permissions` localhost en prod | `extension/manifest.json:15` | Build system avec URL par environnement | 30 min |
| SEC-019 | Pas de `$fillable`/`$guarded` sur Application | `backend/app/Models/Application.php` | `protected $guarded = ['id', 'user_id'];` | 5 min |
| SEC-020 | Pas de prefix token Sanctum | `backend/config/sanctum.php:65` | `'token_prefix' => 'jt_'` | 1 min |
| SEC-007 | Validation direction tri (deja OK) | `ApplicationController.php:49-55` | Documenter la validation existante | 5 min |

---

## 1.5 Bonnes pratiques identifiees

- Authorization via Policies (`$this->authorize()`) sur toutes les actions CRUD
- Scoping automatique par `$request->user()->applications()` (protection IDOR)
- Validation via Form Requests avec enums stricts
- Rate limiting sur login/register (`throttle:5,1`)
- SQL parametre (placeholders `?` dans `whereRaw`, `selectRaw` statiques)
- Pagination avec limite maximale (`min($perPage, 100)`)
- Sort whitelist (`$allowedSorts`) + direction forcee `asc`/`desc`
- Sanitisation recherche (echappement `%` et `_`)
- Hash automatique du mot de passe (cast `'password' => 'hashed'`, Bcrypt 12 rounds)
- `$hidden = ['password', 'remember_token']` sur User
- Session JSON serialization (empeche deserialisation PHP gadget chain)
- Token extension en `chrome.storage.session` (volatil)
- IIFE dans content scripts (isolation de scope)
- `.env` exclu de git
- Aucun `dangerouslySetInnerHTML` dans le frontend React
- Aucun `exec()`, `shell_exec()`, `system()`, `eval()`, `unserialize()` dans le backend

---

# 2. AUDIT RGPD / GDPR

**Constat majeur** : La documentation RGPD (`docs/ARCHITECTURE-RGPD-SECURITY.md`) est tres complete et bien pensee, mais **quasi rien n'est implemente dans le code**.

## 2.1 Donnees personnelles identifiees

### Table `users`
| Champ | Type | Sensibilite |
|-------|------|-------------|
| `email` | Directement identifiante | Eleve |
| `first_name` | Directement identifiante | Eleve |
| `last_name` | Directement identifiante | Eleve |
| `password` (hache) | Authentification | Critique |
| `google_id` | Identifiant tiers | Moyen |
| `linkedin_id` | Identifiant tiers | Moyen |
| `avatar_url` | Donnee de profil | Faible |

### Table `sessions`
| Champ | Type | Sensibilite |
|-------|------|-------------|
| `ip_address` | Indirectement identifiante | Moyen |
| `user_agent` | Indirectement identifiante | Faible |

### Table `applications`
| Champ | Type | Sensibilite |
|-------|------|-------------|
| `notes` | Donnee personnelle libre | Moyen |
| `description` | Contenu scrape | Faible |

### Table `application_events`
| Champ | Type | Sensibilite |
|-------|------|-------------|
| `metadata` (JSON) | Variable | Moyen (contenu non controle) |

### Chrome Extension
| Donnee | Stockage | Sensibilite |
|--------|----------|-------------|
| Token d'authentification | `chrome.storage.session` | Critique |
| Donnees scrapees | Memoire puis API | Faible |
| Preferences sites actifs | `chrome.storage.local` | Faible |

---

## 2.2 Elements BLOQUANTS (avant production)

### B01 -- Absence de Politique de Confidentialite

- **Obligation** : Articles 13 et 14 du RGPD
- **Constat** : Aucune page `/privacy` ou `/politique-de-confidentialite` dans le frontend ni le backend.
- **Correction** : Creer une page complete (identite du responsable, donnees collectees, bases legales, durees de conservation, droits des utilisateurs, coordonnees, droit de reclamation CNIL). Accessible depuis le footer.
- **Effort** : 4-6h

### B02 -- Absence de Mentions Legales

- **Obligation** : Article 6 de la LCEN (loi francaise)
- **Constat** : Aucune page `/mentions-legales`.
- **Correction** : Creer une page avec identite editeur, hebergeur, directeur de publication, email de contact.
- **Effort** : 2h

### B03 -- Absence de Consentement a l'Inscription

- **Constat** : Le formulaire d'inscription (`frontend/src/components/auth/AuthModal.tsx:123-220`) ne comporte aucune checkbox de consentement CGU/politique de confidentialite. Le backend (`RegisterRequest.php`) n'a pas de champ `accept_terms`.
- **Correction** :
  1. Ajouter 2 checkboxes obligatoires au formulaire d'inscription
  2. Ajouter validation backend `'accept_terms' => ['required', 'accepted']`
  3. Enregistrer la preuve du consentement
- **Effort** : 4h

### B04 -- Absence de Droit a l'Effacement (Article 17)

- **Constat** : Aucun mecanisme de suppression de compte. Pas d'endpoint `DELETE /user/account`, pas de `SoftDeletes` sur User, pas de bouton dans l'interface.
- **Correction** :
  1. Ajouter `SoftDeletes` sur le modele User
  2. Creer `UserController` avec methode de suppression
  3. Job Laravel de suppression definitive apres 30 jours de grace
  4. Page "Mon compte" dans le frontend avec bouton de suppression
- **Effort** : 8-12h

### B05 -- Absence de Droit d'Acces et de Portabilite (Articles 15 et 20)

- **Constat** : Aucun endpoint d'export de donnees personnelles.
- **Correction** : Creer `GET /api/user/data-export` retournant un JSON complet (profil, candidatures, evenements, consentements). Bouton "Exporter mes donnees" dans la page profil.
- **Effort** : 4-6h

### B06 -- Registre des Traitements non formalise (Article 30)

- **Constat** : Ebauche dans `docs/ARCHITECTURE-RGPD-SECURITY.md` (section 2.10) mais pas formalise (pas de date, responsable, DPO, mesures techniques detaillees).
- **Correction** : Formaliser selon le modele CNIL avec finalite, categories de personnes/donnees, destinataires, transferts hors UE, delais de suppression, mesures de securite.
- **Effort** : 3-4h

### B07 -- IP et User Agent stockes sans base legale claire

- **Localisation** : `backend/database/migrations/0001_01_01_000000_create_users_table.php:30-37`
- **Constat** : La table `sessions` stocke `ip_address` et `user_agent` sans information a l'utilisateur. Le champ `metadata` (JSON) dans `application_events` pourrait contenir des donnees non controlees.
- **Correction** : Documenter dans la politique de confidentialite (base legale "interet legitime"), definir une duree de retention, valider le contenu de `metadata`.
- **Effort** : 2-3h

### B08 -- Table user_consents absente

- **Localisation** : `docs/ARCHITECTURE-RGPD-SECURITY.md:74-87` (decrite mais jamais creee)
- **Constat** : Aucune migration pour `user_consents`. Impossible d'enregistrer la preuve de consentement.
- **Correction** : Creer migration, modele `UserConsent`, et service `ConsentService`.
- **Effort** : 3-4h

### B09 -- Aucune duree de conservation implementee

- **Obligation** : Article 5.1.e RGPD (limitation de la conservation)
- **Constat** : Donnees conservees indefiniment. Aucune commande Artisan de nettoyage, aucun job de purge.
- **Correction** :
  1. Commande `users:cleanup-inactive` (comptes inactifs > 2 ans)
  2. Commande de purge des sessions expirees
  3. Commande de purge des tokens Sanctum expires
  4. Programmer dans le Scheduler Laravel
- **Effort** : 6-8h

### B10 -- Extension : Politique de confidentialite Chrome Web Store absente

- **Localisation** : `extension/manifest.json`
- **Constat** : Le Chrome Web Store exige une politique de confidentialite pour chaque extension publiee. Aucune n'existe. Pas de `content_security_policy` dans le manifest.
- **Correction** : Creer une politique de confidentialite hebergee, completer le manifest.
- **Effort** : 3-4h

### B11 -- Extension : Scraping automatique sans action utilisateur

- **Localisation** : `extension/content/content.js:131-133`, `extension/background/background.js:79-87`
- **Constat** : Le content script envoie automatiquement `URL_CHANGED` au chargement, le background scrape automatiquement. La documentation prevoyait un scraping declenche par clic.
- **Correction** (2 options) :
  1. **(Recommande)** Modifier pour scraping sur clic explicite de l'utilisateur
  2. Documenter le comportement et obtenir le consentement au premier usage
- **Effort** : 4-6h

---

## 2.3 Elements IMPORTANTS (a planifier rapidement)

| ID | Probleme | Localisation | Effort |
|----|----------|-------------|--------|
| I01 | Token JWT dans localStorage (vulnerable XSS) | `frontend/src/stores/authStore.ts` | 8-12h |
| I02 | Absence de headers de securite | `backend/bootstrap/app.php` | 2-3h |
| I03 | Absence de configuration CORS | `backend/config/` | 1-2h |
| I04 | Sessions non chiffrees (`SESSION_ENCRYPT=false`) | `backend/.env.example:33` | 15 min |
| I05 | Cookie de session non securise | `backend/config/session.php:172` | 15 min |
| I06 | Extension : token transmis en HTTP | `extension/utils/api.js:3` | 2-3h |
| I07 | Pas de rate limiting sur endpoints authentifies | `backend/routes/api.php` | 1h |
| I08 | Extension : permission `tabs` potentiellement excessive | `extension/manifest.json:6` | 2-4h |

---

## 2.4 Elements MINEURS

| ID | Probleme | Correction | Effort |
|----|----------|------------|--------|
| M01 | Mot de passe min 8 (OWASP recommande 12) | Augmenter + complexite | 2h |
| M02 | Bcrypt au lieu d'Argon2id | Configurer `config/hashing.php` | 30 min |
| M03 | Notes/description non chiffrees | Cast `encrypted` sur Application | 30 min |
| M04 | Logs en mode debug | `LOG_LEVEL=warning` en production | 15 min |
| M05 | Pas de page profil utilisateur | Creer page avec modif infos, export, suppression | 8-12h |

---

## 2.5 Checklist RGPD

### Information et transparence

| Item | Statut |
|------|--------|
| Politique de confidentialite accessible | ABSENT |
| Mentions legales | ABSENT |
| Information sur les donnees collectees | ABSENT |
| Information sur les droits des utilisateurs | ABSENT |
| Coordonnees du responsable de traitement | ABSENT |
| Droit de reclamation CNIL | ABSENT |

### Consentement

| Item | Statut |
|------|--------|
| Consentement explicite a l'inscription | ABSENT |
| Preuve de consentement enregistree | ABSENT |
| Possibilite de retirer le consentement | ABSENT |
| Banniere cookies (si cookies non essentiels) | N/A (pas de cookies analytics) |

### Droits des personnes

| Item | Statut |
|------|--------|
| Droit d'acces -- export donnees (art. 15) | ABSENT |
| Droit de rectification (art. 16) | ABSENT (pas de page profil) |
| Droit a l'effacement (art. 17) | ABSENT |
| Droit a la portabilite (art. 20) | ABSENT |
| Droit d'opposition (art. 21) | ABSENT |
| Droit a la limitation (art. 18) | ABSENT |

### Securite des donnees

| Item | Statut |
|------|--------|
| HTTPS en production | NON CONFIGURE |
| Chiffrement au repos (champs sensibles) | NON CONFIGURE |
| Headers de securite | ABSENT |
| Cookie securise | NON CONFIGURE |
| Sessions chiffrees | NON (`SESSION_ENCRYPT=false`) |
| Rate limiting API | PARTIEL (auth seulement) |
| CORS configure | ABSENT |

### Conservation

| Item | Statut |
|------|--------|
| Durees definies | Documentation uniquement |
| Purge automatique | ABSENT |
| Soft delete pour comptes | ABSENT |

---

# 3. AUDIT SEO

**Note** : JobTracker est un **dashboard prive** derriere authentification. Le SEO classique (indexation, rich snippets, link building) n'est **pas pertinent**. L'audit se concentre sur ce qui est reellement utile.

## 3.1 Corrections BLOQUANTES

### SEO-001 -- `<title>frontend</title>` (titre par defaut Vite)

- **Localisation** : `frontend/index.html`
- **Description** : Le titre de la page est le nom par defaut genere par Vite.
- **Correction** : Remplacer par `<title>JobTracker</title>`
- **Effort** : 1 min

### SEO-002 -- `lang="en"` au lieu de `"fr"`

- **Localisation** : `frontend/index.html`
- **Description** : L'application est entierement en francais mais le `<html lang="en">` indique l'anglais.
- **Correction** : `<html lang="fr">`
- **Effort** : 1 min

### SEO-003 -- Aucune directive noindex

- **Localisation** : `frontend/index.html`
- **Description** : Aucune balise `<meta name="robots">`. Le `robots.txt` backend autorise tout. Les pages privees risquent d'etre indexees.
- **Correction** :
```html
<meta name="robots" content="noindex, nofollow" />
```
- **Effort** : 1 min

### SEO-004 -- Aucune `<meta name="description">`

- **Localisation** : `frontend/index.html`
- **Correction** : `<meta name="description" content="JobTracker - Tableau de bord de suivi de candidatures" />`
- **Effort** : 1 min

### SEO-005 -- robots.txt mal configures

- **Localisation** : `backend/public/robots.txt` (trop permissif), `frontend/public/robots.txt` (absent)
- **Correction** :
```
# backend/public/robots.txt
User-agent: *
Disallow: /api/

# frontend/public/robots.txt
User-agent: *
Disallow: /dashboard/
Allow: /
```
- **Effort** : 5 min

### SEO-006 -- HTTPS non configure

- **Localisation** : `backend/.env` (`APP_URL=http://localhost`)
- **Correction** : `.env` production : `APP_URL=https://mondomaine.com`, `SESSION_SECURE_COOKIE=true`. Ajouter `URL::forceScheme('https')` en production.
- **Effort** : 15 min

### SEO-007 -- Compression gzip/brotli absente

- **Description** : Sans compression, les utilisateurs telechargeront ~1.1 Mo de JS brut.
- **Correction** : Configurer la compression sur le serveur web (nginx `gzip on;`) ou ajouter `vite-plugin-compression`.
- **Effort** : 10 min

---

## 3.2 Corrections `index.html` recommandees

Le fichier `frontend/index.html` actuel :
```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
```

Devrait devenir :
```html
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="JobTracker - Tableau de bord de suivi de candidatures" />
    <meta name="theme-color" content="#863bff" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>JobTracker</title>
  </head>
```

---

## 3.3 Ameliorations recommandees

| # | Action | Effort | Priorite |
|---|--------|--------|----------|
| 1 | Titre dynamique par page (hook `useDocumentTitle`) | 20 min | Moyenne |
| 2 | Optimiser code splitting Vite (`manualChunks`) | 30 min | Moyenne |
| 3 | Hierarchie H1/H2 correcte dans les pages | 15 min | Moyenne |
| 4 | Headers HTTP securite (`X-Frame-Options`, etc.) | 15 min | Moyenne |
| 5 | Balises Open Graph minimales | 5 min | Basse |
| 6 | Preload font Geist | 5 min | Basse |
| 7 | Web App Manifest (PWA-ready) | 15 min | Basse |

---

## 3.4 Non pertinent pour ce projet

| Element | Raison |
|---------|--------|
| SSR / Pre-rendering | Aucune page publique a indexer |
| sitemap.xml | Rien a lister |
| Donnees structurees Schema.org | Contenu prive |
| Canonical URLs | Pas de contenu duplique |
| hreflang | Application monolingue |

---

## 3.5 Performance du build actuel

| Fichier | Taille |
|---------|--------|
| `index-*.js` (chunk principal) | ~385 Ko |
| `StatsView-*.js` (recharts inclus) | ~375 Ko |
| `react-*.js` (chunk React) | ~86 Ko |
| `fr-*.js` (date-fns locale) | ~73 Ko |
| `select-*.js` | ~71 Ko |
| `KanbanView-*.js` | ~46 Ko |
| `index-*.css` | ~57 Ko |
| **Total JS** | **~1.1 Mo** (non compresse) |

Points positifs : les 4 pages principales sont lazy-loaded via `React.lazy()`, infinite scroll via `react-intersection-observer`.

---

# 4. PLAN D'ACTION CONSOLIDE

## Phase 1 -- Quick wins securite + SEO (~2h)

| # | Action | Domaine | Effort |
|---|--------|---------|--------|
| 1 | `APP_DEBUG=false` dans `.env.example` | Securite | 5 min |
| 2 | Regenerer `APP_KEY` si exposee | Securite | 5 min |
| 3 | Publier `config/cors.php` avec whitelist | Securite | 15 min |
| 4 | Creer middleware `SecurityHeaders` | Securite | 30 min |
| 5 | Corriger `index.html` (title, lang, robots, description) | SEO | 5 min |
| 6 | Creer/corriger `robots.txt` frontend + backend | SEO | 5 min |
| 7 | `SESSION_ENCRYPT=true` + `SESSION_SECURE_COOKIE=true` | Securite | 1 min |
| 8 | Valider `from_date`/`to_date` | Securite | 10 min |
| 9 | `$this->authorize()` sur timeline/stats | Securite | 5 min |
| 10 | Rate limiting routes authentifiees | Securite | 5 min |
| 11 | Password policy renforcee | Securite | 10 min |
| 12 | Prefix token Sanctum `jt_` | Securite | 1 min |
| 13 | `$guarded` sur Application | Securite | 5 min |
| 14 | Limite taille description/notes | Securite | 5 min |

## Phase 2 -- RGPD obligatoire (~35-42h)

| # | Action | Effort |
|---|--------|--------|
| 1 | Politique de confidentialite + mentions legales | 6-8h |
| 2 | Checkboxes consentement inscription + table `user_consents` | 6-8h |
| 3 | Page profil (modification infos, changement mdp) | 8-12h |
| 4 | Suppression de compte (SoftDeletes + job purge) | 8-12h |
| 5 | Export de donnees (endpoint + bouton frontend) | 4-6h |
| 6 | Jobs de purge automatique (sessions, tokens, comptes inactifs) | 6-8h |
| 7 | Formaliser registre des traitements | 3-4h |
| 8 | Politique de confidentialite extension Chrome Web Store | 3-4h |
| 9 | Corriger scraping automatique de l'extension | 4-6h |

## Phase 3 -- Hardening + optimisations (~8h)

| # | Action | Effort |
|---|--------|--------|
| 1 | Logging evenements securite (login, echecs, actions sensibles) | 1h |
| 2 | Migration token localStorage vers cookies HttpOnly | 2-4h |
| 3 | Reduction expiration Sanctum (24h) | 5 min |
| 4 | Optimisation Vite (manualChunks, compression) | 30 min |
| 5 | CSP extension Chrome + URL configurable | 30 min |
| 6 | Titre dynamique par page | 20 min |
| 7 | `Object.defineProperty` sur fonctions globales extension | 45 min |

---

# 5. TESTS MANQUANTS

Aucun test automatise n'a ete detecte dans le projet :
- Pas de tests PHPUnit backend
- Pas de tests Jest/Vitest frontend
- Pas de tests E2E

Cela constitue un risque additionnel pour la production. A minima, des tests sur les endpoints critiques (auth, CRUD, authorization) et les composants cles (formulaires, modals) sont recommandes.

---

# 6. ANNEXES

## Fichiers audites

### Backend
- `app/Http/Controllers/ApplicationController.php`
- `app/Http/Controllers/AuthController.php`
- `app/Http/Requests/Auth/RegisterRequest.php`
- `app/Http/Requests/StoreApplicationRequest.php`
- `app/Http/Requests/UpdateApplicationRequest.php`
- `app/Http/Requests/UpdateApplicationStatusRequest.php`
- `app/Models/User.php`
- `app/Models/Application.php`
- `app/Policies/ApplicationPolicy.php`
- `app/Providers/AppServiceProvider.php`
- `routes/api.php`
- `config/sanctum.php`
- `config/session.php`
- `bootstrap/app.php`
- `bootstrap/providers.php`
- `database/migrations/*`
- `.env` et `.env.example`

### Frontend
- `index.html`
- `vite.config.ts`
- `src/App.tsx`
- `src/services/api.ts`
- `src/stores/authStore.ts`
- `src/stores/applicationStore.ts`
- `src/components/auth/AuthModal.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/pages/KanbanView.tsx`
- `src/pages/ListView.tsx`
- `src/pages/TimelineView.tsx`
- `src/pages/StatsView.tsx`

### Extension Chrome
- `manifest.json`
- `utils/api.js`
- `content/content.js`
- `content/scrapers/helpers.js`
- `content/scrapers/linkedin.js`
- `content/scrapers/indeed.js`
- `content/scrapers/hellowork.js`
- `background/background.js`
- `popup/popup.js`

## Outils utilises
- Analyse statique du code source (grep, read)
- Verification git (fichiers trackes, .gitignore)
- Analyse des dependances (composer.lock, package.json)
- Analyse du build (dist/assets/)
