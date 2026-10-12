<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;

class ConfiguracionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'estudiantes' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'docentes_count' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'anio_fundacion' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'niveles' => ['nullable', 'string', 'max:255'],
            'mision' => ['nullable', 'string', 'max:2000'],
            'vision' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.email' => 'Ingresa un correo electrónico válido.',
            'estudiantes.integer' => 'La cantidad de estudiantes debe ser un número.',
            'docentes_count.integer' => 'La cantidad de docentes debe ser un número.',
            'anio_fundacion.integer' => 'El año de fundación debe ser un número.',
            'anio_fundacion.min' => 'El año de fundación no parece válido.',
            'anio_fundacion.max' => 'El año de fundación no parece válido.',
        ];
    }
}
