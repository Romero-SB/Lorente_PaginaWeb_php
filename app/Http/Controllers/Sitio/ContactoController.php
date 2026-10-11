<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Mail\ContactoRecibido;
use App\Models\Config;
use App\Models\ContactoMensaje;
use App\Rules\TurnstileRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactoController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $reglas = [
            'nombre' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'telefono' => ['nullable', 'string', 'max:40'],
            'asunto' => ['nullable', 'string', 'max:150'],
            'mensaje' => ['required', 'string', 'min:10', 'max:4000'],
        ];

        if (config('services.turnstile.site_key') && config('services.turnstile.enabled', true)) {
            $reglas['cf-turnstile-response'] = ['required', new TurnstileRule];
        }

        $datos = $request->validate($reglas, [
            'nombre.required' => 'Ingresa tu nombre.',
            'email.required' => 'Ingresa tu correo electrónico.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'mensaje.required' => 'Escribe tu mensaje.',
            'mensaje.min' => 'El mensaje debe tener al menos 10 caracteres.',
            'cf-turnstile-response.required' => 'Por favor, completa la verificación de seguridad.',
        ]);

        $mensaje = ContactoMensaje::create([
            'nombre' => trim($datos['nombre']),
            'email' => $datos['email'],
            'telefono' => trim((string) ($datos['telefono'] ?? '')) ?: null,
            'asunto' => trim((string) ($datos['asunto'] ?? '')) ?: null,
            'mensaje' => trim($datos['mensaje']),
            'ip' => $request->ip(),
        ]);

        $this->notificar($mensaje);

        return back()->with('ok', '¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.');
    }

    private function notificar(ContactoMensaje $mensaje): void
    {
        $destino = Config::actual()->email ?: config('mail.from.address');

        if (blank($destino)) {
            return;
        }

        Mail::to($destino)->send(new ContactoRecibido($mensaje));
    }
}
