<?php

namespace App\Http\Requests\Panel;

use App\Models\Documento;
use App\Support\ArchivosDocumentos;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class DocumentoRequest extends FormRequest
{
    public const MAX_KB = 20480;

    abstract protected function esActualizacion(): bool;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:200'],
            'categoria' => ['required', 'string', Rule::exists('documento_categorias', 'nombre')],
            'visibilidad' => ['required', Rule::in([
                Documento::VISIBILIDAD_PUBLICO,
                Documento::VISIBILIDAD_PRIVADO,
            ])],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'instrucciones' => ['nullable', 'string', 'max:2000'],
            'archivo' => [
                $this->esActualizacion() ? 'nullable' : 'required',
                'file',
                'mimes:'.implode(',', ArchivosDocumentos::extensiones()),
                'max:'.self::MAX_KB,
            ],
        ];
    }
}
