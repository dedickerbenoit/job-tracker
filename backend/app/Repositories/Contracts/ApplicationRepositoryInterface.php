<?php

namespace App\Repositories\Contracts;

use App\Models\Application;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface ApplicationRepositoryInterface
{
    /** @return array<string, mixed> */
    public function getStatsForUser(User $user): array;

    /** @return Collection<int, Application> */
    public function findDuplicatesbyUrl(User $user, string $url, int $excludeId): Collection;
}
