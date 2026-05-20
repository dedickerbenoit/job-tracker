<?php

namespace App\Http\Resources;

use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Application */
class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'company' => $this->company,
            'location' => $this->location,
            'url' => $this->url,
            'description' => $this->when($request->routeIs('applications.show'), $this->description),
            'source' => $this->source->value,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'notes' => $this->when($request->routeIs('applications.show'), $this->notes),
            'applied_at' => $this->applied_at?->toISOString(),
            'status_changed_at' => $this->status_changed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
