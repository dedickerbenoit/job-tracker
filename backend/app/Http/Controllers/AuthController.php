<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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

        if (!Auth::attempt($validated)) {
            Log::warning('Failed login attempt', ['email' => $validated['email'], 'ip' => $request->ip()]);

            return response()->json([
                'message' => 'Identifiants invalides',
                'errors' => ['email' => ['Identifiants invalides']],
            ], 422);
        }

        $user = Auth::user();

        // Support both SPA mode (session cookies) and token mode (Chrome extension)
        // If request wants a token (X-Request-Token header), return a token
        // Otherwise, use session authentication (SPA mode)
        $wantsToken = $request->header('X-Request-Token') === 'true';

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
        // Session is already established by Auth::attempt()

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

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => $user->only('id', 'first_name', 'last_name', 'email', 'avatar_url'),
        ]);
    }
}
