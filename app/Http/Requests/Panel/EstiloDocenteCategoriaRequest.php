<?php

namespace App\Http\Requests\Panel;

use App\Models\DocenteCategoria;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EstiloDocenteCategoriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'titulo_font' => ['nullable', Rule::in(DocenteCategoria::FUENTES_PERMITIDAS)],
            'titulo_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'titulo_align' => ['nullable', Rule::in(['left', 'center', 'right'])],
            'cargo_font' => ['nullable', Rule::in(DocenteCategoria::FUENTES_PERMITIDAS)],
            'cargo_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'cargo_align' => ['nullable', Rule::in(['left', 'center', 'right'])],
            'fondo' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }
}
