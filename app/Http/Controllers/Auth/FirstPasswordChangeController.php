<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\FirstPasswordChangeRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

    public function update(FirstPasswordChangeRequest $request): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $usuario->password = Hash::make($request->string('password')->toString());
        $usuario->must_change_password = false;
        $usuario->save();

        return redirect()
            ->route('panel.index')
            ->with('status', '¡Tu contraseña fue actualizada! Bienvenido al panel.');
    }
}
