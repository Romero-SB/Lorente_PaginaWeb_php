<?php

namespace App\Support;

use App\Models\Docente;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class PapeleraDocentes
{
    public static function diasPurga(): int
    {
        return (int) config('panel.dias_purga_papelera');
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
        return Docente::onlyTrashed()
            ->with(['createdBy:id,name', 'deletedBy:id,name'])
            ->when($usuario->isAdministrador(), fn (Builder $q) => $q->where('deleted_by', $usuario->id));
    }

    /**
     * Determina si el usuario puede restaurar o eliminar permanentemente un
     * docente que está en la papelera.
     */
    public static function puedeGestionarEliminada(User $usuario, Docente $docente): bool
    {
        if ($usuario->isSuperUsuario()) {
            return true;
        }

        if ($usuario->isAdministrador()) {
            return $docente->deleted_by === $usuario->id;
        }

        return false;
    }

    public static function diasRestantes(Docente $docente): int
    {
        if ($docente->deleted_at === null) {
            return self::diasPurga();
        }

        $dias = (int) floor((now()->timestamp - $docente->deleted_at->timestamp) / 86400);

        return max(0, self::diasPurga() - $dias);
    }

    /**
     * Elimina definitivamente los docentes cuya estancia en la papelera superó
     * el límite de días configurado.
     */
    public static function purgarVencidas(): int
    {
        $vencidas = Docente::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays(self::diasPurga()))
            ->get();

        foreach ($vencidas as $docente) {
            Almacenamiento::eliminar($docente->foto);
            $docente->forceDelete();
        }

        return $vencidas->count();
    }
}
