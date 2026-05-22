<?php

namespace App\Services\Application;

use App\DTOs\Application\ApplicationFilterData;
use App\DTOs\Application\StoreApplicationData;
use App\DTOs\Application\UpdateApplicationData;
use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\User;
use App\Repositories\Contracts\ApplicationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class ApplicationService
{
    public function __construct(
        private readonly ApplicationRepositoryInterface $applicationRepository,
    ) {}

    public function list(User $user, ApplicationFilterData $filters): LengthAwarePaginator
    {
        return $this->applicationRepository->paginateForUser($user, $filters);
    }

    /**
     * @return array<string, mixed>
     */
    public function create(User $user, StoreApplicationData $data): array
    {
        $application = new Application;
        $application->user_id = $user->id;
        $application->title = $data->title;
        $application->company = $data->company;
        $application->location = $data->location;
        $application->url = $data->url;
        $application->description = $data->description;
        $application->source = ApplicationSource::from($data->source);
        $application->status = ApplicationStatus::from($data->status);
        $application->notes = $data->notes;
        $application->applied_at = $data->appliedAt ? Carbon::parse($data->appliedAt) : null;

        $this->autoSetAppliedAt($application);
        $application->save();

        $duplicates = $this->applicationRepository->findDuplicatesByUrl($user, $data->url,
            $application->id);

        return [
            'application' => $application,
            'duplicates' => $duplicates,
        ];
    }

    public function update(Application $application, UpdateApplicationData $data): Application
    {
        foreach ($data->changes as $field => $value) {
            if ($field === 'description' || $field === 'notes' || $field === 'applied_at') {
                $application->{$field} = $value;
            } elseif (isset($value)) {
                $application->{$field} = $value;
            }
        }

        $this->autoSetAppliedAt($application);
        $application->save();

        return $application;
    }

    public function updateStatus(Application $application, string $status): Application
    {
        $application->status = ApplicationStatus::from($status);
        $this->autoSetAppliedAt($application);
        $application->save();

        return $application;
    }

    public function delete(Application $application): void
    {
        $application->delete();
    }

    /**
     * @return array<string, mixed>
     */
    public function getStats(User $user): array
    {
        return $this->applicationRepository->getStatsForUser($user);
    }

    private function autoSetAppliedAt(Application $application): void
    {
        if ($application->status === ApplicationStatus::Applied && $application->applied_at ===
  null) {
            $application->applied_at = now();
        }
    }
}
