<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

abstract class Papelera
{
    /** @return class-string<Model> */
    abstract protected static function modelo(): string;

    abstract protected static function clavePurga(): string;

    /**
     * Relaciones a precargar en la consulta de la papelera.
     *
     * @return array<int, string>
     */
    protected static function conRelacionesTrashed(): array
    {
        return [];
    }

    /**
     * Relaciones a precargar antes de purgar (archivos, etc.).
     *
     * @return array<int, string>
     */
    protected static function conRelacionesPurga(): array
    {
        return [];
    }

    abstract public static function eliminarArchivos(Model $registro): void;

    public static function diasPurga(): int
    {
        return (int) config('panel.dias_purga_papelera');
    }

    /**
     * Consulta de registros en la papelera visibles para el usuario.
     *
     * - Docente: solo los de su autoría.
     * - Administrador: los suyos y los de autoría docente.
     * - Super Usuario: todos.
     *
     * @return Builder<Model>
     */
    public static function consultaVisible(User $usuario): Builder
    {
        $modelo = static::modelo();

        return $modelo::onlyTrashed()
            ->with(static::conRelacionesTrashed())
            ->when($usuario->isDocente(), fn (Builder $q) => $q->where('author_id', $usuario->id))
            ->when($usuario->isAdministrador(), fn (Builder $q) => $q->where(function (Builder $sub) use ($usuario) {
                $sub->where('author_id', $usuario->id)
                    ->orWhereHas('author', fn (Builder $a) => $a->where('role', User::ROLE_DOCENTE));
            }));
    }

    /**
     * Determina si el usuario puede restaurar o eliminar permanentemente un
     * registro que está en la papelera.
     */
    public static function puedeGestionarEliminada(User $usuario, Model $registro): bool
    {
        if ($usuario->isSuperUsuario()) {
            return true;
        }

        if ($usuario->isDocente()) {
            return $registro->author_id === $usuario->id;
        }

        return $registro->author_id === $usuario->id
            || $registro->author?->role === User::ROLE_DOCENTE;
    }

    public static function diasRestantes(Model $registro): int
    {
        if ($registro->deleted_at === null) {
            return self::diasPurga();
        }

        $dias = (int) floor((now()->timestamp - $registro->deleted_at->timestamp) / 86400);

        return max(0, self::diasPurga() - $dias);
    }

    /**
     * Elimina definitivamente los registros cuya estancia en la papelera superó
     * el límite de días configurado.
     */
    public static function purgarVencidas(): int
    {
        $modelo = static::modelo();

        $vencidas = $modelo::onlyTrashed()
            ->with(static::conRelacionesPurga())
            ->where('deleted_at', '<', now()->subDays(self::diasPurga()))
            ->get();

        foreach ($vencidas as $registro) {
            static::eliminarArchivos($registro);
            $registro->forceDelete();
        }

        return $vencidas->count();
    }

    /**
     * Ejecuta la purga como máximo una vez cada 6 horas para no recorrer la
     * papelera en cada petición al panel.
     */
    public static function purgarVencidasSiCorresponde(): int
    {
        if (! Cache::add(static::clavePurga(), now()->timestamp, now()->addHours(6))) {
            return 0;
        }

        return static::purgarVencidas();
    }
}
