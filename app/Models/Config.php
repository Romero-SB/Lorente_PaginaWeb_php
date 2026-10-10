<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Config extends Model
{
    protected $table = 'config';

    protected $fillable = [
        'phone',
        'email',
        'direccion',
        'estudiantes',
        'docentes_count',
        'anio_fundacion',
        'niveles',
        'mision',
        'vision',
        'updated_by',
    ];

    protected $casts = [
        'estudiantes' => 'integer',
        'docentes_count' => 'integer',
        'anio_fundacion' => 'integer',
    ];

    public static function actual(): self
    {
        return static::query()->firstOrCreate(['id' => 1]);
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
