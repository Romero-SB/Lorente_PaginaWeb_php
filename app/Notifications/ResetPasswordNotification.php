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
        $datos = [
            'nombre' => $notifiable->name ?: 'usuario',
            'correo' => $this->email,
            'url' => $this->resetUrl($notifiable),
            'minutos' => (int) config('auth.passwords.users.expire', 60),
            'institucion' => 'Institución Educativa N.º 31501 «Sebastián Lorente»',
            'logo' => asset('favicon.png'),
        ];

        return (new MailMessage)
            ->subject('Restablece tu contraseña | IE N.º 31501 Sebastián Lorente')
            ->view('mail.reset-password', $datos)
            ->text('mail.reset-password-text', $datos);
    }

    protected function resetUrl(object $notifiable): string
    {
        return route('panel.password.reset', [
            'token' => $this->token,
            'email' => $this->email,
        ]);
    }
}
