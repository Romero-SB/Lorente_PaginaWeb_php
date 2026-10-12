<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Documento extends Model
{
    use SoftDeletes;

    public const VISIBILIDAD_PUBLICO = 'publico';

    public const VISIBILIDAD_PRIVADO = 'privado';

    protected $table = 'documentos';

    protected $fillable = [
        'titulo',
        'categoria',
        'categoria_id',
        'visibilidad',
        'descripcion',
        'instrucciones',
        'archivo_url',
        'archivo_nombre',
        'author_id',
        'created_by',
    ];

    public function categoriaRef()
    {
        return $this->belongsTo(DocumentoCategoria::class, 'categoria_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function esPrivado(): bool
    {
        return $this->visibilidad === self::VISIBILIDAD_PRIVADO;
    }
}
