<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class FirstPasswordChangeController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        if (! $usuario->must_change_password) {
            return redirect()->route('panel.index');
        }

        return Inertia::render('Auth/FirstPasswordChange');
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'password.required' => 'Debes ingresar una nueva contraseña.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        $usuario->password = Hash::make($request->string('password')->toString());
        $usuario->must_change_password = false;
        $usuario->save();

        return redirect()
            ->route('panel.index')
            ->with('status', '¡Tu contraseña fue actualizada! Bienvenido al panel.');
    }
}
