<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DebeCambiarPassword
{
    /**
     * Obliga a cambiar la contraseña antes de usar el panel.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario && $usuario->must_change_password) {
            return redirect()->route('panel.password.first.show');
        }

        return $next($request);
    }
}
