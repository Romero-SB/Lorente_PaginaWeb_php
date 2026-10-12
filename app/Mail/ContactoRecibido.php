<?php

namespace App\Mail;

use App\Models\ContactoMensaje;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactoRecibido extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tries = 3;

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
