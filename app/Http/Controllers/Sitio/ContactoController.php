<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sitio\ContactoRequest;
use App\Mail\ContactoRecibido;
use App\Models\Config;
use App\Models\ContactoMensaje;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;

class ContactoController extends Controller
{
    public function store(ContactoRequest $request): RedirectResponse
    {
        $datos = $request->validated();

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

        Mail::to($destino)->queue(new ContactoRecibido($mensaje));
    }
}
