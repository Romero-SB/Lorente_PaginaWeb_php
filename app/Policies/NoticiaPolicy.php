<?php

namespace App\Policies;

use App\Models\Noticia;
use App\Models\User;
use App\Support\PapeleraNoticias;

class NoticiaPolicy
{
    /**
     * Determina si el usuario puede editar o enviar a la papelera la noticia.
     */
    public function gestionar(User $usuario, Noticia $noticia): bool
    {
        return ! $usuario->isDocente() || $noticia->author_id === $usuario->id;
    }

    /**
     * Determina si el usuario puede restaurar o eliminar permanentemente una
     * noticia que ya está en la papelera.
     */
    public function gestionarEliminada(User $usuario, Noticia $noticia): bool
    {
        return PapeleraNoticias::puedeGestionarEliminada($usuario, $noticia);
    }
}
