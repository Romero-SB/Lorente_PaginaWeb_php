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
use Illuminate\Support\Facades\DB;
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
        $email = Correo::normalizar($request->string('email')->toString()) ?? '';

        $estado = match (true) {
            $this->tokenUsado($email, $token) => 'usado',
            $this->tokenValido($email, $token) => 'valido',
            default => 'invalido',
        };

        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $email,
            'estado' => $estado,
        ]);
    }

    public function update(ResetPasswordRequest $request): RedirectResponse
    {
        $credentials = $request->only('email', 'password', 'password_confirmation', 'token');
        $email = Correo::normalizar($credentials['email']) ?? '';
        $token = (string) $credentials['token'];
        $credentials['email'] = $email;

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
            $this->registrarTokenUsado($email, $token);

            return redirect()
                ->route('panel.login.show')
                ->with('status', 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.')
                ->with('email', $email);
        }

        if ($status === Password::INVALID_TOKEN) {
            return redirect()->route('panel.password.reset', [
                'token' => $token,
                'email' => $email,
            ]);
        }

        return back()->withErrors([
            'email' => 'No fue posible restablecer la contraseña.',
        ])->withInput($request->only('email'));
    }

    private function tokenValido(string $email, string $token): bool
    {
        if ($email === '' || $token === '') {
            return false;
        }

        $usuario = User::where('email', $email)->first();

        return $usuario !== null && Password::broker()->tokenExists($usuario, $token);
    }

    private function tokenUsado(string $email, string $token): bool
    {
        if ($email === '' || $token === '') {
            return false;
        }

        return DB::table('password_reset_used_tokens')
            ->where('email', $email)
            ->where('token_hash', hash('sha256', $token))
            ->exists();
    }

    private function registrarTokenUsado(string $email, string $token): void
    {
        DB::table('password_reset_used_tokens')->updateOrInsert(
            ['token_hash' => hash('sha256', $token)],
            ['email' => $email, 'used_at' => now()],
        );
    }
}
