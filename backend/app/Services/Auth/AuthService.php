<?php

namespace App\Services\Auth;

use App\DTOs\Auth\AuthResult;
use App\DTOs\Auth\LoginData;
use App\DTOs\Auth\RegisterData;
use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\Auth\InvalidTokenException;
use App\Exceptions\Auth\TooManyAttempsException;
use App\Models\User;
use App\Repositories\Contracts\BetaInviteRepositoryInterface;
use App\Repositories\Contracts\UserConsentRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Support\SessionTerminator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly UserConsentRepositoryInterface $consentRepository,
        private readonly BetaInviteRepositoryInterface $betaInviteRepository,
        private readonly SessionTerminator $sessionTerminator,
    ) {}

    public function register(RegisterData $data): AuthResult
    {
        $this->userRepository->forceDeleteTrashedByEmail($data->email);

        $user = $this->userRepository->create(
            [
                'first_name' => $data->firstName,
                'last_name' => $data->lastName,
                'email' => $data->email,
                'password' => $data->password,
            ]
        );

        if ($this->betaInviteRepository->emailExists($data->email)) {
            $user->update(['is_beta_invitation_sent' => true]);
        }

        $this->consentRepository->createInitialConsents($user, $data->ipAddress, $data->userAgent);

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::warning('Failed to send verification email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('User registered', [
            'user_id' => $user->id,
            'ip' => $data->ipAddress,
            'auth_mode' => $data->wantsToken ? 'token' : 'session',
        ]);

        $token = null;
        if ($data->wantsToken) {
            $token = $user->createToken('auth')->plainTextToken;
        } else {
            Auth::login($user);
        }

        return new AuthResult($user, $token);
    }

    public function login(LoginData $data): AuthResult
    {
        $throttleKey = 'login:'.Str::lower($data->email);

        if (RateLimiter::tooManyAttempts($throttleKey, config('auth.login_rate_limit'))) {
            $seconds = RateLimiter::availableIn($throttleKey);
            Log::warning('Login locked out by email', ['email' => $data->email, 'ip' => $data->ipAddress]);
            throw new TooManyAttempsException($seconds);
        }

        $credentials = ['email' => $data->email, 'password' => $data->password];

        $authenticated = $data->wantsToken
            ? Auth::once($credentials)
            : Auth::attempt($credentials);

        if (! $authenticated) {
            RateLimiter::hit($throttleKey, config('auth.login_lockout_seconds'));
            Log::warning('Failed login attempt', ['email' => $data->email, 'ip' => $data->ipAddress]);
            throw new InvalidCredentialsException;
        }

        RateLimiter::clear($throttleKey);

        /** @var User $user */
        $user = Auth::user();

        Log::info('Successful login', [
            'user_id' => $user->id,
            'ip' => $data->ipAddress,
            'auth_mode' => $data->wantsToken ? 'token' : 'session',
        ]);

        $token = $data->wantsToken
            ? $user->createToken('auth')->plainTextToken
            : null;

        return new AuthResult($user, $token);
    }

    public function logout(User $user, Request $request): void
    {
        Log::info('User logout', ['user_id' => $user->id, 'ip' => $request->ip()]);
        if ($user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        } else {
            $this->sessionTerminator->invalidateSession($request);
        }
    }

    public function createHandoffToken(User $user, string $ipAddress): string
    {
        $ttl = config('auth.handoff_token_ttl_seconds');

        $token = $user->createToken(
            'handoff',
            ['handoff'],
            now()->addSeconds($ttl),
        )->plainTextToken;

        Log::info('Handoff token created', [
            'user_id' => $user->id,
            'ip' => $ipAddress,
            'token_abilities' => ['handoff'],
            'expires_in_seconds' => $ttl,
        ]);

        return $token;
    }

    public function exchangeHandoffToken(string $bearer, Request $request): User
    {
        $accessToken = PersonalAccessToken::findToken($bearer);

        if (! $accessToken || ($accessToken->expires_at && $accessToken->expires_at->isPast())) {
            throw new InvalidTokenException;
        }

        $abilities = $accessToken->abilities ?? [];
        if (count($abilities) !== 1 || ! in_array('handoff', $abilities, true)) {
            Log::warning('Token-login attempted without handoff ability', [
                'user_id' => $accessToken->tokenable_id,
                'ip' => $request->ip(),
                'abilities' => $abilities,
            ]);
            throw new InvalidTokenException('Jeton non autorisé pour le handoff', 403);
        }

        /** @var User $user */
        $user = $accessToken->tokenable;

        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerateToken();
        } else {
            Auth::setUser($user);
        }

        $accessToken->delete();

        Log::info('Token-to-session login', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        return $user;
    }
}
