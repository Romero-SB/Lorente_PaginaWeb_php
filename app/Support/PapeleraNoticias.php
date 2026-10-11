<?php

namespace App\Support;

use App\Models\Noticia;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class PapeleraNoticias
{
    public static function diasPurga(): int
    {
        return (int) config('panel.dias_purga_papelera');
    }

    /**
     * Consulta de noticias en la papelera visibles para el usuario.
     *
     * - Docente: solo las de su autoría.
     * - Administrador: las suyas y las de autoría docente.
     * - Super Usuario: todas.
     *
     * @return Builder<Noticia>
     */
    public static function consultaVisible(User $usuario): Builder
    {
        return Noticia::onlyTrashed()
            ->with(['author:id,name,cargo,role', 'updatedBy:id,name', 'deletedBy:id,name', 'imagenes', 'adjuntos'])
            ->when($usuario->isDocente(), fn (Builder $q) => $q->where('author_id', $usuario->id))
            ->when($usuario->isAdministrador(), fn (Builder $q) => $q->where(function (Builder $sub) use ($usuario) {
                $sub->where('author_id', $usuario->id)
                    ->orWhereHas('author', fn (Builder $a) => $a->where('role', User::ROLE_DOCENTE));
            }));
    }

    /**
     * Determina si el usuario puede restaurar o eliminar permanentemente una
     * noticia que está en la papelera.
     */
    public static function puedeGestionarEliminada(User $usuario, Noticia $noticia): bool
    {
        if ($usuario->isSuperUsuario()) {
            return true;
        }

        if ($usuario->isDocente()) {
            return $noticia->author_id === $usuario->id;
        }

        return $noticia->author_id === $usuario->id
            || $noticia->author?->role === User::ROLE_DOCENTE;
    }

    public static function diasRestantes(Noticia $noticia): int
    {
        if ($noticia->deleted_at === null) {
            return self::diasPurga();
        }

        $dias = (int) floor((now()->timestamp - $noticia->deleted_at->timestamp) / 86400);

        return max(0, self::diasPurga() - $dias);
    }

    public static function eliminarArchivos(Noticia $noticia): void
    {
        foreach ($noticia->imagenes as $imagen) {
            Almacenamiento::eliminar($imagen->ruta);
        }

        foreach ($noticia->adjuntos as $adjunto) {
            Almacenamiento::eliminar($adjunto->ruta);
        }
    }

    /**
     * Elimina definitivamente las noticias cuya estancia en la papelera superó
     * el límite de días configurado.
     */
    public static function purgarVencidas(): int
    {
        $vencidas = Noticia::onlyTrashed()
            ->with(['imagenes', 'adjuntos'])
            ->where('deleted_at', '<', now()->subDays(self::diasPurga()))
            ->get();

        foreach ($vencidas as $noticia) {
            self::eliminarArchivos($noticia);
            $noticia->forceDelete();
        }

        return $vencidas->count();
    }

    /**
     * Ejecuta la purga como máximo una vez cada 6 horas para no recorrer la
     * papelera en cada petición al panel.
     */
    public static function purgarVencidasSiCorresponde(): int
    {
        if (! Cache::add('papelera.noticias.purga', now()->timestamp, now()->addHours(6))) {
            return 0;
        }

        return self::purgarVencidas();
    }
}
