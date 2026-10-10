<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Historial;
use App\Support\PanelSecciones;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
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

    public function update(Request $request): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $datos = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($usuario->id)],
            'cargo' => ['nullable', 'string', 'max:200'],
        ], [
            'name.required' => 'Ingresa tu nombre.',
            'email.required' => 'Ingresa tu correo electrónico.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'email.unique' => 'Ese correo ya está en uso por otra cuenta.',
        ]);

        $usuario->name = trim($datos['name']);
        $usuario->email = $datos['email'];
        $usuario->cargo = trim((string) ($datos['cargo'] ?? '')) ?: null;
        $usuario->save();

        Historial::registrar($usuario, 'editar', $usuario, 'Perfil: '.$usuario->name);

        return back()->with('ok', 'Perfil actualizado correctamente.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $request->validate([
            'actual' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'actual.required' => 'Ingresa tu contraseña actual.',
            'actual.current_password' => 'La contraseña actual no es correcta.',
            'password.required' => 'Ingresa una nueva contraseña.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        $usuario->password = Hash::make($request->string('password')->toString());
        $usuario->must_change_password = false;
        $usuario->save();

        Historial::registrar($usuario, 'cambiar contraseña', $usuario, $usuario->name);

        return back()->with('ok', 'Contraseña actualizada correctamente.');
    }
}
