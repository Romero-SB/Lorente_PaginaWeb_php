<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Docente extends Model
{
    use SoftDeletes;

    protected $table = 'docentes';

    protected $fillable = [
        'nombre',
        'cargo',
        'foto',
        'categoria',
        'orden',
        'activo',
        'created_by',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
    ];

    public function categoriaModel()
    {
        return $this->belongsTo(DocenteCategoria::class, 'categoria', 'nombre');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
