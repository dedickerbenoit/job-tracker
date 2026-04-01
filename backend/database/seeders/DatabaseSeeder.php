<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Model::unguard();
        $testUser = User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
        ]);

        Application::factory()
            ->count(25)
            ->for($testUser)
            ->create();

        User::factory()
            ->count(3)
            ->has(Application::factory()->count(10))
            ->create();

        Model::reguard();
    }
}
