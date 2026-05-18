<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        $this->configureEmailVerification();
    }

    private function configureEmailVerification(): void
    {
        // Generate a frontend URL instead of a backend route so the SPA
        // handles the verification callback.
        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            $backendUrl = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addMinutes(60),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ],
            );

            // Extract the query string (expires + signature) from the signed
            // backend URL and rebuild the URL pointing at the frontend.
            $parts = parse_url($backendUrl);
            $frontendUrl = Config::get('app.frontend_url', Config::get('app.url'));

            return $frontendUrl
                .'/verify-email/'.$notifiable->getKey()
                .'/'.sha1($notifiable->getEmailForVerification())
                .'?'.$parts['query'];
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            return (new MailMessage)
                ->subject('Vérifiez votre adresse e-mail — JobTracker')
                ->greeting('Bonjour '.($notifiable->first_name ?? '').' !')
                ->line('Merci de vous être inscrit sur JobTracker. Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail.')
                ->action('Vérifier mon adresse e-mail', $url)
                ->line('Ce lien expire dans 60 minutes.')
                ->salutation('À bientôt, l\'équipe JobTracker');
        });
    }
}
