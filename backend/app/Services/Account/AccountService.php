<?php

namespace App\Services\Account;

use App\DTOs\Account\ConsentData;
use App\Enums\ConsentType;
use App\Exceptions\Account\AccountNotSuspendedException;
use App\Exceptions\Account\ConsentAlreadyActiveException;
use App\Exceptions\Account\ConsentNotFoundException;
use App\Exceptions\Account\MissingConsentsException;
use App\Models\User;
use App\Models\UserConsent;
use App\Repositories\Contracts\UserConsentRepositoryInterface;
use App\Services\Support\SessionTerminator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AccountService
{
    public function __construct(
        private readonly UserConsentRepositoryInterface $consentRepository,
        private readonly SessionTerminator $sessionTerminator,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function exportData(User $user): array
    {
        Log::info('RGPD data export requested', ['user_id' => $user->id]);

        return [
            'profile' => $user->only('id', 'first_name', 'last_name', 'email', 'created_at',
                'updated_at'),
            'applications' => $user->applications()->with('events')->get(),
            'consents' => $user->consents,
        ];
    }

    /**
     * @return Collection<int, UserConsent>
     */
    public function getConsents(User $user): Collection
    {
        /** @phpstan-ignore return.type */
        return $user->consents()
            ->select('id', 'consent_type', 'consented_at', 'revoked_at')
            ->orderBy('consented_at', 'desc')
            ->get();
    }

    public function revokeConsent(User $user, ConsentData $data): void
    {
        $consent = $this->consentRepository->findActiveConsent($user, $data->consentType);

        if (! $consent) {
            throw new ConsentNotFoundException;
        }

        $consent->revoked_at = now();
        $consent->save();

        if (! $user->suspended_at) {
            $user->suspended_at = now();
            $user->save();
        }

        Log::info('RGPD consent revoked', [
            'user_id' => $user->id,
            'consent_type' => $data->consentType,
            'auto_suspended' => $user->wasChanged('suspended_at'),
            'ip' => $data->ipAddress,
        ]);
    }

    public function grantConsent(User $user, ConsentData $data): void
    {
        $alreadyActive = $this->consentRepository->findActiveConsent($user, $data->consentType);

        if ($alreadyActive) {
            throw new ConsentAlreadyActiveException;
        }

        $this->consentRepository->createConsent([
            'user_id' => $user->id,
            'consent_type' => $data->consentType,
            'consented_at' => now(),
            'ip_address' => $data->ipAddress,
            'user_agent' => $data->userAgent,
        ]);

        Log::info('RGPD consent granted', [
            'user_id' => $user->id,
            'consent_type' => $data->consentType,
            'ip' => $data->ipAddress,
        ]);
    }

    public function reactivateAccount(User $user): void
    {
        if (! $user->suspended_at) {
            throw new AccountNotSuspendedException;
        }

        $activeTypes = $this->consentRepository->getActiveConsentTypes($user);
        $requiredTypes = array_map(fn (ConsentType $t) => $t->value, ConsentType::requiredForActivation());
        $missing = array_values(array_diff($requiredTypes, $activeTypes));

        if (! empty($missing)) {
            throw new MissingConsentsException($missing);
        }

        $user->suspended_at = null;
        $user->save();

        Log::info('RGPD account reactivated', ['user_id' => $user->id]);
    }

    public function suspendAccount(User $user, Request $request): void
    {
        Log::info('RGPD account suspension requested', ['user_id' => $user->id]);

        $user->suspended_at = now();
        $user->save();

        $this->sessionTerminator->terminateAllSessions($user, $request);
    }

    public function deleteAccount(User $user, Request $request): void
    {
        Log::info('RGPD account deletion requested', ['user_id' => $user->id]);

        $user->tokens()->delete();
        $user->delete();

        $this->sessionTerminator->invalidateSession($request);
    }
}
