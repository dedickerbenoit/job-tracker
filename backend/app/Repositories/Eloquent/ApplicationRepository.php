<?php

namespace App\Repositories\Eloquent;

use App\DTOs\Application\ApplicationFilterData;
use App\Models\Application;
use App\Models\User;
use App\Repositories\Contracts\ApplicationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ApplicationRepository implements ApplicationRepositoryInterface
{
    public function paginateForUser(User $user, ApplicationFilterData $filters): LengthAwarePaginator
    {
        $query = $user->applications();

        if ($filters->status !== null) {
            $query->where('status', $filters->status);
        }

        if ($filters->source !== null) {
            $query->where('source', $filters->source);
        }

        if ($filters->search !== null) {
            $search = str_replace(['%', '_'], ['\\%', '\\_'], strtolower($filters->search));
            $query->where(function ($q) use ($search) {
                foreach (['title', 'company', 'location'] as $column) {
                    $q->orWhere($column, 'LIKE', "%{$search}%");
                }
            });
        }

        if ($filters->fromDate !== null) {
            $query->where('created_at', '>=', $filters->fromDate);
        }

        if ($filters->toDate !== null) {
            $query->where('created_at', '<=', $filters->toDate);
        }

        $allowedSorts = ['created_at', 'updated_at', 'company', 'status', 'title'];
        if (in_array($filters->sort, $allowedSorts)) {
            $query->orderBy($filters->sort, $filters->direction === 'asc' ? 'asc' : 'desc');
        }

        return $query->paginate($filters->perPage);
    }

    /**
     * @return array<string, mixed>
     */
    public function getStatsForUser(User $user): array
    {
        return [
            'total' => $user->applications()->count(),
            'by_status' => $user->applications()
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'by_source' => $user->applications()
                ->selectRaw('source, count(*) as count')
                ->groupBy('source')
                ->pluck('count', 'source'),
        ];
    }

    /**
     * @return Collection<int, Application>
     */
    public function findDuplicatesByUrl(User $user, string $url, int $excludeId): Collection
    {
        /** @phpstan-ignore return.type */
        return $user->applications()
            ->where('id', '!=', $excludeId)
            ->where('url', $url)
            ->get();
    }
}
