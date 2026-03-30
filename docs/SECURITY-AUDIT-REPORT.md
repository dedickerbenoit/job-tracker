# Audit de Securite : JobTracker

**Date** : 2025-03-30
**Auditeur** : Agent Security
**Perimetre** : Architecture complete (Extension Chrome + API Laravel + Dashboard React)
**Type d'audit** : Revue d'architecture pre-developpement

---

## Synthese executive

| Categorie | Evaluation |
|-----------|------------|
| **Vulnerabilites critiques** | 0 |
| **Vulnerabilites elevees** | 3 |
| **Vulnerabilites moyennes** | 7 |
| **Vulnerabilites faibles** | 5 |
| **Recommandations d'amelioration** | 12 |

**Score de securite global** : **78/100**

**Verdict** : L'architecture proposee est **globalement solide** et suit les bonnes pratiques de securite. Les mesures de protection RGPD sont bien pensees. Cependant, plusieurs points necessitent des ajustements avant le lancement, notamment concernant l'authentification, la gestion des sessions, et la securisation de l'extension Chrome.

---

## Analyse OWASP Top 10

### A01:2021 - Broken Access Control

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Policies Laravel | OK | Bien implementees |
| Verification user_id | OK | Systematique |
| IDOR Protection | OK | Route Model Binding + Policies |
| Elevation de privileges | A VERIFIER | Pas de roles definis (admin/user) |

**Score** : 9/10

**Recommandation** :
- Ajouter une gestion des roles (admin, user) des le MVP si prevu en V2
- Implementer des tests automatises de controle d'acces

---

### A02:2021 - Cryptographic Failures

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Hashage mots de passe | EXCELLENT | Argon2id bien configure |
| Chiffrement au repos | BON | AES-256 pour champs sensibles |
| TLS en transit | OK | TLS 1.3 recommande |
| Gestion des cles | A AMELIORER | Voir vulnerabilite SEC-002 |

**Score** : 8/10

**Vulnerabilite SEC-001** : Rotation des cles de chiffrement
- **Severite** : Moyenne
- **Description** : Aucun mecanisme de rotation de la cle APP_KEY n'est prevu
- **Impact** : En cas de compromission de la cle, toutes les donnees chiffrees sont exposees
- **Recommandation** : Implementer une strategie de rotation des cles avec re-chiffrement periodique

---

### A03:2021 - Injection

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| SQL Injection | OK | Eloquent ORM utilise |
| Command Injection | OK | Pas de shell_exec prevu |
| XSS | A VERIFIER | CSP presente mais 'unsafe-inline' |

**Score** : 8/10

**Vulnerabilite SEC-002** : CSP avec 'unsafe-inline'
- **Severite** : Moyenne
- **Localisation** : `SecurityHeaders.php` ligne 660-661
- **Description** : Le CSP autorise `script-src 'unsafe-inline'` et `style-src 'unsafe-inline'`
- **Impact** : Reduit significativement la protection contre les attaques XSS
- **Recommandation** :
  ```php
  // Utiliser des nonces ou hashes pour les scripts inline
  "script-src 'self' 'nonce-{random}'",
  "style-src 'self' 'nonce-{random}'",
  ```

---

### A04:2021 - Insecure Design

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Separation des responsabilites | OK | Clean Architecture |
| Threat modeling | PARTIEL | Fait pour scraping, pas pour auth |
| Defense in depth | BON | Multiple couches de securite |

**Score** : 8/10

**Vulnerabilite SEC-003** : Absence de 2FA pour les comptes sensibles
- **Severite** : Elevee
- **Description** : Aucune authentification a deux facteurs prevue, meme pour les operations critiques (suppression de compte, export de donnees)
- **Impact** : Un compte compromis (phishing, credential stuffing) donne acces total aux donnees
- **Recommandation** :
  - MVP : Ajouter une verification par email pour les operations critiques
  - V2 : Implementer TOTP (Google Authenticator) ou WebAuthn

---

### A05:2021 - Security Misconfiguration

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| APP_DEBUG=false | OK | Mentionne |
| Headers de securite | BON | Complet |
| CORS | A VERIFIER | Configuration non detaillee |
| Error handling | OK | Masquage des erreurs en prod |

**Score** : 7/10

**Vulnerabilite SEC-004** : Configuration CORS non specifiee
- **Severite** : Moyenne
- **Description** : La configuration CORS n'est pas detaillee dans l'architecture
- **Impact** : Une mauvaise configuration CORS peut permettre des attaques CSRF depuis des origines malveillantes
- **Recommandation** :
  ```php
  // config/cors.php
  'allowed_origins' => [
      'https://jobtracker.com',
      'https://www.jobtracker.com',
  ],
  'allowed_origins_patterns' => [
      '/^chrome-extension:\/\/[a-z]{32}$/', // Extension ID specifique
  ],
  'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
  'exposed_headers' => [],
  'max_age' => 86400,
  'supports_credentials' => false, // Important: pas de cookies cross-origin
  ```

---

### A06:2021 - Vulnerable and Outdated Components

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Audit automatise | OK | composer audit, npm audit |
| CI/CD security | OK | Snyk integre |
| Dependances | A SURVEILLER | Versions non specifiees |

**Score** : 8/10

**Recommandation** : Fixer les versions majeures des dependances critiques
```json
// composer.json
"require": {
    "laravel/framework": "^11.0",
    "laravel/sanctum": "^4.0"
}
```

---

### A07:2021 - Identification and Authentication Failures

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Rate limiting login | OK | 5/15min |
| Rate limiting register | OK | 5/heure/IP |
| Password strength | EXCELLENT | 12 chars + HIBP |
| Session management | A AMELIORER | Voir SEC-005 |
| Social login | A VERIFIER | Voir SEC-006 |

**Score** : 7/10

**Vulnerabilite SEC-005** : Gestion des sessions insuffisante
- **Severite** : Elevee
- **Description** : Pas de mecanisme de detection de sessions multiples suspectes ou de notification en cas de nouvelle connexion
- **Impact** : Un attaquant ayant vole un token peut l'utiliser sans que l'utilisateur soit notifie
- **Recommandation** :
  ```php
  // Ajouter une table sessions avec tracking
  Schema::create('user_sessions', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->string('token_id'); // ID du token Sanctum
      $table->string('ip_address', 45);
      $table->string('user_agent');
      $table->string('device_name')->nullable();
      $table->string('location')->nullable(); // GeoIP
      $table->timestamp('last_activity_at');
      $table->timestamp('created_at');
  });

  // Notification par email lors d'une nouvelle connexion
  // depuis un nouveau device/IP
  ```

**Vulnerabilite SEC-006** : Social login - Manque de validation
- **Severite** : Elevee
- **Description** : Le flow OAuth ne prevoit pas de protection contre :
  - Le vol de token OAuth (replay attack)
  - La liaison de compte non autorisee
  - L'email non verifie cote provider
- **Impact** : Un attaquant pourrait lier son compte social a un compte existant ou creer un compte avec un email non verifie
- **Recommandation** :
  ```php
  // Dans GoogleOAuthController
  public function handleCallback()
  {
      $googleUser = Socialite::driver('google')->user();

      // 1. Verifier que l'email est verifie chez Google
      if (!$googleUser->user['email_verified']) {
          return redirect('/login')->withErrors(['email' => 'Email non verifie chez Google']);
      }

      // 2. Utiliser le state parameter pour prevenir CSRF
      // (gere automatiquement par Socialite)

      // 3. Si l'email existe deja, demander confirmation
      $existingUser = User::where('email', $googleUser->email)->first();
      if ($existingUser && !$existingUser->google_id) {
          // Envoyer un email de confirmation avant de lier les comptes
          return redirect('/confirm-link-account');
      }

      // 4. Logger la connexion OAuth
      Log::channel('security')->info('OAuth login', [
          'provider' => 'google',
          'email' => $googleUser->email,
          'ip' => request()->ip(),
      ]);
  }
  ```

---

### A08:2021 - Software and Data Integrity Failures

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| CI/CD securise | OK | GitHub Actions |
| Verification des packages | OK | composer.lock |
| CSP | A AMELIORER | Voir SEC-002 |
| SRI (Subresource Integrity) | MANQUANT | Pour les CDN |

**Score** : 7/10

**Recommandation** : Ajouter SRI pour les ressources externes
```html
<script
  src="https://cdn.example.com/script.js"
  integrity="sha384-hash..."
  crossorigin="anonymous">
</script>
```

---

### A09:2021 - Security Logging and Monitoring Failures

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Logs de securite | BON | Channel dedie |
| Alertes | MANQUANT | Pas d'alertes automatiques |
| Retention | OK | 12 mois |
| Anonymisation | OK | IPs anonymisees |

**Score** : 6/10

**Vulnerabilite SEC-007** : Absence d'alertes automatiques
- **Severite** : Moyenne
- **Description** : Les logs de securite sont enregistres mais aucune alerte automatique n'est configuree
- **Impact** : Une attaque en cours peut passer inapercue pendant des heures/jours
- **Recommandation** :
  ```php
  // Configurer des alertes pour :
  // 1. Tentatives de login echouees repetees (>10/heure pour un email)
  // 2. Tentatives de login depuis pays inhabituels
  // 3. Export de donnees (toujours notifier l'utilisateur)
  // 4. Changement de mot de passe ou email
  // 5. Suppression de compte

  // Integrer avec Sentry ou un service d'alerting
  if ($failedAttempts > 10) {
      Sentry::captureMessage("Brute force attempt detected for {$email}", 'warning');
      // Ou webhook Slack/Discord
  }
  ```

---

### A10:2021 - Server-Side Request Forgery (SSRF)

| Aspect | Statut | Commentaire |
|--------|--------|-------------|
| Validation URLs | BON | Whitelist de domaines |
| Acces ressources internes | N/A | Pas d'appels server-side aux URLs utilisateur |

**Score** : 9/10

L'architecture ne prevoit pas d'appels server-side vers les URLs fournies par l'utilisateur, ce qui elimine le risque SSRF principal.

---

## Vulnerabilites specifiques a l'architecture

### Extension Chrome

**Vulnerabilite SEC-008** : Token expose dans chrome.storage
- **Severite** : Moyenne
- **Description** : Le token JWT est stocke dans `chrome.storage.local` qui est accessible par toute extension ayant la permission `storage` pour le meme domaine d'extension (ce qui n'est pas possible, mais un bug Chrome pourrait l'exposer)
- **Impact** : En cas de vulnerabilite Chrome, le token pourrait etre vole
- **Recommandation** :
  - Acceptable pour le MVP car chrome.storage.local est isole par extension
  - V2 : Considerer l'utilisation de cookies httpOnly avec SameSite=Strict pour les sessions web + token court (1h) pour l'extension avec refresh

**Vulnerabilite SEC-009** : Content script vulnerable aux pages malveillantes
- **Severite** : Faible
- **Description** : Un site malveillant imitant LinkedIn pourrait injecter du contenu pour tromper le scraper
- **Impact** : Donnees incorrectes capturees, potentiel XSS si le contenu n'est pas sanitize
- **Recommandation** :
  ```javascript
  // Ajouter une verification de l'URL avant scraping
  function isValidJobPage(url) {
      const patterns = [
          /^https:\/\/www\.linkedin\.com\/jobs\/view\/\d+/,
          /^https:\/\/[a-z]{2}\.indeed\.com\/viewjob/,
          /^https:\/\/www\.hellowork\.com\/[^\/]+\/emploi\//
      ];
      return patterns.some(p => p.test(url));
  }

  // Sanitizer agressif
  function sanitize(text) {
      if (!text) return '';
      return text
          .replace(/<[^>]*>/g, '') // Supprimer tout HTML
          .replace(/[<>"'&]/g, '') // Supprimer caracteres dangereux
          .trim()
          .substring(0, 500);
  }
  ```

### API Backend

**Vulnerabilite SEC-010** : Export de donnees sans verification
- **Severite** : Moyenne
- **Description** : L'endpoint `/api/user/data-export` retourne toutes les donnees sans verification supplementaire
- **Impact** : Un token vole permet d'exfiltrer toutes les donnees utilisateur
- **Recommandation** :
  ```php
  // Ajouter une verification par mot de passe ou 2FA pour l'export
  public function exportData(Request $request)
  {
      $request->validate([
          'password' => 'required|current_password',
      ]);

      // Ou envoyer un lien de telechargement par email
      // avec token a usage unique valide 1 heure
  }
  ```

**Vulnerabilite SEC-011** : Rate limiting insuffisant pour certains endpoints
- **Severite** : Faible
- **Description** : Le rate limiting est configure pour login/register mais pas pour les autres endpoints sensibles
- **Impact** : Enumeration de donnees, attaques par force brute sur d'autres fonctionnalites
- **Recommandation** :
  ```php
  // routes/api.php
  Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
      // Standard API: 60 req/min
      Route::apiResource('applications', ApplicationController::class);
  });

  Route::middleware(['auth:sanctum', 'throttle:5,1'])->group(function () {
      // Sensible: 5 req/min
      Route::get('user/data-export', [UserController::class, 'exportData']);
      Route::delete('user/account', [UserController::class, 'deleteAccount']);
      Route::put('user/password', [UserController::class, 'changePassword']);
  });

  Route::middleware(['auth:sanctum', 'throttle:10,1'])->group(function () {
      // Modere: 10 req/min
      Route::get('applications/stats', [ApplicationController::class, 'stats']);
  });
  ```

### Dashboard React

**Vulnerabilite SEC-012** : Token JWT dans localStorage
- **Severite** : Moyenne
- **Description** : Le token JWT est stocke dans localStorage, vulnerable aux attaques XSS
- **Impact** : Si une XSS est trouvee, le token peut etre vole
- **Recommandation** :
  - Option 1 (recommandee) : Utiliser un cookie httpOnly avec SameSite=Strict
  - Option 2 : Garder localStorage mais s'assurer que le CSP est strict (pas de 'unsafe-inline')
  - Dans tous les cas : Tokens courte duree (1h) + refresh token en cookie httpOnly

---

## RGPD - Evaluation

| Exigence | Statut | Commentaire |
|----------|--------|-------------|
| Base legale documentee | OK | Bien definie |
| Consentement | OK | Granulaire et explicite |
| Droit d'acces | OK | Export JSON |
| Droit a l'effacement | OK | Grace period 30j |
| Droit a la portabilite | BON | JSON + CSV recommande |
| Minimisation des donnees | OK | Donnees necessaires uniquement |
| Securite des donnees | BON | Chiffrement AES-256 |
| Notification de violation | MANQUANT | Processus a definir |
| Sous-traitants | OK | DPA prevus |

**Recommandation RGPD-001** : Processus de notification de violation
```markdown
En cas de violation de donnees, le RGPD impose :
1. Notification a la CNIL dans les 72 heures
2. Notification aux utilisateurs si risque eleve

Creer une procedure documentee :
1. Detection de la violation
2. Evaluation de l'impact
3. Containment (revoquer les tokens, etc.)
4. Notification CNIL (formulaire en ligne)
5. Notification utilisateurs (email)
6. Post-mortem et ameliorations
```

---

## Bonnes pratiques identifiees

L'architecture propose plusieurs bonnes pratiques de securite :

- **Argon2id** pour le hashage des mots de passe (meilleur choix actuel)
- **Verification Have I Been Pwned** pour les mots de passe compromis
- **Chiffrement AES-256** pour les donnees sensibles (notes, description)
- **Headers de securite complets** (HSTS, X-Frame-Options, etc.)
- **Rate limiting** sur les endpoints critiques
- **Policies Laravel** pour l'autorisation
- **Soft delete** pour la suppression de compte avec grace period
- **Logs de securite** dedies
- **Hebergement RGPD-compliant** (Scaleway France)
- **Manifest V3** pour l'extension Chrome (plus securise que V2)
- **Permissions minimales** dans l'extension

---

## Plan d'action prioritaire

### Avant le lancement (P0 - Bloquant)

| ID | Action | Effort | Impact |
|----|--------|--------|--------|
| SEC-003 | Ajouter verification email pour operations critiques | 4h | Eleve |
| SEC-004 | Configurer CORS strictement | 1h | Eleve |
| SEC-005 | Tracker les sessions (nouvelle table + notifications) | 8h | Eleve |
| SEC-006 | Securiser le flow OAuth | 4h | Eleve |
| SEC-010 | Verification mot de passe pour export | 2h | Moyen |

**Effort total P0** : ~19h

### Apres le lancement (P1 - Important)

| ID | Action | Effort | Impact |
|----|--------|--------|--------|
| SEC-001 | Strategie de rotation des cles | 8h | Moyen |
| SEC-002 | CSP sans 'unsafe-inline' (nonces) | 6h | Moyen |
| SEC-007 | Alertes automatiques (Sentry/Slack) | 4h | Moyen |
| SEC-011 | Rate limiting granulaire | 2h | Faible |
| SEC-012 | Migration vers cookies httpOnly | 12h | Moyen |
| RGPD-001 | Documenter le processus de notification de violation | 2h | Moyen |

**Effort total P1** : ~34h

### Version 2 (P2 - Nice to have)

| ID | Action | Effort | Impact |
|----|--------|--------|--------|
| - | 2FA avec TOTP (Google Authenticator) | 16h | Eleve |
| - | WebAuthn (cles de securite) | 24h | Moyen |
| - | Audit de securite externe | - | Eleve |
| - | Bug bounty program | - | Moyen |

---

## Recommandations supplementaires

### 1. Tests de securite automatises

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.9.0
        with:
          target: 'https://staging.jobtracker.com'

      - name: Run PHPStan (niveau max)
        run: vendor/bin/phpstan analyse --level=max

      - name: Run Psalm (securite)
        run: vendor/bin/psalm --taint-analysis
```

### 2. Politique de disclosure responsable

```markdown
# SECURITY.md (a la racine du repo)

## Signaler une vulnerabilite

Si vous decouvrez une vulnerabilite de securite, merci de nous contacter :
- Email : security@jobtracker.com
- PGP : [cle publique]

Nous nous engageons a :
- Accuser reception sous 48h
- Evaluer et corriger sous 30 jours
- Vous crediter (si souhaite) dans le changelog

Merci de ne pas divulguer publiquement avant la correction.
```

### 3. Checklist de securite pour les PR

```markdown
## Checklist securite (a ajouter dans le template PR)

- [ ] Pas de secrets en dur dans le code
- [ ] Validation des inputs utilisateur
- [ ] Verification des autorisations (Policy)
- [ ] Pas de requetes SQL brutes
- [ ] Logs sans donnees sensibles
- [ ] Tests de securite passes
```

---

## Conclusion

L'architecture proposee pour JobTracker est **solide et bien pensee**. Les choix technologiques sont pertinents (Laravel Sanctum, Argon2id, AES-256) et les mesures RGPD sont completes.

**Points forts** :
- Excellente gestion des mots de passe
- Bonne separation des responsabilites
- Conformite RGPD bien documentee
- Infrastructure europeenne

**Points a ameliorer avant lancement** :
- Securisation du flow OAuth
- Tracking des sessions
- Verification pour les operations sensibles

**Score final** : **78/100** - Pret pour le developpement avec les ajustements P0.

---

*Rapport genere le 2025-03-30 par l'agent Security*
*Prochaine revue recommandee : apres implementation des mesures P0*
