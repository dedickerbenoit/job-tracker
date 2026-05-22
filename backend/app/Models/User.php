<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
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
 * @property bool $is_admin
 * @property string|null $remember_token
 * @property Carbon|null $suspended_at
 * @property string|null $google_id
 * @property string|null $linkedin_id
 * @property string|null $avatar_url
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Collection<int, Application> $applications
 * @property-read Collection<int, ApplicationEvent> $applicationEvents
 * @property-read Collection<int, UserConsent> $consents
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @var list<string> */
    public const API_VISIBLE_FIELDS = ['id', 'first_name', 'last_name', 'email', 'avatar_url', 'suspended_at', 'email_verified_at', 'is_admin'];

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = ['first_name', 'last_name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token', 'google_id', 'linkedin_id'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_admin' => 'boolean',
            'suspended_at' => 'datetime',
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
