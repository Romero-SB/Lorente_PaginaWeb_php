<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NoticiaImagen extends Model
{
    protected $table = 'noticia_imagenes';

    protected $fillable = [
        'noticia_id',
        'ruta',
        'es_portada',
        'orden',
    ];

    protected $casts = [
        'es_portada' => 'boolean',
        'orden' => 'integer',
    ];

    public function noticia()
    {
        return $this->belongsTo(Noticia::class);
    }
}
