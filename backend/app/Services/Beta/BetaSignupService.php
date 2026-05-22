<?php

namespace App\Services\Beta;

use App\Mail\BetaSignupNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BetaSignupService
{
    public function signup(string $email): void
    {
        try {
            Mail::to(config('services.beta.notification_email'))
                ->send(new BetaSignupNotification($email));
        } catch (\Throwable $e) {
            Log::warning('Failed to send beta signup notification', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
