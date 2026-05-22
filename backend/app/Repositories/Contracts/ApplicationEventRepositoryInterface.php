<?php

namespace App\Repositories\Contracts;

use App\DTOs\Timeline\TimelineFilterData;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ApplicationEventRepositoryInterface
{
    public function paginateForUser(User $user, TimelineFilterData $filters): LengthAwarePaginator;
}
