<?php

namespace App\Http\Requests\Panel;

class DocenteCategoriaRequest extends CategoriaRequest
{
    protected function tabla(): string
    {
        return 'docente_categorias';
    }
}
