<?php

namespace App\DTOs\Application;

use App\Http\Requests\StoreApplicationRequest;

final readonly class StoreApplicationData
{
    public function __construct(
        public string $title,
        public string $company,
        public string $location,
        public string $url,
        public ?string $description,
        public string $source,
        public string $status,
        public ?string $notes,
        public ?string $appliedAt,
    ) {}

    public static function fromRequest(StoreApplicationRequest $request): self
    {
        $validated = $request->validated();

        return new self(
            title: $validated['title'],
            company: $validated['company'],
            location: $validated['location'],
            url: $validated['url'],
            description: $validated['description'] ?? null,
            source: $validated['source'],
            status: $validated['status'] ?? 'to_apply',
            notes: $validated['notes'] ?? null,
            appliedAt: $validated['applied_at'] ?? null,
        );
    }
}
