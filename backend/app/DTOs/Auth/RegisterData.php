<?php

namespace App\DTOs\Auth;

use App\Http\Requests\Auth\RegisterRequest;

final readonly class RegisterData
{
    public function __construct(
        public string $email,
        public string $password,
        public string $firstname,
        public string $lastname,
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
            firstname: $validated['firstname'],
            lastname: $validated['lastname'],
            ipAddress: (string) $request->ip(),
            userAgent: mb_substr((string) $request->userAgent(), 0, 500),
            wantsToken: $request->header('X-Request-Token') === 'true',
        );
    }
}
