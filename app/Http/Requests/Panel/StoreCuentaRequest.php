<?php

namespace App\Http\Requests\Panel;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreCuentaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'cargo' => ['nullable', 'string', 'max:200'],
            'role' => ['required', Rule::in($this->rolesAsignables())],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Ingresa el nombre de la persona.',
            'email.required' => 'Ingresa el correo electrónico.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'email.unique' => 'Ese correo ya está en uso por otra cuenta.',
            'role.required' => 'Selecciona un rol.',
            'role.in' => 'El rol seleccionado no es válido.',
            'password.required' => 'Ingresa una contraseña.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ];
    }

    /** @return array<int, string> */
    private function rolesAsignables(): array
    {
        return $this->user()?->isSuperUsuario()
            ? [User::ROLE_ADMIN, User::ROLE_DOCENTE]
            : [User::ROLE_DOCENTE];
    }
}
