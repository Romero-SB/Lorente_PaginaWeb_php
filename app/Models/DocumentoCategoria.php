<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentoCategoria extends Model
{
    protected $table = 'documento_categorias';

    protected $fillable = [
        'nombre',
        'orden',
    ];

    protected $casts = [
        'orden' => 'integer',
    ];

    public function documentos()
    {
        return $this->hasMany(Documento::class, 'categoria', 'nombre');
    }
}
