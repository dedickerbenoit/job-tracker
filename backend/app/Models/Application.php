<?php

namespace App\Models;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Observers\ApplicationObserver;
use Database\Factories\ApplicationFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $title
 * @property string $company
 * @property string $location
 * @property string $url
 * @property string|null $description
 * @property ApplicationSource $source
 * @property ApplicationStatus $status
 * @property string|null $notes
 * @property Carbon|null $applied_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User $user
 * @property-read Collection<int, ApplicationEvent> $events
 */
#[ObservedBy(ApplicationObserver::class)]
class Application extends Model
{
    /** @use HasFactory<ApplicationFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'source' => ApplicationSource::class,
            'status' => ApplicationStatus::class,
            'applied_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ApplicationEvent::class);
    }
}
