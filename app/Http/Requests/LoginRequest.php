<?php

namespace App\Http\Requests;

use App\Rules\TurnstileRule;
use App\Support\Correo;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normaliza el correo antes de validar para que el inicio de sesión acepte
     * el mismo correo escrito en mayúsculas o minúsculas.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => Correo::normalizar($this->input('email'))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'email' => 'required|email',
            'password' => 'required|string',
        ];

        if (config('services.turnstile.site_key') && config('services.turnstile.enabled', true)) {
            $rules['cf-turnstile-response'] = ['required', new TurnstileRule];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'El correo electrónico es obligatorio',
            'email.email' => 'El correo electrónico debe ser válido',
            'password.required' => 'La contraseña es obligatoria',
            'cf-turnstile-response.required' => 'Por favor, completa la verificación de seguridad.',
        ];
    }
}
