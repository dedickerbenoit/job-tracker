<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /** @param array<string,mixed> $data */
    public function create(array $data): User
    {
        return User::create($data);
    }

    public function forceDeleteTrashedByEmail(string $email): void
    {
        User::onlyTrashed()->where('email', $email)->forceDelete();
    }

    public function markBetaInvitationSent(string $email): void
    {
        User::where('email', $email)->update(['is_beta_invitation_sent' => true]);
    }

    /** @return LengthAwarePaginator<User> */
    public function getAllNonAdmin(int $perPage = 20): LengthAwarePaginator
    {
        return User::where('is_admin', false)->orderByDesc('created_at')->paginate($perPage);
    }
}
