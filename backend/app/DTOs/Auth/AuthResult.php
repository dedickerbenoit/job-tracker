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
            'user' => $this->user->only('id', 'first_name', 'last_name', 'email', 'avatar_url', 'email_verified_at', 'is_admin'),
        ];

        if ($this->token !== null) {
            $data['token'] = $this->token;
        }

        return $data;
    }
}
