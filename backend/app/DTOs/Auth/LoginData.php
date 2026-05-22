<?php

namespace App\DTOs\Auth;

use App\Http\Requests\Auth\LoginRequest;

final readonly class LoginData
{
    public function __construct(
        public string $email,
        public string $password,
        public string $ipAddress,
        public bool $wantsToken
    ) {}

    public static function fromRequest(LoginRequest $request): self
    {
        $validated = $request->validated();

        return new self(
            email: $validated['email'],
            password: $validated['password'],
            ipAddress: $request->ip(),
            wantsToken: $request->header('X-Request-Token') === 'true',
        );
    }
}
