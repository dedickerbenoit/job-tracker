<?php

namespace App\Models;

use App\Enums\ApplicationEventType;
use Database\Factories\ApplicationEventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $application_id
 * @property ApplicationEventType $type
 * @property string $description
 * @property array|null $metadata
 * @property Carbon $created_at
 * @property-read User $user
 * @property-read Application|null $application
 */
class ApplicationEvent extends Model
{
    /** @use HasFactory<ApplicationEventFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'type' => ApplicationEventType::class,
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
