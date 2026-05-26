<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BetaInviteNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $chromeStoreUrl = config('services.chrome_store.url');
        $dashboardUrl = config('app.frontend_url');

        return (new MailMessage)
            ->subject('Ton accès beta est prêt — JobTracker')
            ->greeting('Salut !')
            ->line('Bonne nouvelle : ton accès à la beta de l\'extension Chrome JobTracker est activé.')
            ->line('Clique sur le bouton ci-dessous pour l\'installer depuis le Chrome Web Store.')
            ->action('Télécharger l\'extension', $chromeStoreUrl)
            ->line('Tu peux aussi accéder à ton [dashboard]('.$dashboardUrl.') pour suivre tes candidatures.')
            ->line('Si tu as des questions ou des retours, réponds directement à cet e-mail.')
            ->salutation('À très vite, l\'équipe JobTracker');
    }
}
