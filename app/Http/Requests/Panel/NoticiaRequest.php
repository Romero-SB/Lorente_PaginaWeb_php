<?php

namespace App\Http\Requests\Panel;

use App\Models\Noticia;
use App\Support\Almacenamiento;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class NoticiaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:200'],
            'fec' => ['required', 'date'],
            'cat' => ['nullable', 'string', Rule::in(array_keys(config('panel.categorias_noticias')))],
            'res' => ['nullable', 'string', 'min:10'],
            'con' => ['nullable', 'string', 'min:20'],
            'est' => ['required', Rule::in([Noticia::EST_PUBLICADO, Noticia::EST_BORRADOR])],
            'imagenes_plan' => ['nullable', 'string'],
            'imagenes_nuevas' => ['array', 'max:10'],
            'imagenes_nuevas.*' => ['file', 'image', 'max:3072'],
            'adjuntos_plan' => ['nullable', 'string'],
            'adjuntos_nuevas' => ['array'],
            'adjuntos_nuevas.*' => ['file', 'mimetypes:'.implode(',', array_keys(Almacenamiento::adjuntosPermitidos())), 'max:15360'],
        ];
    }
}
