<?php

namespace App\Http\Requests\Sitio;

use App\Rules\TurnstileRule;
use Illuminate\Foundation\Http\FormRequest;

class ContactoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $reglas = [
            'nombre' => ['required', 'string', 'max:150'],
            'telefono' => ['required', 'string', 'regex:/^\+?[0-9\s\-()]{6,20}$/'],
            'email' => ['nullable', 'email', 'max:150'],
            'asunto' => ['nullable', 'string', 'max:150'],
            'mensaje' => ['required', 'string', 'min:10', 'max:4000'],
        ];

        if (config('services.turnstile.site_key') && config('services.turnstile.enabled', true)) {
            $reglas['cf-turnstile-response'] = ['required', new TurnstileRule];
        }

        return $reglas;
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'nombre.required' => 'Ingresa tu nombre.',
            'telefono.required' => 'Ingresa tu número de teléfono para poder responderte.',
            'telefono.regex' => 'Ingresa un número de teléfono válido.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'mensaje.required' => 'Escribe tu mensaje.',
            'mensaje.min' => 'El mensaje debe tener al menos 10 caracteres.',
            'cf-turnstile-response.required' => 'Por favor, completa la verificación de seguridad.',
        ];
    }
}
