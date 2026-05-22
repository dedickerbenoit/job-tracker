<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBetaInviteRequest;
use App\Http\Resources\BetaInviteResource;
use App\Services\Beta\BetaInviteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BetaInviteController extends Controller
{
    public function __construct(
        private readonly BetaInviteService $betaInviteService,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        return BetaInviteResource::collection($this->betaInviteService->list());
    }

    public function store(StoreBetaInviteRequest $request): JsonResponse
    {
        $this->betaInviteService->sendInvite($request->validated('email'), $request->user()->id);

        return response()->json(['message' => 'Invitation envoyée.']);
    }
}
