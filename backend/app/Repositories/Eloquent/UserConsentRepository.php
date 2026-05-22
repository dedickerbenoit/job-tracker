<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Models\UserConsent;
use App\Repositories\Contracts\UserConsentRepositoryInterface;

class UserConsentRepository implements UserConsentRepositoryInterface
{
    public function findActiveConsent(User $user, string $consentType): ?UserConsent
    {
        return UserConsent::query()
            ->where('user_id', $user->id)
            ->where('consent_type', $consentType)
            ->whereNull('revoked_at')
            ->latest('consented_at')
            ->first();
    }

    /**
     * @return list<string>
     */
    public function getActiveConsentTypes(User $user): array
    {
        return UserConsent::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->pluck('consent_type')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createConsent(array $data): UserConsent
    {
        return UserConsent::create($data);
    }

    public function createInitialConsents(User $user, string $ipAddress, string $userAgent): void
    {
        $now = now();

        foreach (['terms', 'privacy'] as $type) {
            UserConsent::create([
                'user_id' => $user->id,
                'consent_type' => $type,
                'consented_at' => $now,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);
        }
    }
}
