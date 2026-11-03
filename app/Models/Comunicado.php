<?php

namespace App\Models;

use App\Support\Almacenamiento;
use Illuminate\Database\Eloquent\Model;

class Comunicado extends Model
{
    protected $table = 'comunicados';

    protected $fillable = ['imagen', 'enlace', 'activo', 'inicio_at', 'fin_at'];

    protected $casts = [
        'activo' => 'boolean',
        'inicio_at' => 'datetime',
        'fin_at' => 'datetime',
    ];

    protected $appends = ['imagen_url'];

    /** Comunicado que se muestra hoy: el más reciente activo dentro de su ventana de fechas. */
    public static function vigente(): ?self
    {
        $ahora = now();

        return self::query()
            ->where('activo', true)
            ->where(fn ($q) => $q->whereNull('inicio_at')->orWhere('inicio_at', '<=', $ahora))
            ->where(fn ($q) => $q->whereNull('fin_at')->orWhere('fin_at', '>=', $ahora))
            ->orderByDesc('id')
            ->first();
    }

    public function getImagenUrlAttribute(): string
    {
        return Almacenamiento::url($this->imagen);
    }
}