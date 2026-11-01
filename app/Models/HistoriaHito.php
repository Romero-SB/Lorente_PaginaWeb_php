<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoriaHito extends Model
{
    protected $table = 'historia_hitos';

    /** @var array<int, string> */
    public const FUENTES_PERMITIDAS = ['playfair', 'inter', 'poppins', 'montserrat', 'lora', 'oswald'];

    protected $fillable = [
        'anio',
        'titulo',
        'texto',
        'orden',
        'estilo',
    ];

    protected $casts = [
        'orden' => 'integer',
        'estilo' => 'array',
    ];

    public function claveAnio(): string
    {
        preg_match('/\d{4}/', $this->anio, $coincidencia);

        return ($coincidencia[0] ?? '9999').str_pad((string) $this->id, 12, '0', STR_PAD_LEFT);
    }
}
