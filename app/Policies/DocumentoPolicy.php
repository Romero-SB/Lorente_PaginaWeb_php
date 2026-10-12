<?php

namespace App\Policies;

use App\Models\Documento;
use App\Models\User;
use App\Support\PapeleraDocumentos;

class DocumentoPolicy
{
    /**
     * Determina si el usuario puede editar o enviar a la papelera el documento.
     */
    public function gestionar(User $usuario, Documento $documento): bool
    {
        return ! $usuario->isDocente() || $documento->author_id === $usuario->id;
    }

    /**
     * Determina si el usuario puede restaurar o eliminar permanentemente un
     * documento que ya está en la papelera.
     */
    public function gestionarEliminada(User $usuario, Documento $documento): bool
    {
        return PapeleraDocumentos::puedeGestionarEliminada($usuario, $documento);
    }

    /**
     * Solo el Super Usuario puede eliminar documentos permanentemente.
     */
    public function eliminarPermanente(User $usuario): bool
    {
        return $usuario->isSuperUsuario();
    }
}
