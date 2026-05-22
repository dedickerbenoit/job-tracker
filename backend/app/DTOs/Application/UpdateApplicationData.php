<?php

namespace App\DTOs\Application;

use App\Http\Requests\UpdateApplicationRequest;

final readonly class UpdateApplicationData
{
    /**
     * @param  array<string, mixed>  $changes
     */
    public function __construct(
        public array $changes,
    ) {}

    public static function fromRequest(UpdateApplicationRequest $request): self
    {
        return new self(
            changes: $request->validated(),
        );
    }
}
