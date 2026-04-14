<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string $email
 * @property string|null $password
 * @property Carbon|null $email_verified_at
 * @property string|null $remember_token
 * @property string|null $google_id
 * @property string|null $linkedin_id
 * @property string|null $avatar_url
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Collection<int, Application> $applications
 * @property-read Collection<int, ApplicationEvent> $applicationEvents
 * @property-read Collection<int, UserConsent> $consents
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = ['first_name', 'last_name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function applicationEvents(): HasMany
    {
        return $this->hasMany(ApplicationEvent::class);
    }

    public function consents(): HasMany
    {
        return $this->hasMany(UserConsent::class);
    }
}
