<?php

namespace Database\Factories;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        $status = fake()->randomElement(ApplicationStatus::cases());

        return [
            'user_id' => User::factory(),
            'title' => fake()->randomElement([
                'Developpeur Full Stack',
                'Frontend Developer React',
                'Backend Engineer PHP',
                'Software Engineer',
                'DevOps Engineer',
                'Data Engineer',
                'Lead Developer',
                'Tech Lead',
                'Ingenieur Logiciel',
                'Developpeur Web',
            ]),
            'company' => fake()->company(),
            'location' => fake()->randomElement([
                'Paris, France',
                'Lyon, France',
                'Lille, France',
                'Remote',
                'Toulouse, France',
                'Nantes, France',
                'Bordeaux, France',
            ]),
            'url' => fake()->unique()->url(),
            'description' => fake()->optional(0.7)->paragraphs(3, true),
            'source' => fake()->randomElement(ApplicationSource::cases()),
            'status' => $status,
            'notes' => fake()->optional(0.5)->sentence(),
            'applied_at' => in_array($status, [
                ApplicationStatus::Applied,
                ApplicationStatus::FollowUp,
                ApplicationStatus::Interview,
                ApplicationStatus::Offer,
            ]) ? fake()->dateTimeBetween('-3 months', 'now') : null,
        ];
    }

    public function withStatus(ApplicationStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }

    public function fromLinkedIn(): static
    {
        return $this->state(fn () => [
            'source' => ApplicationSource::LinkedIn,
            'url' => 'https://www.linkedin.com/jobs/view/'.fake()->randomNumber(9),
        ]);
    }
}
