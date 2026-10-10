<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Actividad extends Model
{
    protected $table = 'actividad';

    protected $fillable = [
        'user_id',
        'accion',
        'modelo',
        'modelo_id',
        'titulo',
        'descripcion',
        'cambios',
        'ip',
        'user_agent',
    ];

    protected $casts = [
        'cambios' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
