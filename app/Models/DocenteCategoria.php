<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocenteCategoria extends Model
{
    protected $table = 'docente_categorias';

    /** @var array<int, string> */
    public const FUENTES_PERMITIDAS = ['playfair', 'inter', 'poppins', 'montserrat', 'lora', 'oswald'];

    protected $fillable = [
        'nombre',
        'orden',
        'estilo',
    ];

    protected $casts = [
        'orden' => 'integer',
        'estilo' => 'array',
    ];

    public function docentes()
    {
        return $this->hasMany(Docente::class, 'categoria', 'nombre');
    }
}
