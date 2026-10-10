<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactoMensaje extends Model
{
    protected $table = 'contacto_mensajes';

    protected $fillable = [
        'nombre',
        'email',
        'telefono',
        'asunto',
        'mensaje',
        'leido',
        'respondido_at',
        'ip',
    ];

    protected $casts = [
        'leido' => 'boolean',
        'respondido_at' => 'datetime',
    ];
}
