<?php

namespace App\Services\Beta;

use App\Models\BetaInvite;
use App\Notifications\BetaInviteNotification;
use App\Repositories\Contracts\BetaInviteRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class BetaInviteService
{
    public function __construct(
        private readonly BetaInviteRepositoryInterface $betaInviteRepository,
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * @return Collection<int, BetaInvite>
     */
    public function list(): Collection
    {
        return $this->betaInviteRepository->getAllWithActiveStatus();
    }

    public function sendInvite(string $email, int $adminUserId): void
    {
        $this->betaInviteRepository->upsertByEmail($email);

        $this->userRepository->markBetaInvitationSent($email);

        Notification::route('mail', $email)
            ->notify(new BetaInviteNotification);

        Log::info('Beta invite sent', [
            'to' => $email,
            'by' => $adminUserId,
        ]);
    }
}
