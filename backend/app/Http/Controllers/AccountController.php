<?php

namespace App\Http\Controllers;

use App\Http\Requests\Account\ConsentRequest;
use App\Models\UserConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
     * La révocation suspend automatiquement le compte (art. 6 : pas de traitement sans base légale).
     */
    public function revokeConsent(ConsentRequest $request): JsonResponse
    {

        $user = $request->user();

        $consent = UserConsent::query()
            ->where('user_id', $user->id)
            ->where('consent_type')
            ->whereNull('revoked_at')
            ->latest('consented_at')
            ->first();

        if (! $consent) {
            return response()->json([
                'message' => 'Aucun consentement actif trouvé pour ce type.',
            ], 404);
        }

        $consent->revoked_at = now();
        $consent->save();

        // Suspend account automatically — no processing without active consent
        if (! $user->suspended_at) {
            $user->suspended_at = now();
            $user->save();
        }

        Log::info('RGPD consent revoked', [
            'user_id' => $user->id,
            'consent_type',
            'auto_suspended' => ! $user->wasChanged('suspended_at') ? false : true,
            'ip' => $request->ip(),
        ]);

        return response()->json(null, 204);
    }

    /**
     * RGPD — Re-souscription à un consentement révoqué.
     * Crée un NOUVEAU enregistrement (traçabilité : l'ancien reste avec revoked_at).
     */
    public function grantConsent(ConsentRequest $request): JsonResponse
    {

        $user = $request->user();

        $alreadyActive = UserConsent::query()
            ->where('user_id', $user->id)
            ->where('consent_type')
            ->whereNull('revoked_at')
            ->exists();

        if ($alreadyActive) {
            return response()->json([
                'message' => 'Un consentement actif existe déjà pour ce type.',
            ], 409);
        }

        UserConsent::create([
            'user_id' => $user->id,
            'consent_type' => $request['consent_type'],
            'consented_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
        ]);

        Log::info('RGPD consent granted', [
            'user_id' => $user->id,
            'consent_type' => $request['consent_type'],
            'ip' => $request->ip(),
        ]);

        return response()->json(null, 201);
    }

    /**
     * RGPD — Réactivation du compte par l'utilisateur.
     * Requiert que les deux consentements (terms + privacy) soient actifs.
     */
    public function reactivateAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->suspended_at) {
            return response()->json([
                'message' => 'Le compte n\'est pas suspendu.',
            ], 409);
        }

        $activeConsentTypes = UserConsent::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->pluck('consent_type')
            ->unique()
            ->toArray();

        $missing = array_values(array_diff(['terms', 'privacy'], $activeConsentTypes));

        if (! empty($missing)) {
            return response()->json([
                'message' => 'Consentements manquants.',
                'missing_consents' => $missing,
            ], 422);
        }

        $user->suspended_at = null;
        $user->save();

        Log::info('RGPD account reactivated', [
            'user_id' => $user->id,
            'ip' => $request->ip(),
        ]);

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
