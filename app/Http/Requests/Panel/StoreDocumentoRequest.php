<?php

namespace App\Http\Requests\Panel;

class StoreDocumentoRequest extends DocumentoRequest
{
    protected function esActualizacion(): bool
    {
        return false;
    }
}
