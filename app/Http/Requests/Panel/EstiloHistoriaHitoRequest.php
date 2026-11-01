<?php

namespace App\Http\Requests\Panel;

use App\Models\HistoriaHito;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EstiloHistoriaHitoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'anio_font' => ['nullable', Rule::in(HistoriaHito::FUENTES_PERMITIDAS)],
            'anio_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'titulo_font' => ['nullable', Rule::in(HistoriaHito::FUENTES_PERMITIDAS)],
            'titulo_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'texto_font' => ['nullable', Rule::in(HistoriaHito::FUENTES_PERMITIDAS)],
            'texto_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }
}
