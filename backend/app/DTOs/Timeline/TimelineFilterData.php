<?php

namespace App\DTOs\Timeline;

use App\Http\Requests\Application\TimelineRequest;

final readonly class TimelineFilterData
{
    public function __construct(
        public ?int $applicationId,
        public ?string $type,
        public ?string $fromDate,
        public ?string $toDate,
        public int $perPage,
    ) {}

    public static function fromRequest(TimelineRequest $request): self
    {
        return new self(
            applicationId: $request->validated('application_id') ? (int)
            $request->validated('application_id') : null,
            type: $request->validated('type'),
            fromDate: $request->validated('from_date'),
            toDate: $request->validated('to_date'),
            perPage: (int) $request->validated('per_page', 50),
        );
    }
}
