<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;

class HistoriaHitoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'anio' => ['required', 'string', 'max:20'],
            'titulo' => ['required', 'string', 'max:150'],
            'texto' => ['required', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'anio.required' => 'Ingresa el año o periodo del hito.',
            'titulo.required' => 'Ingresa el título del hito.',
            'texto.required' => 'Ingresa la descripción del hito.',
            'texto.max' => 'La descripción no debe superar los 1000 caracteres.',
        ];
    }
}
