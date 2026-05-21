<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BetaInvite extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }
}
