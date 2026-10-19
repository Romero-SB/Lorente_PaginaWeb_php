<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(LoginRequest $request, RateLimiter $limiter): RedirectResponse
    {
        $email = $request->string('email')->toString();
        $key = 'login-attempts:'.$email.'|'.$request->ip();
        $lockKey = 'login-lock:'.$email.'|'.$request->ip();

        if ($limiter->tooManyAttempts($lockKey, 1)) {
            $seconds = $limiter->availableIn($lockKey);

            return back()
                ->withErrors([
                    'email' => 'Demasiados intentos. Intenta nuevamente en '.ceil($seconds / 60).' minutos.',
                ])
                ->onlyInput('email');
        }

        $credenciales = $request->safe()->only(['email', 'password']);

        if (! Auth::attempt($credenciales, $request->boolean('remember'))) {
            $intentos = $limiter->hit($key, 600);

            if ($intentos >= 5) {
                $limiter->hit($lockKey, 3600);
            }

            return back()->withErrors([
                'email' => 'Las credenciales no son correctas.',
            ])->onlyInput('email');
        }

        $usuario = Auth::user();
        if (! $usuario instanceof User) {
            Auth::logout();

            return redirect()->route('panel.login.show');
        }

        $limiter->clear($key);
        $limiter->clear($lockKey);

        $request->session()->regenerate();

        if ($usuario->must_change_password) {
            return redirect()->route('panel.password.first.show');
        }

        return redirect()->route('panel.index');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('panel.login.show');
    }
}
