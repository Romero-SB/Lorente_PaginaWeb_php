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
            'email' => ['required', 'email', 'max:150'],
            'telefono' => ['nullable', 'string', 'max:40'],
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
            'email.required' => 'Ingresa tu correo electrónico.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'mensaje.required' => 'Escribe tu mensaje.',
            'mensaje.min' => 'El mensaje debe tener al menos 10 caracteres.',
            'cf-turnstile-response.required' => 'Por favor, completa la verificación de seguridad.',
        ];
    }
}
