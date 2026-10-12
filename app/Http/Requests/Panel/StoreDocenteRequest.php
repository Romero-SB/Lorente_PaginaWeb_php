<?php

namespace App\Http\Requests\Panel;

class StoreDocenteRequest extends DocenteRequest
{
    protected function esActualizacion(): bool
    {
        return false;
    }
}
