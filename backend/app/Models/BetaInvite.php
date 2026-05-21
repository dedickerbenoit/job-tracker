<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $email
 * @property Carbon $sent_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property int $is_active Virtual column from LEFT JOIN
 */
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
