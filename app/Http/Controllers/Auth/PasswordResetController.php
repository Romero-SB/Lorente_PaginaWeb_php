<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Support\Correo;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    public function showForgot(): Response
    {
        return Inertia::render('Auth/Login', [
            'vista' => 'recuperar',
            'status' => session('status'),
        ]);
    }

    public function send(ForgotPasswordRequest $request): RedirectResponse
    {
        try {
            $status = Password::sendResetLink([
                'email' => Correo::normalizar($request->string('email')->toString()),
            ]);
        } catch (\Throwable $e) {
            Log::error('Error enviando correo de recuperación: '.$e->getMessage());

            return back()
                ->withErrors(['email' => 'El servicio de correos no está disponible temporalmente. Intenta más tarde o contacta al soporte técnico.'])
                ->withInput();
        }

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('status', 'Te enviamos un enlace para restablecer tu contraseña.');
        }

        return back()->with('status', 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.');
    }

    public function showReset(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->string('email')->toString(),
        ]);
    }

    public function update(ResetPasswordRequest $request): RedirectResponse
    {
        $credentials = $request->only('email', 'password', 'password_confirmation', 'token');
        $credentials['email'] = Correo::normalizar($credentials['email']);

        $status = Password::reset(
            $credentials,
            function (User $usuario, string $password): void {
                $usuario->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                    'must_change_password' => false,
                ])->save();

                event(new PasswordReset($usuario));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()
                ->route('panel.login.show')
                ->with('status', 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.');
        }

        return back()->withErrors([
            'email' => $status === Password::INVALID_TOKEN
                ? 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.'
                : 'No fue posible restablecer la contraseña.',
        ])->withInput($request->only('email'));
    }
}
