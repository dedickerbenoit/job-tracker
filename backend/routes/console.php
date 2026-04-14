<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// RGPD — Daily cleanup tasks
Schedule::command('app:cleanup-expired-accounts')->dailyAt('02:00');
Schedule::command('app:cleanup-sessions')->dailyAt('02:30');
Schedule::command('app:cleanup-tokens')->dailyAt('03:00');
Schedule::command('app:cleanup-expired-consents')->monthlyOn(1, '03:30');
