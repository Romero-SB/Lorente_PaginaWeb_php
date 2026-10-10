<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token, public string $email) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject('Restablece tu contraseña — IE N.º 31501 «Sebastián Lorente»')
            ->greeting('Hola '.($notifiable->name ?? ''))
            ->line('Recibiste este correo porque se solicitó restablecer la contraseña de tu cuenta.')
            ->line('Haz clic en el botón para elegir una nueva contraseña.')
            ->action('Restablecer contraseña', $url)
            ->line('Este enlace caducará en '.config('auth.passwords.users.expire', 60).' minutos.')
            ->line('Si no solicitaste este cambio, ignora este mensaje. Tu contraseña seguirá siendo la misma.');
    }

    protected function resetUrl(object $notifiable): string
    {
        return route('panel.password.reset', [
            'token' => $this->token,
            'email' => $this->email,
        ]);
    }
}
