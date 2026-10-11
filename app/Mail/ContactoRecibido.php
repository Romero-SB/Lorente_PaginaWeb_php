<?php

namespace App\Mail;

use App\Models\ContactoMensaje;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactoRecibido extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ContactoMensaje $mensaje) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nuevo mensaje de contacto: '.($this->mensaje->asunto ?: 'Sin asunto'),
            replyTo: [$this->mensaje->email],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.contacto-recibido',
        );
    }
}
