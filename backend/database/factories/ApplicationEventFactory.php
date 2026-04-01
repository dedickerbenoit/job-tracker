<?php

namespace Database\Factories;

use App\Enums\ApplicationEventType;
use App\Models\Application;
use App\Models\ApplicationEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApplicationEvent>
 */
class ApplicationEventFactory extends Factory
{
    protected $model = ApplicationEvent::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'application_id' => Application::factory(),
            'type' => ApplicationEventType::Created,
            'description' => 'Candidature creee',
            'metadata' => ['source' => 'manual'],
            'created_at' => now(),
        ];
    }
}
