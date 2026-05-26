<?php

namespace App\Repositories\Eloquent;

use App\Models\BetaInvite;
use App\Repositories\Contracts\BetaInviteRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BetaInviteRepository implements BetaInviteRepositoryInterface
{
    /**
     * @return Collection<int, BetaInvite>
     */
    public function getAllWithActiveStatus(): Collection
    {
        return BetaInvite::query()
            ->select('beta_invites.*')
            ->selectRaw('CASE WHEN users.id IS NOT NULL THEN 1 ELSE 0 END AS is_active')
            ->leftJoin('users', function ($join) {
                $join->on('users.email', '=', 'beta_invites.email')
                    ->whereNull('users.deleted_at');
            })
            ->orderByDesc('beta_invites.sent_at')
            ->get();
    }

    public function upsertByEmail(string $email): void
    {
        BetaInvite::updateOrCreate(
            ['email' => $email],
            ['sent_at' => now()],
        );
    }

    public function emailExists(string $email): bool
    {
        return BetaInvite::where('email', $email)->exists();
    }
}
