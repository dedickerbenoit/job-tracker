<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    /** @param array<string, mixed> $data */
    public function create(array $data): User;

    public function forceDeleteTrashedByEmail(string $email): void;

    public function markBetaInvitationSent(string $email): void;

    /** @return LengthAwarePaginator<int, User> */
    public function getAllNonAdmin(int $perPage = 20): LengthAwarePaginator;
}
