<?php

namespace App\Policies;

use App\Models\Docente;
use App\Models\User;
use App\Support\PapeleraDocentes;

class DocentePolicy
{
    /**
     * Gestión general del módulo de docentes (crear, editar, papelera).
     */
    public function gestionar(User $usuario): bool
    {
        return $usuario->isAdministrador() || $usuario->isSuperUsuario();
    }

    /**
     * Solo el Super Usuario puede eliminar docentes permanentemente.
     */
    public function eliminarPermanente(User $usuario): bool
    {
        return $usuario->isSuperUsuario();
    }

    /**
     * Determina si el usuario puede restaurar o eliminar permanentemente un
     * docente que ya está en la papelera.
     */
    public function gestionarEliminada(User $usuario, Docente $docente): bool
    {
        return PapeleraDocentes::puedeGestionarEliminada($usuario, $docente);
    }
}
