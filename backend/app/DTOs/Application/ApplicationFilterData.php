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
            fromDate: $request->validated('fromDate'),
            toDate: $request->validated('toDate'),
            sort: $request->validated('sort'),
            direction: $request->validated('direction'),
            perPage: $request->validated('perPage'),
        );
    }
}
