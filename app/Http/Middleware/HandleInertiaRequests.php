<?php

namespace App\Http\Middleware;

use App\Support\PanelSecciones;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'cargo' => $request->user()->cargo,
                ] : null,
            ],
            'turnstile_site_key' => config('services.turnstile.enabled')
                ? config('services.turnstile.site_key')
                : null,
            'flash' => [
                'ok' => $request->session()->pull('ok'),
                'error' => $request->session()->pull('error'),
                'expired_draft' => $request->session()->pull('expired_draft'),
            ],
            'panel' => fn () => $request->user() ? [
                'rol' => $request->user()->role,
                'rol_etiqueta' => PanelSecciones::etiquetaRol($request->user()->role),
                'secciones' => PanelSecciones::paraRol($request->user()->role),
            ] : null,
        ];
    }
}
