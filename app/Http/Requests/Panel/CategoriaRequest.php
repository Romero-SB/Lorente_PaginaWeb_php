<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class CategoriaRequest extends FormRequest
{
    /** @return string Nombre de la tabla de categorías. */
    abstract protected function tabla(): string;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $unico = Rule::unique($this->tabla(), 'nombre');

        $categoria = $this->route('categoria');

        if ($categoria !== null) {
            $unico->ignore($categoria);
        }

        return [
            'nombre' => ['required', 'string', 'max:100', $unico],
        ];
    }
}
