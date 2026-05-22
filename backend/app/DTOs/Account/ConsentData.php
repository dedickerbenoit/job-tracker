<?php

namespace App\DTOs\Account;

use App\Http\Requests\Account\ConsentRequest;

final readonly class ConsentData
{
    public function __construct(
        public string $consentType,
        public string $ipAddress,
        public string $userAgent,
    ) {}

    public static function fromRequest(ConsentRequest $request): self
    {
        return new self(
            consentType: $request->validated('consent_type'),
            ipAddress: (string) $request->ip(),
            userAgent: mb_substr((string) $request->userAgent(), 0, 500),
        );
    }
}
