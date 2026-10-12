<?php

namespace App\Http\Requests\Panel;

class UpdateDocumentoRequest extends DocumentoRequest
{
    protected function esActualizacion(): bool
    {
        return true;
    }
}
