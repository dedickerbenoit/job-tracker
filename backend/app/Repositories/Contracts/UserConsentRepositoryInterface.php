<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use App\Models\UserConsent;

interface UserConsentRepositoryInterface
{
    public function findActiveConsent(User $user, string $consentType): ?UserConsent;

    /** @return list<string> */
    public function getActiveConsentTypes(User $user): array;

    /** @param array<string, mixed> $data */
    public function createConsent(array $data): UserConsent;

    public function createInitialConsents(User $user, string $ipAddress, string $userAgent): void;
}
