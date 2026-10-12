<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class DocenteRequest extends FormRequest
{
    abstract protected function esActualizacion(): bool;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $reglas = [
            'nombre' => ['required', 'string', 'max:200'],
            'cargo' => ['required', 'string', 'max:200'],
            'categoria' => ['required', 'string', Rule::exists('docente_categorias', 'nombre')],
            'foto' => [$this->esActualizacion() ? 'nullable' : 'required', 'file', 'image', 'max:3072'],
        ];

        if ($this->esActualizacion()) {
            $reglas['foto_borrar'] = ['nullable', 'boolean'];
        }

        return $reglas;
    }
}
