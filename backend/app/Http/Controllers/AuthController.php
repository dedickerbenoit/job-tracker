<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Models\UserConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        // Record RGPD consents
        $now = now();
        foreach (['terms', 'privacy'] as $type) {
            UserConsent::create([
                'user_id' => $user->id,
                'consent_type' => $type,
                'consented_at' => $now,
                'ip_address' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
            ]);
        }

        // Support both SPA mode (session cookies) and token mode (Chrome extension)
        // If request wants a token (X-Request-Token header), return a token
        // Otherwise, use session authentication (SPA mode)
        $wantsToken = $request->header('X-Request-Token') === 'true';

        Log::info('User registered', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
            'auth_mode' => $wantsToken ? 'token' : 'session',
        ]);

        $data = [
            'user' => $user->only('id', 'first_name', 'last_name', 'email', 'avatar_url'),
        ];

        if ($wantsToken) {
            $data['token'] = $user->createToken('auth')->plainTextToken;
        } else {
            // Log in the user for session-based auth
            Auth::login($user);
        }

        return response()->json(['data' => $data], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Per-email rate limiting to mitigate distributed brute-force attacks
        // (complements the IP-based throttle:5,1 middleware on the route)
        $throttleKey = 'login:'.Str::lower($validated['email']);

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            Log::warning('Login locked out by email', ['email' => $validated['email'], 'ip' => $request->ip()]);

            return response()->json([
                'message' => "Trop de tentatives. Reessayez dans {$seconds} secondes.",
                'errors' => ['email' => ["Trop de tentatives. Reessayez dans {$seconds} secondes."]],
            ], 429);
        }

        // Support both SPA mode (session cookies) and token mode (Chrome extension)
        // In token mode we explicitly avoid Auth::attempt() so that no session
        // cookie is set on the browser. Otherwise the extension's login would
        // leak a laravel-session cookie for localhost, which the dashboard SPA
        // would then send back with its cross-tab requests — Sanctum would
        // resolve the user via session instead of the Bearer handoff token,
        // breaking the handoff flow with a 403 "without handoff ability".
        $wantsToken = $request->header('X-Request-Token') === 'true';

        $authenticated = $wantsToken
            ? Auth::once($validated)
            : Auth::attempt($validated);

        if (! $authenticated) {
            RateLimiter::hit($throttleKey, 60);
            Log::warning('Failed login attempt', ['email' => $validated['email'], 'ip' => $request->ip()]);

            return response()->json([
                'message' => 'Identifiants invalides',
                'errors' => ['email' => ['Identifiants invalides']],
            ], 422);
        }

        RateLimiter::clear($throttleKey);

        $user = Auth::user();

        Log::info('Successful login', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
            'auth_mode' => $wantsToken ? 'token' : 'session',
        ]);

        $data = [
            'user' => $user->only('id', 'first_name', 'last_name', 'email', 'avatar_url'),
        ];

        if ($wantsToken) {
            $data['token'] = $user->createToken('auth')->plainTextToken;
        }
        // In session mode, the session is established by Auth::attempt()

        return response()->json(['data' => $data]);
    }

    public function logout(Request $request): JsonResponse
    {
        Log::info('User logout', ['user_id' => $request->user()->id, 'ip' => $request->ip()]);

        // Support both SPA mode (session) and token mode (Chrome extension)
        // If authenticated via token, delete the token
        // If authenticated via session, logout from session
        if ($request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        } else {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(null, 204);
    }

    /**
     * Create a short-lived (60s) one-shot token with 'handoff' ability.
     * Used by the Chrome extension to securely hand off auth to the dashboard
     * without exposing the main access token in URL parameters.
     */
    public function createHandoffToken(Request $request): JsonResponse
    {
        $user = $request->user();

        $token = $user->createToken(
            'handoff',
            ['handoff'],
            now()->addMinute(),
        )->plainTextToken;

        Log::info('Handoff token created', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
            'token_abilities' => ['handoff'],
            'expires_in_seconds' => 60,
        ]);

        return response()->json([
            'data' => ['token' => $token],
        ]);
    }

    /**
     * Exchange a valid handoff token for a session cookie.
     *
     * This route is intentionally NOT under the 'auth:sanctum' middleware: it
     * must authenticate a brand-new SPA session solely from a Bearer token,
     * and we want full control over the resolution logic (a stale session
     * cookie on the same host would otherwise make Sanctum's guard return a
     * TransientToken with wildcard abilities, silently bypassing the
     * 'handoff' ability check).
     *
     * We therefore:
     *   1. explicitly log out any pre-existing web session cookie,
     *   2. resolve the Bearer token directly from the Authorization header,
     *   3. verify it has exactly the 'handoff' ability (no wildcard, no extras),
     *   4. log the user in via the web guard and regenerate the CSRF token,
     *   5. delete the token (one-shot pattern) so it cannot be reused.
     */
    public function tokenLogin(Request $request): JsonResponse
    {
        // Expel any stale session cookie that may have bled over from the
        // extension (session-mode login) before authenticating the new user.
        // Guarded: session middleware only runs for stateful requests
        // (matching SANCTUM_STATEFUL_DOMAINS) and may be absent in tests
        // or non-SPA callers.
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
        }

        $bearer = $request->bearerToken();
        if (! $bearer) {
            abort(401, 'Missing bearer token');
        }

        $accessToken = PersonalAccessToken::findToken($bearer);

        if (! $accessToken || ($accessToken->expires_at && $accessToken->expires_at->isPast())) {
            abort(401, 'Invalid or expired token');
        }

        // Strict ability check: the token must carry EXACTLY one ability,
        // 'handoff'. Rejecting wildcard tokens ('*') and any extra ability
        // prevents a regular auth token from being used as a handoff token.
        $abilities = $accessToken->abilities ?? [];
        if (count($abilities) !== 1 || ! in_array('handoff', $abilities, true)) {
            Log::warning('Token-login attempted without handoff ability', [
                'user_id' => $accessToken->tokenable_id,
                'ip' => $request->ip(),
                'abilities' => $abilities,
            ]);
            abort(403, 'Token not allowed for handoff');
        }

        /** @var User $user */
        $user = $accessToken->tokenable;

        // Establish a fresh session for the SPA via the web guard.
        // SessionGuard::login() migrates the session id; we additionally
        // regenerate the CSRF token to prevent session-fixation style reuse
        // of any XSRF-TOKEN cookie that pre-existed the login.
        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerateToken();
        } else {
            // Non-stateful caller (e.g. direct API client). Fall back to
            // setting the authenticated user on the current request without
            // establishing a session. The SPA always has a session, so this
            // branch is only exercised by tests / non-browser clients.
            Auth::setUser($user);
        }

        // One-shot: delete the handoff token so it cannot be reused
        $accessToken->delete();

        Log::info('Token-to-session login', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'data' => [
                'user' => $user->only('id', 'first_name', 'last_name', 'email', 'avatar_url'),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => $user->only('id', 'first_name', 'last_name', 'email', 'avatar_url'),
        ]);
    }
}
