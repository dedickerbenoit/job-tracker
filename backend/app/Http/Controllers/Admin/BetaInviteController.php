<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBetaInviteRequest;
use App\Http\Resources\BetaInviteResource;
use App\Models\BetaInvite;
use App\Notifications\BetaInviteNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class BetaInviteController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $invites = BetaInvite::query()
            ->select('beta_invites.*')
            ->selectRaw('CASE WHEN users.id IS NOT NULL THEN 1 ELSE 0 END AS is_active')
            ->leftJoin('users', function ($join) {
                $join->on('users.email', '=', 'beta_invites.email')
                    ->whereNull('users.deleted_at');
            })
            ->orderByDesc('beta_invites.sent_at')
            ->get();

        return BetaInviteResource::collection($invites);
    }

    public function store(StoreBetaInviteRequest $request): JsonResponse
    {
        $email = $request->validated('email');

        try {
            BetaInvite::updateOrCreate(
                ['email' => $email],
                ['sent_at' => now()],
            );

            Notification::route('mail', $email)
                ->notify(new BetaInviteNotification);

            Log::info('Beta invite sent', [
                'to' => $email,
                'by' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Invitation envoyée.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send beta invite', [
                'to' => $email,
                'by' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de l\'envoi de l\'invitation.',
            ], 500);
        }
    }
}
