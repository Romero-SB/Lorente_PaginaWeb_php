<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Comunicado;
use App\Support\Almacenamiento;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ComunicadosController extends Controller
{
    public function index(): Response
    {
        $comunicados = Comunicado::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (Comunicado $c) => $this->paraVista($c))
            ->values()
            ->all();

        return Inertia::render('Panel/Comunicados', [
            'comunicados' => $comunicados,
            'vigente_id' => Comunicado::vigente()?->id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'imagen' => ['required', 'file', 'image', 'max:4096'],
            'inicio_at' => ['nullable', 'date'],
            'fin_at' => ['nullable', 'date', 'after_or_equal:inicio_at'],
        ], [
            'imagen.required' => 'Sube una imagen para el comunicado.',
            'imagen.image' => 'El archivo debe ser una imagen.',
            'imagen.max' => 'La imagen no debe superar los 4 MB.',
            'fin_at.after_or_equal' => 'La fecha de fin debe ser igual o posterior al inicio.',
        ]);

        $ruta = Almacenamiento::guardarImagen($request->file('imagen'), 'comunicados');

        if ($ruta === null) {
            return back()->withErrors(['imagen' => 'Formato de imagen no permitido. Usa JPG, PNG o WebP.']);
        }

        Comunicado::create([
            'imagen' => $ruta,
            'activo' => true,
            'inicio_at' => $datos['inicio_at'] ?? now(),
            'fin_at' => $datos['fin_at'] ?? null,
        ]);

        return back()->with('ok', 'Comunicado publicado. Se mostrará a los visitantes que entren al inicio.');
    }

    public function activo(Comunicado $comunicado): RedirectResponse
    {
        $comunicado->update(['activo' => ! $comunicado->activo]);

        return back()->with('ok', $comunicado->activo ? 'Comunicado activado.' : 'Comunicado desactivado.');
    }

    public function destroy(Comunicado $comunicado): RedirectResponse
    {
        Storage::disk(Almacenamiento::disco())->delete($comunicado->imagen);
        $comunicado->delete();

        return back()->with('ok', 'Comunicado eliminado.');
    }

    /** @return array<string, mixed> */
    private function paraVista(Comunicado $c): array
    {
        return [
            'id' => $c->id,
            'imagen_url' => $c->imagen_url,
            'activo' => (bool) $c->activo,
            'inicio_at' => $c->inicio_at?->format('Y-m-d\TH:i'),
            'fin_at' => $c->fin_at?->format('Y-m-d\TH:i'),
            'creado' => $c->created_at?->format('d/m/Y H:i'),
        ];
    }
}
