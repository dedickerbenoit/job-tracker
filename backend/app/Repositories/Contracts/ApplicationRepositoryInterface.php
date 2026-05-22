<?php

namespace App\Repositories\Contracts;

use App\DTOs\Application\ApplicationFilterData;
use App\Models\Application;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ApplicationRepositoryInterface
{
    public function paginateForUser(User $user, ApplicationFilterData $filters): LengthAwarePaginator;

    /** @return array<string, mixed> */
    public function getStatsForUser(User $user): array;

    /** @return Collection<int, Application> */
    public function findDuplicatesByUrl(User $user, string $url, int $excludeId): Collection;
}
