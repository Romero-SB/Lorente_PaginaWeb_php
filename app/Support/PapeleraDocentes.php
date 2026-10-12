<?php

namespace App\Support;

use App\Models\Docente;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PapeleraDocentes extends Papelera
{
    protected static function modelo(): string
    {
        return Docente::class;
    }

    protected static function clavePurga(): string
    {
        return 'papelera.docentes.purga';
    }

    /** @return array<int, string> */
    protected static function conRelacionesTrashed(): array
    {
        return ['createdBy:id,name', 'deletedBy:id,name'];
    }

    /**
     * Consulta de docentes en la papelera visibles para el usuario.
     *
     * - Administrador: solo los que él envió a la papelera.
     * - Super Usuario: todos.
     *
     * @return Builder<Docente>
     */
    public static function consultaVisible(User $usuario): Builder
    {
        $modelo = static::modelo();

        return $modelo::onlyTrashed()
            ->with(static::conRelacionesTrashed())
            ->when($usuario->isAdministrador(), fn ($q) => $q->where('deleted_by', $usuario->id));
    }

    public static function puedeGestionarEliminada(User $usuario, Model $registro): bool
    {
        if ($usuario->isSuperUsuario()) {
            return true;
        }

        return $usuario->isAdministrador() && $registro->deleted_by === $usuario->id;
    }

    public static function eliminarArchivos(Model $registro): void
    {
        Almacenamiento::eliminar($registro->foto);
    }
}
