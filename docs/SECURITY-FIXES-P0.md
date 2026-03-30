# JobTracker - Correctifs Securite P0

Ce document detaille les implementations des correctifs de securite prioritaires identifies lors de l'audit.

**Effort total estime** : ~19h
**Statut** : A implementer avant le lancement

---

## Table des correctifs

| ID | Correctif | Effort | Fichiers impactes |
|----|-----------|--------|-------------------|
| SEC-003 | Verification email pour operations critiques | 4h | Controllers, Notifications, Views |
| SEC-004 | Configuration CORS stricte | 1h | config/cors.php |
| SEC-005 | Tracking des sessions | 8h | Migration, Model, Middleware, Notifications |
| SEC-006 | Securisation flow OAuth | 4h | Controllers OAuth, Views |
| SEC-010 | Verification mot de passe pour export | 2h | UserController, Request |

---

# SEC-003 : Verification email pour operations critiques

## Probleme
Les operations critiques (suppression de compte, export de donnees, changement d'email) sont accessibles sans verification supplementaire.

## Solution
Envoyer un code de verification par email avant d'executer ces operations.

### 1. Migration pour les codes de verification

```php
// database/migrations/xxxx_create_verification_codes_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('code', 6); // Code a 6 chiffres
            $table->string('action', 50); // 'delete_account', 'export_data', 'change_email'
            $table->json('metadata')->nullable(); // Donnees supplementaires (nouvel email, etc.)
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'action', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
    }
};
```

### 2. Model VerificationCode

```php
// app/Models/VerificationCode.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationCode extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'code',
        'action',
        'metadata',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isValid(): bool
    {
        return $this->expires_at->isFuture() && $this->used_at === null;
    }

    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
```

### 3. Service de verification

```php
// app/Services/VerificationCodeService.php
<?php

namespace App\Services;

use App\Models\User;
use App\Models\VerificationCode;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Support\Str;

class VerificationCodeService
{
    private const CODE_LENGTH = 6;
    private const EXPIRATION_MINUTES = 15;
    private const MAX_ATTEMPTS_PER_HOUR = 5;

    public function generate(User $user, string $action, array $metadata = []): VerificationCode
    {
        // Verifier le rate limiting
        $recentCodes = VerificationCode::where('user_id', $user->id)
            ->where('action', $action)
            ->where('created_at', '>', now()->subHour())
            ->count();

        if ($recentCodes >= self::MAX_ATTEMPTS_PER_HOUR) {
            throw new \Exception('Trop de demandes de verification. Reessayez dans 1 heure.');
        }

        // Invalider les anciens codes pour cette action
        VerificationCode::where('user_id', $user->id)
            ->where('action', $action)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        // Generer un nouveau code
        $code = $this->generateCode();

        $verificationCode = VerificationCode::create([
            'user_id' => $user->id,
            'code' => $code,
            'action' => $action,
            'metadata' => $metadata,
            'expires_at' => now()->addMinutes(self::EXPIRATION_MINUTES),
        ]);

        // Envoyer le code par email
        $user->notify(new VerificationCodeNotification($code, $action));

        return $verificationCode;
    }

    public function verify(User $user, string $action, string $code): ?VerificationCode
    {
        $verificationCode = VerificationCode::where('user_id', $user->id)
            ->where('action', $action)
            ->where('code', $code)
            ->first();

        if (!$verificationCode || !$verificationCode->isValid()) {
            return null;
        }

        return $verificationCode;
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }
}
```

### 4. Notification email

```php
// app/Notifications/VerificationCodeNotification.php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerificationCodeNotification extends Notification
{
    use Queueable;

    private const ACTION_LABELS = [
        'delete_account' => 'supprimer votre compte',
        'export_data' => 'exporter vos donnees',
        'change_email' => 'modifier votre adresse email',
        'change_password' => 'modifier votre mot de passe',
    ];

    public function __construct(
        private string $code,
        private string $action
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $actionLabel = self::ACTION_LABELS[$this->action] ?? $this->action;

        return (new MailMessage)
            ->subject('Code de verification JobTracker')
            ->greeting('Bonjour ' . $notifiable->first_name . ',')
            ->line("Vous avez demande a {$actionLabel}.")
            ->line("Votre code de verification est : **{$this->code}**")
            ->line('Ce code expire dans 15 minutes.')
            ->line('Si vous n\'etes pas a l\'origine de cette demande, ignorez cet email et changez votre mot de passe.')
            ->salutation('L\'equipe JobTracker');
    }
}
```

### 5. Controller modifie pour la suppression de compte

```php
// app/Http/Controllers/Api/UserController.php

// Etape 1 : Demander la suppression (envoie le code)
public function requestAccountDeletion(Request $request)
{
    $user = $request->user();

    try {
        app(VerificationCodeService::class)->generate($user, 'delete_account');
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 429);
    }

    return response()->json([
        'message' => 'Un code de verification a ete envoye a votre adresse email.',
    ]);
}

// Etape 2 : Confirmer la suppression (avec le code)
public function confirmAccountDeletion(Request $request)
{
    $request->validate([
        'code' => 'required|string|size:6',
    ]);

    $user = $request->user();

    $verificationCode = app(VerificationCodeService::class)
        ->verify($user, 'delete_account', $request->code);

    if (!$verificationCode) {
        return response()->json([
            'message' => 'Code invalide ou expire.',
        ], 422);
    }

    // Marquer le code comme utilise
    $verificationCode->markAsUsed();

    // Proceder a la suppression
    app(AccountDeletionService::class)->requestDeletion($user);

    return response()->json([
        'message' => 'Votre compte sera supprime dans 30 jours. Un email de confirmation a ete envoye.',
    ]);
}
```

### 6. Routes API

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    // Suppression de compte en 2 etapes
    Route::post('user/account/request-deletion', [UserController::class, 'requestAccountDeletion']);
    Route::post('user/account/confirm-deletion', [UserController::class, 'confirmAccountDeletion']);

    // Export de donnees en 2 etapes
    Route::post('user/data-export/request', [UserController::class, 'requestDataExport']);
    Route::post('user/data-export/confirm', [UserController::class, 'confirmDataExport']);
});
```

---

# SEC-004 : Configuration CORS stricte

## Probleme
La configuration CORS n'etait pas specifiee dans l'architecture.

## Solution

```php
// config/cors.php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Paths that should have CORS headers
    |--------------------------------------------------------------------------
    */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    | En production, lister explicitement les origines autorisees.
    */
    'allowed_origins' => env('APP_ENV') === 'production'
        ? [
            'https://jobtracker.com',
            'https://www.jobtracker.com',
        ]
        : ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins Patterns (pour l'extension Chrome)
    |--------------------------------------------------------------------------
    | L'ID de l'extension sera connu apres publication sur le Chrome Web Store.
    | Format: chrome-extension://[32 caracteres]
    */
    'allowed_origins_patterns' => [
        '/^chrome-extension:\/\/[a-z]{32}$/',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Methods
    |--------------------------------------------------------------------------
    */
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    */
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],

    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    | Headers que le client peut lire dans la reponse.
    */
    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
    ],

    /*
    |--------------------------------------------------------------------------
    | Max Age
    |--------------------------------------------------------------------------
    | Duree de mise en cache de la reponse preflight (24h).
    */
    'max_age' => 86400,

    /*
    |--------------------------------------------------------------------------
    | Supports Credentials
    |--------------------------------------------------------------------------
    | IMPORTANT: false car on utilise des tokens Bearer, pas des cookies.
    */
    'supports_credentials' => false,
];
```

### Variables d'environnement

```env
# .env.production
CORS_ALLOWED_ORIGINS=https://jobtracker.com,https://www.jobtracker.com
```

---

# SEC-005 : Tracking des sessions

## Probleme
Pas de visibilite sur les sessions actives ni de notification lors de nouvelles connexions.

## Solution

### 1. Migration pour la table sessions

```php
// database/migrations/xxxx_create_user_sessions_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('token_id'); // ID du PersonalAccessToken
            $table->string('ip_address', 45);
            $table->text('user_agent');
            $table->string('device_type', 20)->nullable(); // 'desktop', 'mobile', 'tablet', 'extension'
            $table->string('browser', 50)->nullable();
            $table->string('os', 50)->nullable();
            $table->string('country', 2)->nullable(); // Code ISO pays
            $table->string('city', 100)->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestamp('last_activity_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'last_activity_at']);
            $table->index('token_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};
```

### 2. Model UserSession

```php
// app/Models/UserSession.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'token_id',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'os',
        'country',
        'city',
        'is_current',
        'last_activity_at',
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'last_activity_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getDeviceDescriptionAttribute(): string
    {
        $parts = array_filter([$this->browser, $this->os]);
        return implode(' sur ', $parts) ?: 'Appareil inconnu';
    }

    public function getLocationAttribute(): string
    {
        $parts = array_filter([$this->city, $this->country]);
        return implode(', ', $parts) ?: 'Localisation inconnue';
    }
}
```

### 3. Service de gestion des sessions

```php
// app/Services/SessionService.php
<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSession;
use App\Notifications\NewLoginNotification;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;

class SessionService
{
    public function createSession(User $user, int $tokenId, Request $request): UserSession
    {
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        // Detecter le type de device
        $deviceType = $this->detectDeviceType($request, $agent);

        // GeoIP (utiliser un service comme MaxMind ou ip-api.com)
        $location = $this->getLocation($request->ip());

        // Verifier si c'est une nouvelle connexion suspecte
        $isNewDevice = $this->isNewDevice($user, $request->ip(), $request->userAgent());

        $session = UserSession::create([
            'user_id' => $user->id,
            'token_id' => $tokenId,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_type' => $deviceType,
            'browser' => $agent->browser(),
            'os' => $agent->platform(),
            'country' => $location['country'] ?? null,
            'city' => $location['city'] ?? null,
            'last_activity_at' => now(),
        ]);

        // Notifier l'utilisateur si nouvelle connexion
        if ($isNewDevice) {
            $user->notify(new NewLoginNotification($session));
        }

        return $session;
    }

    public function updateActivity(int $tokenId): void
    {
        UserSession::where('token_id', $tokenId)
            ->update(['last_activity_at' => now()]);
    }

    public function revokeSession(User $user, int $sessionId): bool
    {
        $session = UserSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return false;
        }

        // Revoquer le token Sanctum associe
        $user->tokens()->where('id', $session->token_id)->delete();

        // Supprimer la session
        $session->delete();

        return true;
    }

    public function revokeAllOtherSessions(User $user, int $currentTokenId): int
    {
        $sessions = UserSession::where('user_id', $user->id)
            ->where('token_id', '!=', $currentTokenId)
            ->get();

        foreach ($sessions as $session) {
            $user->tokens()->where('id', $session->token_id)->delete();
            $session->delete();
        }

        return $sessions->count();
    }

    public function getActiveSessions(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return UserSession::where('user_id', $user->id)
            ->orderBy('last_activity_at', 'desc')
            ->get();
    }

    private function detectDeviceType(Request $request, Agent $agent): string
    {
        // Detecter si c'est l'extension Chrome
        if (str_contains($request->userAgent(), 'Chrome') &&
            $request->header('X-Extension-Id')) {
            return 'extension';
        }

        if ($agent->isTablet()) return 'tablet';
        if ($agent->isMobile()) return 'mobile';
        return 'desktop';
    }

    private function isNewDevice(User $user, string $ip, string $userAgent): bool
    {
        // Verifier si cette combinaison IP + User-Agent est deja connue
        return !UserSession::where('user_id', $user->id)
            ->where('ip_address', $ip)
            ->where('user_agent', $userAgent)
            ->exists();
    }

    private function getLocation(string $ip): array
    {
        // En dev, retourner des valeurs par defaut
        if (app()->environment('local') || $ip === '127.0.0.1') {
            return ['country' => 'FR', 'city' => 'Local'];
        }

        // Utiliser un service GeoIP (ex: ip-api.com - gratuit pour usage non commercial)
        try {
            $response = \Http::timeout(2)->get("http://ip-api.com/json/{$ip}?fields=country,countryCode,city");
            if ($response->successful()) {
                $data = $response->json();
                return [
                    'country' => $data['countryCode'] ?? null,
                    'city' => $data['city'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            // Ignorer les erreurs de geolocalisation
        }

        return [];
    }
}
```

### 4. Notification de nouvelle connexion

```php
// app/Notifications/NewLoginNotification.php
<?php

namespace App\Notifications;

use App\Models\UserSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewLoginNotification extends Notification
{
    use Queueable;

    public function __construct(
        private UserSession $session
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nouvelle connexion a votre compte JobTracker')
            ->greeting('Bonjour ' . $notifiable->first_name . ',')
            ->line('Une nouvelle connexion a ete detectee sur votre compte.')
            ->line('**Details :**')
            ->line('- Appareil : ' . $this->session->device_description)
            ->line('- Localisation : ' . $this->session->location)
            ->line('- Date : ' . $this->session->created_at->format('d/m/Y H:i'))
            ->line('- Adresse IP : ' . $this->session->ip_address)
            ->line('')
            ->line('Si vous etes a l\'origine de cette connexion, vous pouvez ignorer cet email.')
            ->action('Gerer mes sessions', url('/profile/sessions'))
            ->line('Si vous n\'etes pas a l\'origine de cette connexion, changez immediatement votre mot de passe.')
            ->salutation('L\'equipe JobTracker');
    }
}
```

### 5. Middleware pour mettre a jour l'activite

```php
// app/Http/Middleware/UpdateSessionActivity.php
<?php

namespace App\Http\Middleware;

use App\Services\SessionService;
use Closure;
use Illuminate\Http\Request;

class UpdateSessionActivity
{
    public function __construct(
        private SessionService $sessionService
    ) {}

    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Mettre a jour l'activite de la session (throttle a 1 fois par minute)
        if ($request->user() && $request->user()->currentAccessToken()) {
            $tokenId = $request->user()->currentAccessToken()->id;
            $cacheKey = "session_activity_{$tokenId}";

            if (!cache()->has($cacheKey)) {
                $this->sessionService->updateActivity($tokenId);
                cache()->put($cacheKey, true, 60); // 1 minute
            }
        }

        return $response;
    }
}
```

### 6. Controller pour gerer les sessions

```php
// app/Http/Controllers/Api/SessionController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SessionService;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(
        private SessionService $sessionService
    ) {}

    public function index(Request $request)
    {
        $sessions = $this->sessionService->getActiveSessions($request->user());
        $currentTokenId = $request->user()->currentAccessToken()->id;

        return response()->json([
            'sessions' => $sessions->map(fn($session) => [
                'id' => $session->id,
                'device' => $session->device_description,
                'location' => $session->location,
                'ip_address' => $session->ip_address,
                'last_activity' => $session->last_activity_at->diffForHumans(),
                'created_at' => $session->created_at->format('d/m/Y H:i'),
                'is_current' => $session->token_id === $currentTokenId,
            ]),
        ]);
    }

    public function destroy(Request $request, int $sessionId)
    {
        $revoked = $this->sessionService->revokeSession($request->user(), $sessionId);

        if (!$revoked) {
            return response()->json(['message' => 'Session non trouvee.'], 404);
        }

        return response()->json(['message' => 'Session revoquee.']);
    }

    public function destroyOthers(Request $request)
    {
        $currentTokenId = $request->user()->currentAccessToken()->id;
        $count = $this->sessionService->revokeAllOtherSessions($request->user(), $currentTokenId);

        return response()->json([
            'message' => "{$count} session(s) revoquee(s).",
        ]);
    }
}
```

### 7. Routes API

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user/sessions', [SessionController::class, 'index']);
    Route::delete('user/sessions/{sessionId}', [SessionController::class, 'destroy']);
    Route::delete('user/sessions', [SessionController::class, 'destroyOthers']);
});
```

### 8. Integration dans le login

```php
// app/Http/Controllers/Api/AuthController.php

public function login(LoginRequest $request)
{
    // ... validation et authentification ...

    $token = $user->createToken('auth_token', ['*'], $expiration);

    // Creer la session
    app(SessionService::class)->createSession(
        $user,
        $token->accessToken->id,
        $request
    );

    return response()->json([
        'token' => $token->plainTextToken,
        'user' => new UserResource($user),
    ]);
}
```

---

# SEC-006 : Securisation flow OAuth

## Probleme
Le flow OAuth ne verifie pas si l'email est verifie chez le provider et ne gere pas la liaison de comptes existants.

## Solution

### 1. Controller OAuth securise

```php
// app/Http/Controllers/Api/GoogleOAuthController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SessionService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleOAuthController extends Controller
{
    public function __construct(
        private TokenService $tokenService,
        private SessionService $sessionService
    ) {}

    public function redirect()
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->with(['prompt' => 'select_account']) // Toujours demander de choisir le compte
            ->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            Log::channel('security')->warning('OAuth callback failed', [
                'provider' => 'google',
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
            return redirect('/login?error=oauth_failed');
        }

        // 1. Verifier que l'email est verifie chez Google
        if (!($googleUser->user['email_verified'] ?? false)) {
            Log::channel('security')->warning('OAuth unverified email', [
                'provider' => 'google',
                'email' => $googleUser->email,
                'ip' => $request->ip(),
            ]);
            return redirect('/login?error=email_not_verified');
        }

        // 2. Chercher un utilisateur existant
        $existingUserByGoogleId = User::where('google_id', $googleUser->id)->first();
        $existingUserByEmail = User::where('email', $googleUser->email)->first();

        // Cas 1: Utilisateur deja lie a ce compte Google
        if ($existingUserByGoogleId) {
            return $this->loginUser($existingUserByGoogleId, $request);
        }

        // Cas 2: Email existe mais pas lie a Google
        if ($existingUserByEmail) {
            // Stocker temporairement les infos pour la liaison
            $linkToken = encrypt([
                'user_id' => $existingUserByEmail->id,
                'google_id' => $googleUser->id,
                'expires_at' => now()->addMinutes(10)->timestamp,
            ]);

            return redirect("/link-account?token={$linkToken}&provider=google");
        }

        // Cas 3: Nouvel utilisateur
        $user = User::create([
            'email' => $googleUser->email,
            'first_name' => $googleUser->user['given_name'] ?? null,
            'last_name' => $googleUser->user['family_name'] ?? null,
            'google_id' => $googleUser->id,
            'avatar_url' => $googleUser->avatar,
            'email_verified_at' => now(), // Verifie par Google
        ]);

        Log::channel('security')->info('OAuth new user created', [
            'provider' => 'google',
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        return $this->loginUser($user, $request);
    }

    public function linkAccount(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|current_password',
        ]);

        try {
            $data = decrypt($request->token);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token invalide.'], 422);
        }

        // Verifier l'expiration
        if ($data['expires_at'] < now()->timestamp) {
            return response()->json(['message' => 'Token expire.'], 422);
        }

        $user = User::find($data['user_id']);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouve.'], 404);
        }

        // Lier le compte Google
        $user->update(['google_id' => $data['google_id']]);

        Log::channel('security')->info('OAuth account linked', [
            'provider' => 'google',
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        return $this->loginUser($user, $request);
    }

    private function loginUser(User $user, Request $request)
    {
        $token = $this->tokenService->createToken($user);

        // Creer la session
        $this->sessionService->createSession(
            $user,
            $user->tokens()->latest()->first()->id,
            $request
        );

        Log::channel('security')->info('OAuth login success', [
            'provider' => 'google',
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        // Rediriger vers le frontend avec le token
        return redirect("/auth/callback?token={$token}");
    }
}
```

### 2. Page de liaison de compte (Frontend)

```jsx
// pages/auth/LinkAccount.jsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

export default function LinkAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const provider = searchParams.get('provider');
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/oauth/link-account', {
        token,
        password,
      });

      // Stocker le token et rediriger
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la liaison du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Lier votre compte {provider}</h1>

      <p className="mb-4 text-gray-600">
        Un compte existe deja avec cette adresse email.
        Pour le securiser, veuillez entrer votre mot de passe actuel pour lier votre compte {provider}.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verification...' : 'Lier mon compte'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Si vous n'etes pas a l'origine de cette demande,
        <a href="/login" className="text-blue-600"> annulez et connectez-vous normalement</a>.
      </p>
    </div>
  );
}
```

---

# SEC-010 : Verification mot de passe pour export

## Probleme
L'export de donnees est accessible sans verification supplementaire.

## Solution
Utiliser le meme systeme de verification par code email (SEC-003).

```php
// app/Http/Controllers/Api/UserController.php

public function requestDataExport(Request $request)
{
    $user = $request->user();

    try {
        app(VerificationCodeService::class)->generate($user, 'export_data');
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 429);
    }

    return response()->json([
        'message' => 'Un code de verification a ete envoye a votre adresse email.',
    ]);
}

public function confirmDataExport(Request $request)
{
    $request->validate([
        'code' => 'required|string|size:6',
    ]);

    $user = $request->user();

    $verificationCode = app(VerificationCodeService::class)
        ->verify($user, 'export_data', $request->code);

    if (!$verificationCode) {
        return response()->json([
            'message' => 'Code invalide ou expire.',
        ], 422);
    }

    // Marquer le code comme utilise
    $verificationCode->markAsUsed();

    // Log de l'export
    Log::channel('security')->info('Data export', [
        'user_id' => $user->id,
        'ip' => $request->ip(),
    ]);

    // Generer l'export
    $data = $this->generateExportData($user);

    return response()->json($data)
        ->header('Content-Disposition', 'attachment; filename="jobtracker-export.json"');
}

private function generateExportData(User $user): array
{
    return [
        'export_date' => now()->toISOString(),
        'format' => 'JobTracker Export v1.0',
        'user' => [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'created_at' => $user->created_at,
        ],
        'applications' => $user->applications()->get()->map(fn($app) => [
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
    ];
}
```

---

# Resume des modifications

## Nouvelles tables

1. `verification_codes` - Codes de verification pour operations sensibles
2. `user_sessions` - Tracking des sessions actives

## Nouveaux fichiers

### Models
- `app/Models/VerificationCode.php`
- `app/Models/UserSession.php`

### Services
- `app/Services/VerificationCodeService.php`
- `app/Services/SessionService.php`

### Notifications
- `app/Notifications/VerificationCodeNotification.php`
- `app/Notifications/NewLoginNotification.php`

### Controllers (modifies)
- `app/Http/Controllers/Api/UserController.php`
- `app/Http/Controllers/Api/AuthController.php`
- `app/Http/Controllers/Api/GoogleOAuthController.php`
- `app/Http/Controllers/Api/SessionController.php`

### Middleware
- `app/Http/Middleware/UpdateSessionActivity.php`

### Config
- `config/cors.php` (mise a jour)

## Packages a installer

```bash
composer require jenssegers/agent  # Detection device/browser
```

## Nouvelles routes API

```
POST   /api/user/account/request-deletion
POST   /api/user/account/confirm-deletion
POST   /api/user/data-export/request
POST   /api/user/data-export/confirm
GET    /api/user/sessions
DELETE /api/user/sessions/{sessionId}
DELETE /api/user/sessions
POST   /api/auth/oauth/link-account
```

---

*Document genere le 2025-03-30*
*A integrer avant le lancement*
