<?php

namespace App\Repositories\Contracts;

use App\Models\BetaInvite;
use Illuminate\Database\Eloquent\Collection;

interface BetaInviteRepositoryInterface
{
    /** @return Collection<int, BetaInvite> */
    public function getAllWithActiveStatus(): Collection;

    public function upsertByEmail(string $email): void;
}
