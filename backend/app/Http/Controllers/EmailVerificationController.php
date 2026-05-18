<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * Mark the user's email as verified.
     *
     * Public route (no auth:sanctum) — the user clicks from their mailbox,
     * possibly in a different browser.
     */
    public function verify(Request $request, int $id, string $hash): JsonResponse
    {
        if (! $request->hasValidSignature()) {
            return response()->json([
                'message' => 'Le lien de vérification est invalide ou a expiré.',
                'error_code' => 'INVALID_VERIFICATION_LINK',
            ], 403);
        }

        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json([
                'message' => 'Le lien de vérification est invalide.',
                'error_code' => 'INVALID_VERIFICATION_LINK',
            ], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Adresse e-mail déjà vérifiée.',
            ]);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response()->json([
            'message' => 'Adresse e-mail vérifiée avec succès.',
        ]);
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Adresse e-mail déjà vérifiée.',
            ], 422);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Lien de vérification envoyé.',
        ]);
    }
}
