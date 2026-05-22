<?php

namespace App\DTOs\Auth;

use App\Http\Requests\Auth\RegisterRequest;

final readonly class RegisterData
{
    public function __construct(
        public string $email,
        public string $password,
        public string $firstName,
        public string $lastName,
        public string $ipAddress,
        public string $userAgent,
        public bool $wantsToken
    ) {}

    public static function fromRequest(RegisterRequest $request): self
    {
        $validated = $request->validated();

        return new self(
            email: $validated['email'],
            password: $validated['password'],
            firstName: $validated['first_name'],
            lastName: $validated['last_name'],
            ipAddress: (string) $request->ip(),
            userAgent: mb_substr((string) $request->userAgent(), 0, 500),
            wantsToken: $request->header('X-Request-Token') === 'true',
        );
    }
}
