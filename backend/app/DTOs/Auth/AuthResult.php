<?php

namespace App\DTOs\Auth;

use App\Models\User;

final readonly class AuthResult
{
    public function __construct(
        public User $user,
        public ?string $token = null,
    ) {}

    /** @return array<string, mixed> */
    public function toResponseArray(): array
    {
        $data = [
            'user' => $this->user->only(User::API_VISIBLE_FIELDS),
        ];

        if ($this->token !== null) {
            $data['token'] = $this->token;
        }

        return $data;
    }
}
