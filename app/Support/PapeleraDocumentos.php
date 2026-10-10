<?php

namespace App\Support;

use App\Models\Documento;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class PapeleraDocumentos
{
    public static function diasPurga(): int
    {
        return (int) config('panel.dias_purga_papelera');
    }

    /**
     * Consulta de documentos en la papelera visibles para el usuario.
     *
     * - Docente: solo los de su autoría.
     * - Administrador: los suyos y los de autoría docente.
     * - Super Usuario: todos.
     *
     * @return Builder<Documento>
     */
    public static function consultaVisible(User $usuario): Builder
    {
        return Documento::onlyTrashed()
            ->with(['author:id,name,cargo,role', 'deletedBy:id,name'])
            ->when($usuario->isDocente(), fn (Builder $q) => $q->where('author_id', $usuario->id))
            ->when($usuario->isAdministrador(), fn (Builder $q) => $q->where(function (Builder $sub) use ($usuario) {
                $sub->where('author_id', $usuario->id)
                    ->orWhereHas('author', fn (Builder $a) => $a->where('role', User::ROLE_DOCENTE));
            }));
    }

    public static function puedeGestionarEliminada(User $usuario, Documento $documento): bool
    {
        if ($usuario->isSuperUsuario()) {
            return true;
        }

        if ($usuario->isDocente()) {
            return $documento->author_id === $usuario->id;
        }

        return $documento->author_id === $usuario->id
            || $documento->author?->role === User::ROLE_DOCENTE;
    }

    public static function diasRestantes(Documento $documento): int
    {
        if ($documento->deleted_at === null) {
            return self::diasPurga();
        }

        $dias = (int) floor((now()->timestamp - $documento->deleted_at->timestamp) / 86400);

        return max(0, self::diasPurga() - $dias);
    }

    public static function purgarVencidas(): int
    {
        $vencidas = Documento::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays(self::diasPurga()))
            ->get();

        foreach ($vencidas as $documento) {
            ArchivosDocumentos::eliminar($documento->archivo_url, $documento->visibilidad);
            $documento->forceDelete();
        }

        return $vencidas->count();
    }
}
