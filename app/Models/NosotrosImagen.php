<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NosotrosImagen extends Model
{
    protected $table = 'nosotros_imagenes';

    protected $fillable = [
        'ruta',
        'alt',
        'orden',
    ];

    protected $casts = [
        'orden' => 'integer',
    ];
}
