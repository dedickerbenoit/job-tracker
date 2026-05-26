<?php

namespace App\Services\Admin;

use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function list(): LengthAwarePaginator
    {
        return $this->userRepository->getAllNonAdmin();
    }
}
