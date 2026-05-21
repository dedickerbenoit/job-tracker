<?php

namespace App\Http\Resources;

use App\Models\BetaInvite;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BetaInvite */
class BetaInviteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'sent_at' => $this->sent_at->toISOString(),
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
