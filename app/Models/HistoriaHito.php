<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoriaHito extends Model
{
    protected $table = 'historia_hitos';

    protected $fillable = [
        'anio',
        'titulo',
        'texto',
        'orden',
    ];

    protected $casts = [
        'orden' => 'integer',
    ];
}
