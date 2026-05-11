<?php

namespace App\Http\Controllers;

use App\Models\UserConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AccountController extends Controller
{
    /**
     * B05 — Droit d'accès / portabilité RGPD.
     * Retourne toutes les données personnelles de l'utilisateur en JSON.
     */
    public function exportData(Request $request): JsonResponse
    {
        $user = $request->user();

        Log::info('RGPD data export requested', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'data' => [
                'profile' => $user->only('id', 'first_name', 'last_name', 'email', 'created_at', 'updated_at'),
                'applications' => $user->applications()->with('events')->get(),
                'consents' => $user->consents,
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * RGPD — Liste des consentements de l'utilisateur.
     */
    public function consents(Request $request): JsonResponse
    {
        $consents = $request->user()->consents()
            ->select('id', 'consent_type', 'consented_at', 'revoked_at')
            ->orderBy('consented_at', 'desc')
            ->get();

        return response()->json(['data' => $consents]);
    }

    /**
     * RGPD — Révocation d'un consentement spécifique.
     */
    public function revokeConsent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'consent_type' => ['required', Rule::in(['terms', 'privacy'])],
        ]);

        $user = $request->user();

        $consent = UserConsent::query()
            ->where('user_id', $user->id)
            ->where('consent_type', $validated['consent_type'])
            ->whereNull('revoked_at')
            ->latest('consented_at')
            ->first();

        if (! $consent) {
            return response()->json([
                'message' => 'Aucun consentement actif trouvé pour ce type.',
            ], 404);
        }

        Log::info('RGPD consent revoked', [
            'user_id' => $user->id,
            'consent_type' => $validated['consent_type'],
            'ip' => $request->ip(),
        ]);

        $consent->revoked_at = now();
        $consent->save();

        return response()->json(null, 204);
    }

    /**
     * RGPD — Droit à la limitation du traitement (art. 18).
     * Suspend le compte : les données sont conservées mais plus traitées.
     */
    public function suspendAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        Log::info('RGPD account suspension requested', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        $user->suspended_at = now();
        $user->save();

        // Revoke all tokens and invalidate session
        $user->tokens()->delete();

        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(null, 204);
    }

    /**
     * B04 — Droit à l'effacement RGPD.
     * Soft-delete le compte, révoque les tokens et invalide la session.
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        Log::info('RGPD account deletion requested', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        // Revoke all Sanctum tokens
        $user->tokens()->delete();

        // Soft-delete user — applications and events remain intact during 30-day grace period.
        // FK cascades will trigger when forceDelete() runs via app:cleanup-expired-accounts.
        $user->delete();

        // Invalidate session
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(null, 204);
    }
}
