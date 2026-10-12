<?php

namespace App\Http\Requests\Auth;

use App\Rules\TurnstileRule;
use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $rules = [
            'email' => ['required', 'email'],
        ];

        if (config('services.turnstile.site_key') && config('services.turnstile.enabled', true)) {
            $rules['cf-turnstile-response'] = ['required', new TurnstileRule];
        }

        return $rules;
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.required' => 'Ingresa tu correo electrónico.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'cf-turnstile-response.required' => 'Por favor, completa la verificación de seguridad.',
        ];
    }
}
