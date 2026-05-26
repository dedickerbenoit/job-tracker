<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    /** @param array<string, mixed> $data */
    public function create(array $data): User;

    public function forceDeleteTrashedByEmail(string $email): void;

    public function markBetaInvitationSent(string $email): void;
}
