<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;

class HistorialFiltrosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'usuario' => ['nullable', 'integer', 'exists:users,id'],
            'accion' => ['nullable', 'string', 'max:50'],
            'modelo' => ['nullable', 'string', 'max:150'],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date', 'after_or_equal:desde'],
            'q' => ['nullable', 'string', 'max:100'],
        ];
    }
}
