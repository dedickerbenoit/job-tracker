<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'type' => $this->type->value,
            'description' => $this->description,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
