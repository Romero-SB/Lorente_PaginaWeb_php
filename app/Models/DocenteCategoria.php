<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocenteCategoria extends Model
{
    protected $table = 'docente_categorias';

    protected $fillable = [
        'nombre',
        'orden',
    ];

    protected $casts = [
        'orden' => 'integer',
    ];

    public function docentes()
    {
        return $this->hasMany(Docente::class, 'categoria', 'nombre');
    }
}
