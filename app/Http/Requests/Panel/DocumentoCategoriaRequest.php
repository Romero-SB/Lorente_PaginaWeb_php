<?php

namespace App\Http\Requests\Panel;

class DocumentoCategoriaRequest extends CategoriaRequest
{
    protected function tabla(): string
    {
        return 'documento_categorias';
    }
}
