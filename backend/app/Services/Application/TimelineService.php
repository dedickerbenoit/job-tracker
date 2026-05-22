<?php

namespace App\Services\Application;

use App\DTOs\Timeline\TimelineFilterData;
use App\Models\User;
use App\Repositories\Contracts\ApplicationEventRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TimelineService
{
    public function __construct(
        private readonly ApplicationEventRepositoryInterface $eventRepository,
    ) {}

    public function list(User $user, TimelineFilterData $filters): LengthAwarePaginator
    {
        return $this->eventRepository->paginateForUser($user, $filters);
    }
}
