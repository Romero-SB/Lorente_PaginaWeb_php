<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Adjunto extends Model
{
    protected $table = 'adjuntos';

    protected $fillable = [
        'noticia_id',
        'nombre',
        'ruta',
        'mime',
        'peso',
        'orden',
    ];

    protected $casts = [
        'peso' => 'integer',
        'orden' => 'integer',
    ];

    public function noticia()
    {
        return $this->belongsTo(Noticia::class);
    }
}
