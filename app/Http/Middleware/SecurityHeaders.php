<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Agrega cabeceras de seguridad a todas las respuestas.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $this->agregar($response, 'X-Content-Type-Options', 'nosniff');
        $this->agregar($response, 'X-Frame-Options', 'SAMEORIGIN');
        $this->agregar($response, 'Referrer-Policy', 'strict-origin-when-cross-origin');
        $this->agregar($response, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        if ($request->isSecure()) {
            $this->agregar($response, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if (! app()->environment('local') && $this->esHtml($response)) {
            $this->agregar($response, 'Content-Security-Policy', $this->politica());
        }

        return $response;
    }

    private function agregar(Response $response, string $cabecera, string $valor): void
    {
        if (! $response->headers->has($cabecera)) {
            $response->headers->set($cabecera, $valor);
        }
    }

    private function esHtml(Response $response): bool
    {
        return str_contains((string) $response->headers->get('Content-Type'), 'text/html');
    }

    private function politica(): string
    {
        return implode('; ', [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "img-src 'self' data: blob:",
            "media-src 'self' data: blob:",
            "font-src 'self' data: https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
            "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
            "connect-src 'self' https://challenges.cloudflare.com",
            'frame-src https://challenges.cloudflare.com',
            "worker-src 'self' blob:",
        ]);
    }
}
