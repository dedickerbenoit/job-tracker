<?php

namespace App\DTOs\Application;

use App\Http\Requests\Application\IndexApplicationRequest;

final readonly class ApplicationFilterData
{
    public function __construct(
        public ?string $status,
        public ?string $source,
        public ?string $search,
        public ?string $fromDate,
        public ?string $toDate,
        public string $sort,
        public string $direction,
        public int $perPage,
    ) {}

    public static function fromRequest(IndexApplicationRequest $request): self
    {
        return new self(
            status: $request->validated('status'),
            source: $request->validated('source'),
            search: $request->validated('search'),
            fromDate: $request->validated('from_date'),
            toDate: $request->validated('to_date'),
            sort: $request->validated('sort') ?? 'created_at',
            direction: $request->validated('direction') ?? 'desc',
            perPage: (int) ($request->validated('per_page') ?? 15),
        );
    }
}
