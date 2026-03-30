# JobTracker - Architecture, RGPD et Securite

## Table des matieres

1. [Architecture globale validee](#1-architecture-globale-validee)
2. [Conformite RGPD](#2-conformite-rgpd)
3. [Securisation des donnees](#3-securisation-des-donnees)
4. [Architecture de l'extension Chrome](#4-architecture-de-lextension-chrome)
5. [Legalite du scraping](#5-legalite-du-scraping)
6. [Infrastructure et services recommandes](#6-infrastructure-et-services-recommandes)
7. [Checklist de lancement](#7-checklist-de-lancement)

---

# 1. Architecture globale validee

## 1.1 Vue d'ensemble

L'architecture 3-tiers proposee est validee et appropriee pour ce projet :

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UTILISATEURS                                   │
└─────────────────────────────────────────────────────────────────────────┘
              │                                    │
              ▼                                    ▼
┌──────────────────────────┐          ┌──────────────────────────┐
│   Extension Chrome       │          │   Dashboard React        │
│   (Manifest V3)          │          │   (SPA sur Vercel)       │
│                          │          │                          │
│   - Content scripts      │          │   - SSR optionnel        │
│   - Background worker    │          │   - Code splitting       │
│   - Popup UI             │          │   - PWA ready            │
└──────────────────────────┘          └──────────────────────────┘
              │                                    │
              │            HTTPS + JWT             │
              └────────────────┬───────────────────┘
                               ▼
              ┌────────────────────────────────────┐
              │         API Laravel 11              │
              │         (PHP 8.2+ / FrankenPHP)     │
              │                                     │
              │   - REST API                        │
              │   - Sanctum Auth                    │
              │   - Rate Limiting                   │
              │   - CORS strict                     │
              └────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   PostgreSQL 15   │ │   Redis 7        │ │   S3/MinIO       │
│   (Donnees)       │ │   (Cache+Queue)  │ │   (Avatars)      │
│                   │ │                  │ │                  │
│   - Chiffre TDE   │ │   - Sessions     │ │   - Chiffre      │
│   - Backups auto  │ │   - Rate limits  │ │   - CDN          │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## 1.2 Choix techniques valides

| Composant | Choix | Justification |
|-----------|-------|---------------|
| **BDD** | PostgreSQL 15 | Meilleur que MySQL pour JSON, full-text search, et conformite RGPD (meilleur support des regulations) |
| **Cache** | Redis 7 | Standard pour Laravel, performant, supporte les queues |
| **Backend** | Laravel 11 + PHP 8.2 | Mature, securise, excellente doc, Sanctum pour l'auth API |
| **Frontend** | React 18 + Vite | Performant, ecosysteme riche, bonne DX |
| **Hosting EU** | Scaleway ou OVH | Hebergeurs europeens, conformes RGPD |

## 1.3 Ajustements recommandes

### Ajout d'une table pour le consentement RGPD

```sql
CREATE TABLE user_consents (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    consent_type VARCHAR(50) NOT NULL,  -- 'terms', 'privacy', 'marketing', 'analytics'
    version VARCHAR(20) NOT NULL,        -- Version du document accepte
    ip_address VARCHAR(45) NULL,         -- IPv4 ou IPv6
    user_agent TEXT NULL,
    consented_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_consent (user_id, consent_type)
);
```

### Ajout de champs dans la table users

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;  -- Soft delete
ALTER TABLE users ADD COLUMN anonymized_at TIMESTAMP NULL;  -- Date d'anonymisation
ALTER TABLE users ADD COLUMN data_retention_until TIMESTAMP NULL;  -- Date limite de retention
ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP NULL;  -- Derniere activite
```

---

# 2. Conformite RGPD

## 2.1 Donnees personnelles identifiees

| Categorie | Donnees | Base legale | Duree de conservation |
|-----------|---------|-------------|----------------------|
| **Identification** | email, prenom, nom | Execution du contrat | Compte actif + 3 ans |
| **Authentification** | password (hache), tokens | Execution du contrat | Compte actif |
| **Social login** | google_id, linkedin_id | Consentement | Compte actif |
| **Profil** | avatar_url | Consentement | Compte actif |
| **Candidatures** | titre, entreprise, localisation, URL, notes | Execution du contrat | Compte actif + 3 ans |
| **Technique** | IP, user_agent, logs | Interet legitime | 12 mois max |

**Classification des donnees :**
- **Donnees directement identifiantes** : email, prenom, nom
- **Donnees indirectement identifiantes** : adresse IP, user agent
- **Donnees sensibles** : AUCUNE (pas de donnees de sante, origine, religion, etc.)

## 2.2 Bases legales utilisees

| Base legale | Utilisation | Justification |
|-------------|-------------|---------------|
| **Execution du contrat** | Stockage des candidatures, authentification | Necessaire pour fournir le service |
| **Consentement** | Social login, analytics, newsletter | Optionnel, peut etre retire |
| **Interet legitime** | Logs de securite, amelioration du service | Necessaire pour la securite |

## 2.3 Gestion du consentement

### A l'inscription (obligatoire)

```javascript
// Formulaire d'inscription
const RegisterForm = () => {
  const [consents, setConsents] = useState({
    terms: false,      // Obligatoire
    privacy: false,    // Obligatoire
    marketing: false,  // Optionnel
    analytics: false   // Optionnel (pre-coche interdit!)
  });

  return (
    <form>
      {/* Champs classiques */}

      <label>
        <input type="checkbox" required checked={consents.terms} onChange={...} />
        J'accepte les <a href="/terms">Conditions Generales d'Utilisation</a> *
      </label>

      <label>
        <input type="checkbox" required checked={consents.privacy} onChange={...} />
        J'ai lu et j'accepte la <a href="/privacy">Politique de Confidentialite</a> *
      </label>

      <label>
        <input type="checkbox" checked={consents.marketing} onChange={...} />
        J'accepte de recevoir des emails d'information (optionnel)
      </label>

      <p>* Champs obligatoires</p>
    </form>
  );
};
```

### Stockage du consentement (backend)

```php
// App/Services/ConsentService.php
class ConsentService
{
    public function recordConsent(User $user, string $type, string $version): void
    {
        UserConsent::create([
            'user_id' => $user->id,
            'consent_type' => $type,
            'version' => $version,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'consented_at' => now(),
        ]);
    }

    public function revokeConsent(User $user, string $type): void
    {
        UserConsent::where('user_id', $user->id)
            ->where('consent_type', $type)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    public function hasValidConsent(User $user, string $type, string $currentVersion): bool
    {
        return UserConsent::where('user_id', $user->id)
            ->where('consent_type', $type)
            ->where('version', $currentVersion)
            ->whereNull('revoked_at')
            ->exists();
    }
}
```

## 2.4 Droit d'acces (Article 15 RGPD)

L'utilisateur peut demander une copie de toutes ses donnees.

### Endpoint API

```php
// Route: GET /api/user/data-export
// Controller: UserController@exportData

public function exportData(Request $request)
{
    $user = $request->user();

    $data = [
        'export_date' => now()->toISOString(),
        'user' => [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'created_at' => $user->created_at,
            'email_verified_at' => $user->email_verified_at,
        ],
        'applications' => $user->applications()->get()->map(fn($app) => [
            'id' => $app->id,
            'title' => $app->title,
            'company' => $app->company,
            'location' => $app->location,
            'url' => $app->url,
            'description' => $app->description,
            'source' => $app->source,
            'status' => $app->status,
            'notes' => $app->notes,
            'applied_at' => $app->applied_at,
            'created_at' => $app->created_at,
        ]),
        'events' => $user->applicationEvents()->get()->map(fn($event) => [
            'type' => $event->type,
            'description' => $event->description,
            'created_at' => $event->created_at,
        ]),
        'consents' => $user->consents()->get()->map(fn($consent) => [
            'type' => $consent->consent_type,
            'version' => $consent->version,
            'consented_at' => $consent->consented_at,
            'revoked_at' => $consent->revoked_at,
        ]),
    ];

    // Generer un fichier JSON telechargeeable
    return response()->json($data)
        ->header('Content-Disposition', 'attachment; filename="jobtracker-export.json"');
}
```

### UI Dashboard

```jsx
// pages/profile/DataExport.jsx
const DataExport = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/data-export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `jobtracker-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Exporter mes donnees</h2>
      <p>Conformement au RGPD, vous pouvez telecharger toutes vos donnees personnelles.</p>
      <button onClick={handleExport} disabled={loading}>
        {loading ? 'Export en cours...' : 'Telecharger mes donnees (JSON)'}
      </button>
    </div>
  );
};
```

## 2.5 Droit a l'effacement (Article 17 RGPD)

### Strategie : Anonymisation + Suppression differee

```php
// App/Services/AccountDeletionService.php
class AccountDeletionService
{
    public function requestDeletion(User $user): void
    {
        // 1. Marquer le compte pour suppression (soft delete)
        $user->update([
            'deleted_at' => now(),
            'data_retention_until' => now()->addDays(30), // Grace period
        ]);

        // 2. Revoquer tous les tokens
        $user->tokens()->delete();

        // 3. Envoyer un email de confirmation
        Mail::to($user->email)->send(new AccountDeletionRequestedMail($user));

        // 4. Planifier la suppression definitive
        DeleteUserPermanently::dispatch($user->id)->delay(now()->addDays(30));
    }

    public function cancelDeletion(User $user): void
    {
        if ($user->deleted_at && $user->data_retention_until > now()) {
            $user->update([
                'deleted_at' => null,
                'data_retention_until' => null,
            ]);
        }
    }

    public function deletePermanently(User $user): void
    {
        DB::transaction(function () use ($user) {
            // 1. Anonymiser les donnees pour les stats (optionnel)
            $this->anonymizeForStats($user);

            // 2. Supprimer les fichiers (avatars)
            Storage::delete($user->avatar_path);

            // 3. Supprimer toutes les donnees liees
            $user->applications()->forceDelete();
            $user->applicationEvents()->forceDelete();
            $user->consents()->forceDelete();

            // 4. Supprimer l'utilisateur
            $user->forceDelete();
        });
    }

    private function anonymizeForStats(User $user): void
    {
        // Garder des stats anonymisees si besoin
        DB::table('anonymous_stats')->insert([
            'applications_count' => $user->applications()->count(),
            'account_duration_days' => $user->created_at->diffInDays(now()),
            'created_at' => now(),
        ]);
    }
}
```

### UI de suppression

```jsx
// pages/profile/DeleteAccount.jsx
const DeleteAccount = () => {
  const [step, setStep] = useState(1);
  const [confirmation, setConfirmation] = useState('');

  const handleDelete = async () => {
    if (confirmation !== 'SUPPRIMER') return;

    await api.delete('/user/account');
    // Redirection vers page de confirmation
    navigate('/account-deleted');
  };

  return (
    <div>
      <h2>Supprimer mon compte</h2>

      {step === 1 && (
        <div>
          <p>Attention : Cette action est irreversible apres 30 jours.</p>
          <ul>
            <li>Toutes vos candidatures seront supprimees</li>
            <li>Votre historique sera efface</li>
            <li>Vous ne pourrez plus vous connecter</li>
          </ul>
          <p>Vous disposez de 30 jours pour annuler cette demande.</p>
          <button onClick={() => setStep(2)}>Je comprends, continuer</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p>Pour confirmer, tapez "SUPPRIMER" ci-dessous :</p>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="SUPPRIMER"
          />
          <button
            onClick={handleDelete}
            disabled={confirmation !== 'SUPPRIMER'}
          >
            Supprimer definitivement mon compte
          </button>
        </div>
      )}
    </div>
  );
};
```

## 2.6 Droit a la portabilite (Article 20 RGPD)

Format d'export recommande : **JSON** (standard, lisible, reimportable)

```json
{
  "format": "JobTracker Export v1.0",
  "export_date": "2025-03-30T10:30:00Z",
  "user": {
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "applications": [
    {
      "title": "Developpeur Full Stack",
      "company": "Acme Corp",
      "location": "Paris",
      "url": "https://linkedin.com/jobs/view/123",
      "status": "interview",
      "applied_at": "2025-03-15",
      "notes": "RH sympa"
    }
  ]
}
```

**Alternative CSV** : Fournir egalement une option CSV pour les utilisateurs non techniques.

## 2.7 Duree de conservation

| Donnee | Duree | Action a expiration |
|--------|-------|---------------------|
| Compte actif | Illimitee tant que actif | - |
| Compte inactif | 2 ans sans connexion | Email de relance puis suppression |
| Compte supprime | 30 jours (grace period) | Suppression definitive |
| Logs de securite | 12 mois | Suppression automatique |
| Logs applicatifs | 6 mois | Suppression automatique |
| Backups | 90 jours | Rotation automatique |

### Job Laravel de nettoyage

```php
// App/Console/Commands/CleanupInactiveAccounts.php
class CleanupInactiveAccounts extends Command
{
    protected $signature = 'users:cleanup-inactive';

    public function handle()
    {
        // 1. Utilisateurs inactifs depuis 2 ans
        $inactiveUsers = User::where('last_activity_at', '<', now()->subYears(2))
            ->whereNull('deleted_at')
            ->get();

        foreach ($inactiveUsers as $user) {
            // Envoyer un email de relance (30 jours pour se reconnecter)
            Mail::to($user->email)->send(new InactiveAccountWarningMail($user));
            $user->update(['data_retention_until' => now()->addDays(30)]);
        }

        // 2. Supprimer les comptes avec grace period expiree
        User::where('data_retention_until', '<', now())
            ->whereNotNull('deleted_at')
            ->each(fn($user) => app(AccountDeletionService::class)->deletePermanently($user));

        // 3. Nettoyer les logs anciens
        DB::table('application_events')
            ->where('created_at', '<', now()->subMonths(12))
            ->delete();
    }
}

// Scheduler (app/Console/Kernel.php)
$schedule->command('users:cleanup-inactive')->daily();
```

## 2.8 Politique de confidentialite

### Sections obligatoires

1. **Identite du responsable de traitement**
   - Nom/raison sociale
   - Adresse
   - Email de contact : privacy@jobtracker.com

2. **Donnees collectees et finalites**
   - Liste des donnees
   - Pourquoi elles sont collectees
   - Base legale pour chaque traitement

3. **Destinataires des donnees**
   - Sous-traitants (hebergeur, analytics)
   - Pas de vente a des tiers

4. **Transferts hors UE**
   - Si applicable, mentionner les garanties (clauses contractuelles types)

5. **Duree de conservation**
   - Par type de donnee

6. **Droits de l'utilisateur**
   - Acces, rectification, effacement, portabilite
   - Comment les exercer
   - Droit de reclamation aupres de la CNIL

7. **Cookies et traceurs**
   - Liste des cookies utilises
   - Finalite de chaque cookie
   - Comment les refuser

8. **Securite**
   - Mesures de protection mises en place

9. **Modifications de la politique**
   - Comment l'utilisateur sera informe

## 2.9 DPO (Data Protection Officer)

**Pour JobTracker : DPO NON OBLIGATOIRE**

Raisons :
- Pas une autorite publique
- Pas de traitement a grande echelle de donnees sensibles
- Pas de suivi systematique a grande echelle

**Recommandation** : Nommer un responsable interne de la protection des donnees (meme si pas obligatoire) pour gerer les demandes RGPD.

## 2.10 Registre des traitements

| Finalite | Categories de donnees | Base legale | Destinataires | Duree | Mesures de securite |
|----------|----------------------|-------------|---------------|-------|---------------------|
| Gestion des comptes utilisateurs | email, nom, prenom, password | Execution contrat | Hebergeur | Compte actif + 3 ans | Chiffrement, acces restreint |
| Suivi des candidatures | titre, entreprise, notes | Execution contrat | Hebergeur | Compte actif + 3 ans | Chiffrement, acces utilisateur uniquement |
| Analytics | IP anonymisee, pages vues | Interet legitime | Plausible (EU) | 12 mois | Anonymisation |
| Securite | IP, logs erreurs | Interet legitime | Sentry (EU) | 12 mois | Retention limitee |

## 2.11 Sous-traitants RGPD

| Sous-traitant | Service | Localisation | Donnees traitees | DPA signe |
|---------------|---------|--------------|------------------|-----------|
| Scaleway | Hebergement BDD | France | Toutes | Oui |
| Vercel | Hebergement frontend | EU (Frankfurt) | Logs HTTP | Oui |
| Plausible | Analytics | EU | IP anonymisee | Oui |
| Sentry | Monitoring erreurs | EU | Logs erreurs | Oui |
| Postmark | Emails transactionnels | US (clauses types) | Email | Oui |

**Exigence** : Signer un DPA (Data Processing Agreement) avec chaque sous-traitant.

---

# 3. Securisation des donnees

## 3.1 Chiffrement au repos

### Base de donnees PostgreSQL

```bash
# postgresql.conf - Activer TDE (Transparent Data Encryption)
# Note: TDE natif disponible dans PostgreSQL Enterprise ou via extensions

# Alternative recommandee : chiffrement au niveau disque
# Scaleway/OVH proposent des volumes chiffres par defaut
```

### Chiffrement applicatif des donnees sensibles

```php
// config/app.php
'cipher' => 'AES-256-CBC',

// Model User - Chiffrement automatique
class User extends Model
{
    protected $casts = [
        'notes' => 'encrypted', // Chiffrement Laravel natif
    ];
}

// Pour les candidatures (notes personnelles)
class Application extends Model
{
    protected $casts = [
        'notes' => 'encrypted',
        'description' => 'encrypted',
    ];
}
```

### Stockage des fichiers (avatars)

```php
// config/filesystems.php
'avatars' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'eu-west-3'),
    'bucket' => env('AWS_BUCKET'),
    'encryption' => 'AES256', // Server-side encryption
],
```

## 3.2 Chiffrement en transit

### Configuration HTTPS (Laravel)

```php
// app/Http/Middleware/ForceHttps.php
class ForceHttps
{
    public function handle($request, Closure $next)
    {
        if (!$request->secure() && app()->environment('production')) {
            return redirect()->secure($request->getRequestUri());
        }
        return $next($request);
    }
}

// config/session.php
'secure' => env('SESSION_SECURE_COOKIE', true),
'same_site' => 'lax',
```

### Headers de securite

```php
// app/Http/Middleware/SecurityHeaders.php
class SecurityHeaders
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        return $response
            ->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('X-Frame-Options', 'DENY')
            ->header('X-XSS-Protection', '1; mode=block')
            ->header('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
            ->header('Content-Security-Policy', $this->getCSP());
    }

    private function getCSP(): string
    {
        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'", // Ajuster selon les besoins
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' https://api.jobtracker.com",
            "frame-ancestors 'none'",
        ]);
    }
}
```

## 3.3 Hashage des mots de passe

### Configuration recommandee

```php
// config/hashing.php
'driver' => 'argon2id', // Plus securise que bcrypt

'argon' => [
    'memory' => 65536,  // 64 MB
    'threads' => 4,
    'time' => 4,
],
```

**Pourquoi Argon2id ?**
- Resistant aux attaques GPU (memory-hard)
- Resistant aux side-channel attacks
- Recommande par OWASP

### Validation de la force du mot de passe

```php
// App/Rules/StrongPassword.php
class StrongPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Minimum 12 caracteres (OWASP recommande 8, mais 12 est mieux)
        if (strlen($value) < 12) {
            $fail('Le mot de passe doit contenir au moins 12 caracteres.');
        }

        // Au moins une majuscule, une minuscule, un chiffre
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', $value)) {
            $fail('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.');
        }

        // Verifier les mots de passe compromis (Have I Been Pwned)
        if ($this->isCompromised($value)) {
            $fail('Ce mot de passe a ete compromis dans une fuite de donnees. Choisissez-en un autre.');
        }
    }

    private function isCompromised(string $password): bool
    {
        $hash = strtoupper(sha1($password));
        $prefix = substr($hash, 0, 5);
        $suffix = substr($hash, 5);

        $response = Http::get("https://api.pwnedpasswords.com/range/{$prefix}");

        return str_contains($response->body(), $suffix);
    }
}
```

## 3.4 Gestion des tokens JWT

### Configuration Laravel Sanctum

```php
// config/sanctum.php
'expiration' => 60 * 24, // 24 heures par defaut
'remember_me_expiration' => 60 * 24 * 30, // 30 jours si "remember me"

// Token abilities (permissions)
'abilities' => [
    'read' => 'Lecture des donnees',
    'write' => 'Modification des donnees',
    'delete' => 'Suppression des donnees',
],
```

### Rotation et revocation des tokens

```php
// App/Services/TokenService.php
class TokenService
{
    // Creer un token avec expiration
    public function createToken(User $user, bool $rememberMe = false): string
    {
        // Revoquer les anciens tokens (limite a 5 devices)
        $tokens = $user->tokens()->orderBy('created_at', 'desc')->get();
        if ($tokens->count() >= 5) {
            $tokens->slice(4)->each->delete();
        }

        $expiration = $rememberMe
            ? now()->addDays(30)
            : now()->addHours(24);

        return $user->createToken(
            'auth_token',
            ['read', 'write', 'delete'],
            $expiration
        )->plainTextToken;
    }

    // Revoquer tous les tokens (logout global)
    public function revokeAllTokens(User $user): void
    {
        $user->tokens()->delete();
    }

    // Revoquer un token specifique
    public function revokeToken(User $user, int $tokenId): void
    {
        $user->tokens()->where('id', $tokenId)->delete();
    }
}
```

### Refresh token pattern

```php
// Route: POST /api/auth/refresh
public function refreshToken(Request $request)
{
    $user = $request->user();

    // Revoquer l'ancien token
    $request->user()->currentAccessToken()->delete();

    // Creer un nouveau token
    $newToken = app(TokenService::class)->createToken($user);

    return response()->json(['token' => $newToken]);
}
```

## 3.5 Protection OWASP Top 10

### A01:2021 - Broken Access Control

```php
// Policies Laravel pour chaque ressource
class ApplicationPolicy
{
    public function view(User $user, Application $application): bool
    {
        return $user->id === $application->user_id;
    }

    public function update(User $user, Application $application): bool
    {
        return $user->id === $application->user_id;
    }

    public function delete(User $user, Application $application): bool
    {
        return $user->id === $application->user_id;
    }
}

// Controller avec autorisation
public function show(Application $application)
{
    $this->authorize('view', $application);
    return new ApplicationResource($application);
}
```

### A02:2021 - Cryptographic Failures

- Argon2id pour les mots de passe
- AES-256 pour le chiffrement applicatif
- TLS 1.3 pour le transit
- Pas de secrets en clair dans le code

### A03:2021 - Injection

```php
// Toujours utiliser Eloquent ou Query Builder (jamais de SQL brut)
// BON
$applications = Application::where('user_id', $userId)
    ->where('status', $status)
    ->get();

// MAUVAIS (vulnerable SQL injection)
// $applications = DB::select("SELECT * FROM applications WHERE user_id = $userId");
```

### A04:2021 - Insecure Design

- Validation systematique des entrees
- Principes de moindre privilege
- Separation des responsabilites

### A05:2021 - Security Misconfiguration

```php
// .env.production
APP_DEBUG=false
APP_ENV=production
LOG_LEVEL=warning

// Masquer les erreurs detaillees
// config/app.php
'debug' => env('APP_DEBUG', false),
```

### A06:2021 - Vulnerable Components

```bash
# Verifier les vulnerabilites des dependances
composer audit
npm audit

# CI/CD : integrer ces checks
```

### A07:2021 - Authentication Failures

- Rate limiting sur login (5 tentatives / 15 min)
- Rate limiting sur register (5 / heure / IP)
- Verification email
- 2FA recommande en V2

```php
// Rate limiting
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->email);
});
```

### A08:2021 - Software and Data Integrity

- Verification des signatures des packages
- CI/CD securise
- CSP headers

### A09:2021 - Security Logging and Monitoring

```php
// Logging des evenements de securite
class SecurityLogger
{
    public function logFailedLogin(string $email, string $ip): void
    {
        Log::channel('security')->warning('Failed login attempt', [
            'email' => $email,
            'ip' => $ip,
            'timestamp' => now(),
        ]);
    }

    public function logPasswordReset(User $user): void
    {
        Log::channel('security')->info('Password reset', [
            'user_id' => $user->id,
            'timestamp' => now(),
        ]);
    }

    public function logAccountDeletion(User $user): void
    {
        Log::channel('security')->info('Account deletion requested', [
            'user_id' => $user->id,
            'email' => $user->email,
            'timestamp' => now(),
        ]);
    }
}
```

### A10:2021 - Server-Side Request Forgery (SSRF)

```php
// Validation des URLs (pour les offres d'emploi)
class StoreApplicationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'url' => [
                'required',
                'url',
                function ($attribute, $value, $fail) {
                    $allowedDomains = [
                        'linkedin.com',
                        'www.linkedin.com',
                        'indeed.com',
                        'fr.indeed.com',
                        'hellowork.com',
                        'www.hellowork.com',
                    ];

                    $host = parse_url($value, PHP_URL_HOST);

                    if (!in_array($host, $allowedDomains) && !str_ends_with($host, '.indeed.com')) {
                        // Autoriser les URLs manuelles mais les valider
                        if (!filter_var($value, FILTER_VALIDATE_URL)) {
                            $fail('URL invalide.');
                        }
                    }
                },
            ],
        ];
    }
}
```

## 3.6 Audit de securite

### Quand effectuer un audit ?

| Phase | Type d'audit | Frequence |
|-------|--------------|-----------|
| Avant lancement | Pentest complet | 1 fois |
| Post-lancement | Scan automatise | Mensuel |
| Apres changement majeur | Audit cible | A chaque release majeure |
| Annuel | Audit externe complet | 1 fois / an |

### Outils recommandes

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 0'  # Chaque dimanche
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: PHP Security Checker
        run: composer audit

      - name: NPM Audit
        run: npm audit

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main

      - name: Snyk Security Scan
        uses: snyk/actions/php@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## 3.7 Backup et Disaster Recovery

### Strategie de backup

```yaml
# Backup quotidien de la BDD
backup:
  database:
    frequency: daily
    retention: 90 days
    encryption: AES-256
    location: S3 bucket (region differente)

  files:
    frequency: daily
    retention: 30 days
    location: S3 bucket

  full_snapshot:
    frequency: weekly
    retention: 12 weeks
```

### Script de backup automatise

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups"
S3_BUCKET="s3://jobtracker-backups"

# Backup PostgreSQL
pg_dump -h localhost -U jobtracker jobtracker_db | gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz

# Chiffrer le backup
openssl enc -aes-256-cbc -salt -in ${BACKUP_DIR}/db_${DATE}.sql.gz \
  -out ${BACKUP_DIR}/db_${DATE}.sql.gz.enc -pass file:/etc/backup-password

# Upload vers S3
aws s3 cp ${BACKUP_DIR}/db_${DATE}.sql.gz.enc ${S3_BUCKET}/database/

# Supprimer les backups locaux > 7 jours
find ${BACKUP_DIR} -name "*.enc" -mtime +7 -delete

# Verifier l'integrite (tester la restauration)
./scripts/verify-backup.sh ${DATE}
```

### Plan de reprise d'activite (PRA)

| Scenario | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|----------|-------------------------------|--------------------------------|
| Panne serveur | 15 minutes | 0 (failover auto) |
| Corruption BDD | 1 heure | 24 heures (dernier backup) |
| Panne datacenter | 4 heures | 24 heures |
| Attaque ransomware | 24 heures | 24 heures (backup hors-ligne) |

## 3.8 Logs et monitoring securise

### Configuration des logs

```php
// config/logging.php
'channels' => [
    'security' => [
        'driver' => 'daily',
        'path' => storage_path('logs/security.log'),
        'level' => 'info',
        'days' => 365, // 1 an de retention
    ],

    'audit' => [
        'driver' => 'daily',
        'path' => storage_path('logs/audit.log'),
        'level' => 'info',
        'days' => 365,
    ],
],
```

### Anonymisation des logs

```php
// Ne jamais logger de donnees sensibles
Log::info('User logged in', [
    'user_id' => $user->id,
    'ip' => $request->ip(),
    // NE PAS LOGGER: email, password, tokens
]);

// Anonymiser les IPs dans les logs publics
function anonymizeIp(string $ip): string
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        return preg_replace('/\.\d+$/', '.xxx', $ip);
    }
    return preg_replace('/:[^:]+$/', ':xxxx', $ip);
}
```

---

# 4. Architecture de l'extension Chrome

## 4.1 Securisation de la communication Extension <-> API

### Manifest V3 - Permissions minimales

```json
{
  "permissions": [
    "storage",      // Stocker le token
    "activeTab"     // Acceder a l'onglet actif uniquement
  ],
  "host_permissions": [
    "https://www.linkedin.com/jobs/*",
    "https://*.indeed.com/*viewjob*",
    "https://www.hellowork.com/*/emploi/*",
    "https://api.jobtracker.com/*"
  ]
}
```

### Validation de l'origine des messages

```javascript
// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Verifier que le message vient d'un content script autorise
  const allowedOrigins = [
    'https://www.linkedin.com',
    'https://fr.indeed.com',
    'https://www.indeed.com',
    'https://www.hellowork.com'
  ];

  if (!sender.tab || !allowedOrigins.some(origin => sender.tab.url.startsWith(origin))) {
    console.error('Message from unauthorized origin');
    return false;
  }

  // Traiter le message
  handleMessage(message, sender, sendResponse);
  return true;
});
```

### Communication securisee avec l'API

```javascript
// utils/api.js
class SecureAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getToken() {
    const { token } = await chrome.storage.local.get('token');
    return token;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expire, nettoyer et demander reconnexion
      await chrome.storage.local.remove('token');
      throw new Error('Token expired');
    }

    return response.json();
  }

  async createApplication(data) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new SecureAPI('https://api.jobtracker.com/api');
```

## 4.2 Stockage securise du token

```javascript
// utils/storage.js
class SecureStorage {
  // Le token est stocke dans chrome.storage.local
  // qui est isole par extension et chiffre par Chrome

  async setToken(token) {
    await chrome.storage.local.set({
      token,
      tokenCreatedAt: Date.now()
    });
  }

  async getToken() {
    const { token, tokenCreatedAt } = await chrome.storage.local.get(['token', 'tokenCreatedAt']);

    // Verifier si le token n'est pas trop vieux (24h)
    if (tokenCreatedAt && Date.now() - tokenCreatedAt > 24 * 60 * 60 * 1000) {
      await this.clearToken();
      return null;
    }

    return token;
  }

  async clearToken() {
    await chrome.storage.local.remove(['token', 'tokenCreatedAt', 'user']);
  }

  async setUser(user) {
    // Ne stocker que les infos non sensibles
    await chrome.storage.local.set({
      user: {
        id: user.id,
        firstName: user.first_name,
        email: user.email // Pour l'affichage uniquement
      }
    });
  }
}

export const storage = new SecureStorage();
```

## 4.3 Risques specifiques aux extensions

| Risque | Impact | Mitigation |
|--------|--------|------------|
| XSS dans le content script | Eleve | Utiliser textContent, jamais innerHTML |
| Vol de token par une autre extension | Moyen | chrome.storage est isole par extension |
| Man-in-the-middle | Eleve | HTTPS obligatoire, certificate pinning optionnel |
| Injection de code malveillant | Eleve | CSP strict, pas d'eval() |
| Phishing via popup | Moyen | Design reconnaissable, indicateur de connexion |

### Content Security Policy pour l'extension

```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Protection XSS dans les content scripts

```javascript
// content/scrapers/linkedin.js
export function scrapeLinkedIn() {
  // TOUJOURS utiliser textContent, JAMAIS innerHTML
  const title = document.querySelector('.top-card-layout__title');

  return {
    title: title?.textContent?.trim() || '',
    // Sanitizer les donnees avant de les envoyer
    company: sanitize(document.querySelector('.topcard__org-name-link')?.textContent),
    location: sanitize(document.querySelector('.topcard__flavor--bullet')?.textContent),
  };
}

function sanitize(text) {
  if (!text) return '';
  // Supprimer les caracteres de controle et normaliser
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 1000); // Limiter la taille
}
```

---

# 5. Legalite du scraping

## 5.1 Analyse juridique

### Ce qui est LEGAL

| Action | Legalite | Justification |
|--------|----------|---------------|
| Lire le contenu d'une page publique | Legal | Donnees publiquement accessibles |
| Extraire des infos avec action utilisateur | Legal | L'utilisateur initie l'action |
| Stocker les donnees pour usage personnel | Legal | Usage prive |
| Afficher les donnees dans une app tierce | Legal | Pas de reproduction massive |

### Ce qui est ILLEGAL ou RISQUE

| Action | Legalite | Risque |
|--------|----------|--------|
| Scraping automatise massif | Illegal | Violation des CGU, acces frauduleux |
| Contourner les protections (captcha, rate limit) | Illegal | Acces frauduleux (article 323-1 Code Penal) |
| Revendre les donnees | Illegal | Violation RGPD, droit des bases de donnees |
| Collecter sans consentement | Illegal | Violation RGPD |

## 5.2 Protections juridiques pour JobTracker

### 1. Action manuelle obligatoire

```javascript
// L'utilisateur doit CLIQUER pour declencher le scraping
// Pas de scraping automatique en arriere-plan

chrome.action.onClicked.addListener((tab) => {
  // Seulement quand l'utilisateur clique sur l'icone
  chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' });
});
```

### 2. Pas de stockage des donnees tierces

```
On stocke :
✅ Titre du poste (texte)
✅ Nom de l'entreprise (texte)
✅ Localisation (texte)
✅ URL de l'offre (lien public)

On NE stocke PAS :
❌ Profil du recruteur
❌ Emails / contacts
❌ Donnees privees de LinkedIn/Indeed
```

### 3. Mention dans les CGU

```markdown
## 5. Utilisation de l'extension

L'extension JobTracker vous permet de sauvegarder manuellement les informations
d'offres d'emploi que vous consultez sur des sites tiers (LinkedIn, Indeed, HelloWork).

- L'extension ne collecte aucune donnee sans votre action explicite (clic)
- Les donnees extraites sont des informations publiques des offres d'emploi
- Vous etes responsable du respect des CGU des sites tiers

JobTracker n'est pas affilie a LinkedIn, Indeed ou HelloWork.
```

### 4. Respect des fichiers robots.txt

```javascript
// Note: Les pages d'offres sont generalement accessibles
// Mais verifier que l'URL n'est pas dans robots.txt

async function checkRobotsTxt(url) {
  const { origin } = new URL(url);
  const robotsUrl = `${origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl);
    const text = await response.text();
    // Parser et verifier (simplification)
    // En realite, les pages d'offres sont autorisees
  } catch {
    // Continuer si robots.txt inaccessible
  }
}
```

## 5.3 Risques et mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Lettre de cease & desist | Faible | Moyen | CGU claires, pas de scraping massif |
| Blocage de l'extension | Faible | Eleve | Architecture resiliente, fallback manuel |
| Action en justice | Tres faible | Eleve | Consultation juridique, assurance RC Pro |
| Changement des selecteurs | Haute | Faible | Monitoring, mise a jour rapide |

### Recommandations

1. **Consulter un avocat** specialise en droit du numerique avant le lancement
2. **Souscrire une assurance RC Pro** pour les risques lies a l'activite
3. **Documenter le consentement** de l'utilisateur a chaque action
4. **Limiter la frequence** des requetes (rate limiting cote extension)

---

# 6. Infrastructure et services recommandes

## 6.1 Options d'hebergement

### Option 1 : Scaleway (Recommandee)

| Service | Specification | Prix mensuel |
|---------|--------------|--------------|
| **Compute** | DEV1-S (2 vCPU, 2GB RAM) | ~7 EUR |
| **Database** | PostgreSQL Basic (1 vCPU, 2GB RAM, 20GB) | ~15 EUR |
| **Redis** | Managed Redis S (1GB) | ~10 EUR |
| **Object Storage** | 50GB | ~2 EUR |
| **Load Balancer** | LB-S | ~10 EUR |
| **TOTAL** | | **~44 EUR/mois** |

**Avantages** :
- Hebergeur francais, 100% RGPD compliant
- Datacenters en France
- Support en francais
- Prix competitifs

### Option 2 : OVH Cloud

| Service | Specification | Prix mensuel |
|---------|--------------|--------------|
| **VPS** | Starter (2 vCPU, 4GB RAM) | ~12 EUR |
| **Database** | MySQL Essential | ~12 EUR |
| **Object Storage** | 100GB | ~3 EUR |
| **TOTAL** | | **~27 EUR/mois** |

**Avantages** :
- Moins cher
- Francais, RGPD compliant

**Inconvenients** :
- Interface moins moderne
- Pas de Redis manage (a installer sur le VPS)

### Option 3 : Vercel + PlanetScale + Upstash

| Service | Specification | Prix mensuel |
|---------|--------------|--------------|
| **Frontend** | Vercel Pro | ~20 USD |
| **Database** | PlanetScale Scaler | ~29 USD |
| **Redis** | Upstash Pro | ~10 USD |
| **TOTAL** | | **~59 USD/mois** |

**Avantages** :
- DX excellente
- Scaling automatique

**Inconvenients** :
- Plus cher
- Serveurs US (attention RGPD)

## 6.2 Recommandation finale

**Pour le MVP : Scaleway** avec la configuration suivante :

```
┌─────────────────────────────────────────────────────────┐
│                      SCALEWAY                            │
│                    (Paris - PAR1)                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐      ┌─────────────────────────┐     │
│   │  Frontend   │      │       Backend           │     │
│   │  (Vercel)   │─────►│  DEV1-S (FrankenPHP)    │     │
│   │  Frankfurt  │      │  + Redis (local)        │     │
│   └─────────────┘      └───────────┬─────────────┘     │
│                                    │                   │
│                        ┌───────────▼─────────────┐     │
│                        │     PostgreSQL          │     │
│                        │     (Managed)           │     │
│                        └─────────────────────────┘     │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │            Object Storage (S3)               │      │
│   │            (Avatars, Backups)                │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘

+ Vercel (Frankfurt) pour le frontend React
+ Chrome Web Store pour l'extension
```

## 6.3 Services tiers recommandes

| Service | Recommandation | Prix | Justification RGPD |
|---------|----------------|------|-------------------|
| **Analytics** | Plausible | 9 EUR/mois | EU, pas de cookies |
| **Error tracking** | Sentry (EU) | Gratuit (5K events) | Serveurs EU disponibles |
| **Email transactionnel** | Postmark | 10 USD/mois | DPA disponible |
| **Monitoring** | Better Uptime | Gratuit | EU |
| **CI/CD** | GitHub Actions | Gratuit | - |
| **DNS** | Cloudflare | Gratuit | DPA disponible |

## 6.4 Estimation des couts (MVP)

| Poste | Mensuel | Annuel |
|-------|---------|--------|
| Infrastructure Scaleway | 44 EUR | 528 EUR |
| Vercel Pro (frontend) | 0 EUR (gratuit hobby) | 0 EUR |
| Domaine (.com) | 1 EUR | 12 EUR |
| Plausible Analytics | 9 EUR | 108 EUR |
| Postmark (emails) | 10 EUR | 120 EUR |
| **TOTAL** | **~64 EUR** | **~768 EUR** |

**Note** : Ces couts sont pour un MVP avec ~100-500 utilisateurs. Ajuster selon la croissance.

---

# 7. Checklist de lancement

## 7.1 Avant le developpement

- [ ] Definir la structure des 3 repos Git
- [ ] Configurer les environnements (dev, staging, prod)
- [ ] Rediger la politique de confidentialite
- [ ] Rediger les CGU
- [ ] Consulter un avocat (optionnel mais recommande)

## 7.2 Securite

- [ ] HTTPS configure et force
- [ ] Headers de securite actives
- [ ] Rate limiting configure
- [ ] CORS configure strictement
- [ ] Validation des entrees sur tous les endpoints
- [ ] Hashage Argon2id pour les mots de passe
- [ ] Tokens JWT avec expiration
- [ ] Policies d'autorisation sur toutes les ressources
- [ ] Audit des dependances (composer audit, npm audit)
- [ ] CSP configure

## 7.3 RGPD

- [ ] Banniere de consentement cookies (si cookies non essentiels)
- [ ] Checkbox consentement a l'inscription
- [ ] Page "Politique de confidentialite" accessible
- [ ] Page "CGU" accessible
- [ ] Fonctionnalite d'export des donnees
- [ ] Fonctionnalite de suppression de compte
- [ ] Registre des traitements redige
- [ ] DPA signes avec tous les sous-traitants
- [ ] Email de contact RGPD visible (privacy@jobtracker.com)

## 7.4 Infrastructure

- [ ] Serveurs en Europe (France de preference)
- [ ] Backups automatises et testes
- [ ] Monitoring configure (uptime, erreurs)
- [ ] Logs centralises et anonymises
- [ ] Plan de reprise d'activite documente
- [ ] SSL/TLS avec certificat valide
- [ ] DNS configure avec TTL bas pour le lancement

## 7.5 Extension Chrome

- [ ] Manifest V3 avec permissions minimales
- [ ] CSP configure dans le manifest
- [ ] Tests sur Chrome et Edge
- [ ] Icons en differentes tailles
- [ ] Description et screenshots pour le Chrome Web Store
- [ ] Politique de confidentialite specifique a l'extension

## 7.6 Tests

- [ ] Tests unitaires backend (couverture > 80%)
- [ ] Tests unitaires frontend (couverture > 70%)
- [ ] Tests E2E des parcours critiques
- [ ] Tests de charge (100 utilisateurs simultanes)
- [ ] Tests de securite (OWASP ZAP ou equivalent)
- [ ] Tests de l'extension sur differents sites
- [ ] Tests de performance (Lighthouse > 90)

## 7.7 Documentation

- [ ] README.md dans chaque repo
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Guide d'installation pour les contributeurs
- [ ] Changelog
- [ ] Guide utilisateur (optionnel pour MVP)

## 7.8 Lancement

- [ ] Environnement de production deploye
- [ ] Smoke tests en production
- [ ] Backups verifies
- [ ] Monitoring actif
- [ ] Plan de communication pret
- [ ] Extension soumise au Chrome Web Store (delai: 1-3 jours)

---

# Annexes

## A. Modele de DPA (Data Processing Agreement)

A telecharger et faire signer par chaque sous-traitant :
- Template CNIL : https://www.cnil.fr/fr/sous-traitance-exemple-de-clauses

## B. Modele de registre des traitements

- Template CNIL : https://www.cnil.fr/fr/RGDP-le-registre-des-activites-de-traitement

## C. Resources RGPD

- CNIL : https://www.cnil.fr/
- RGPD Texte officiel : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32016R0679
- Guide OWASP : https://owasp.org/www-project-top-ten/

---

*Document genere le 2025-03-30 par l'agent Architecte*
*Version 1.0*
