<?php

namespace App\Repositories\Eloquent;

use App\DTOs\Timeline\TimelineFilterData;
use App\Models\User;
use App\Repositories\Contracts\ApplicationEventRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ApplicationEventRepository implements ApplicationEventRepositoryInterface
{
    public function paginateForUser(User $user, TimelineFilterData $filters): LengthAwarePaginator
    {
        $query = $user->applicationEvents();

        if ($filters->applicationId !== null) {
            $query->where('application_id', $filters->applicationId);
        }

        if ($filters->type !== null) {
            $query->where('type', $filters->type);
        }

        if ($filters->fromDate !== null) {
            $query->where('created_at', '>=', $filters->fromDate);
        }

        if ($filters->toDate !== null) {
            $query->where('created_at', '<=', $filters->toDate);
        }

        $query->orderByDesc('created_at');

        return $query->paginate($filters->perPage);
    }
}
