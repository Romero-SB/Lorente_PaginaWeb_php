<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\ActualizarPerfilRequest;
use App\Http\Requests\Panel\CambiarPasswordRequest;
use App\Models\User;
use App\Support\Historial;
use App\Support\PanelSecciones;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PerfilController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $usuario */
        $usuario = $request->user();

        return Inertia::render('Panel/Perfil', [
            'perfil' => [
                'name' => $usuario->name,
                'email' => $usuario->email,
                'cargo' => $usuario->cargo,
                'rol' => $usuario->role,
                'rol_etiqueta' => PanelSecciones::etiquetaRol($usuario->role),
                'debe_cambiar_password' => $usuario->must_change_password,
            ],
        ]);
    }

    public function update(ActualizarPerfilRequest $request, Historial $historial): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $datos = $request->validated();

        $usuario->name = trim($datos['name']);
        $usuario->cargo = trim((string) ($datos['cargo'] ?? '')) ?: null;
        $usuario->save();

        $historial->registrar($usuario, 'editar', $usuario, 'Perfil: '.$usuario->name);

        return back()->with('ok', 'Perfil actualizado correctamente.');
    }

    public function updatePassword(CambiarPasswordRequest $request, Historial $historial): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $usuario->password = Hash::make($request->string('password')->toString());
        $usuario->must_change_password = false;
        $usuario->save();

        $historial->registrar($usuario, 'cambiar contraseña', $usuario, $usuario->name);

        return back()->with('ok', 'Contraseña actualizada correctamente.');
    }
}
