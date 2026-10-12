<?php

namespace App\Http\Requests\Panel;

class UpdateDocenteRequest extends DocenteRequest
{
    protected function esActualizacion(): bool
    {
        return true;
    }
}
