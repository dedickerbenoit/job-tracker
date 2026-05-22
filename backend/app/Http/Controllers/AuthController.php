<?php

namespace App\Http\Controllers;

use App\DTOs\Auth\LoginData;
use App\DTOs\Auth\RegisterData;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register(RegisterData::fromRequest($request));

        return response()->json(['data' => $result->toResponseArray()], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(LoginData::fromRequest($request));

        return response()->json(['data' => $result->toResponseArray()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user(), $request);

        return response()->json(null, 204);
    }

    public function createHandoffToken(Request $request): JsonResponse
    {
        $token = $this->authService->createHandoffToken($request->user(), (string) $request->ip());

        return response()->json(['data' => ['token' => $token]]);
    }

    public function tokenLogin(Request $request): JsonResponse
    {
        $bearer = $request->bearerToken();
        if (! $bearer) {
            abort(401, 'Jeton manquant');
        }

        $user = $this->authService->exchangeHandoffToken($bearer, $request);

        return response()->json([
            'data' => [
                'user' => $user->only('id', 'first_name', 'last_name', 'email', 'avatar_url', 'email_verified_at', 'is_admin'),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->only('id', 'first_name', 'last_name', 'email', 'avatar_url', 'suspended_at', 'email_verified_at', 'is_admin'),
        ]);
    }
}
