<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface BetaInviteRepositoryInterface
{
    /** @return Collection<int, \App\Models\BetaInvite. */
    public function getAllWithActiveStatus(): Collection;

    public function upsertByEmail(string $email): void;
}
