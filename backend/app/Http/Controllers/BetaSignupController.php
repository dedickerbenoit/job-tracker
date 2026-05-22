<?php

namespace App\Http\Controllers;

use App\Http\Requests\BetaSignupRequest;
use App\Services\Beta\BetaSignupService;
use Illuminate\Http\JsonResponse;

class BetaSignupController extends Controller
{
    public function __construct(
        private readonly BetaSignupService $betaSignupService,
    ) {}

    public function store(BetaSignupRequest $request): JsonResponse
    {
        $this->betaSignupService->signup($request->validated('email'));

        return response()->json(['message' => 'ok']);
    }
}
