<?php

namespace App\Http\Controllers;

use App\DTOs\Account\ConsentData;
use App\Http\Requests\Account\ConsentRequest;
use App\Services\Account\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(
        private readonly AccountService $accountService,
    ) {}

    public function exportData(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->accountService->exportData($request->user())], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function consents(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->accountService->getConsents($request->user())]);
    }

    public function revokeConsent(ConsentRequest $request): JsonResponse
    {
        $this->accountService->revokeConsent($request->user(), ConsentData::fromRequest($request));

        return response()->json(null, 204);
    }

    public function grantConsent(ConsentRequest $request): JsonResponse
    {
        $this->accountService->grantConsent($request->user(), ConsentData::fromRequest($request));

        return response()->json(null, 201);
    }

    public function reactivateAccount(Request $request): JsonResponse
    {
        $this->accountService->reactivateAccount($request->user());

        return response()->json(null, 204);
    }

    public function suspendAccount(Request $request): JsonResponse
    {
        $this->accountService->suspendAccount($request->user(), $request);

        return response()->json(null, 204);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $this->accountService->deleteAccount($request->user(), $request);

        return response()->json(null, 204);
    }
}
