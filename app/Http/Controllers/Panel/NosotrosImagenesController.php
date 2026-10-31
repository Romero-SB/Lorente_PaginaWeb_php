<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\ReordenarNosotrosImagenesRequest;
use App\Http\Requests\Panel\StoreNosotrosImagenRequest;
use App\Http\Requests\Panel\UpdateNosotrosImagenRequest;
use App\Models\NosotrosImagen;
use App\Support\Almacenamiento;
use App\Support\Historial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NosotrosImagenesController extends Controller
{
    public const MAXIMO = 6;

    public function store(StoreNosotrosImagenRequest $request, Historial $historial): RedirectResponse
    {
        if (NosotrosImagen::query()->count() >= self::MAXIMO) {
            return back()->withErrors(['imagen' => 'Ya hay '.self::MAXIMO.' imágenes. Elimina una para agregar otra.']);
        }

        $ruta = Almacenamiento::guardarImagen($request->file('imagen'), 'config/nosotros');

        if ($ruta === null) {
            return back()->withErrors(['imagen' => 'La imagen no es un formato válido (jpg, png o webp).']);
        }

        $datos = $request->validated();
        $maxOrden = (int) NosotrosImagen::query()->max('orden');

        $imagen = NosotrosImagen::create([
            'ruta' => $ruta,
            'alt' => trim((string) ($datos['alt'] ?? '')) ?: 'Instalaciones de la IE Sebastián Lorente',
            'orden' => $maxOrden + 10,
        ]);

        $historial->registrar($request->user(), 'crear', $imagen, $imagen->alt);

        return back()->with('ok', 'Imagen agregada a Nosotros.');
    }

    public function update(UpdateNosotrosImagenRequest $request, NosotrosImagen $imagen, Historial $historial): RedirectResponse
    {
        $datos = $request->validated();

        $cambios = [
            'alt' => trim((string) ($datos['alt'] ?? '')) ?: 'Instalaciones de la IE Sebastián Lorente',
        ];

        if ($request->hasFile('imagen')) {
            $ruta = Almacenamiento::guardarImagen($request->file('imagen'), 'config/nosotros');

            if ($ruta === null) {
                return back()->withErrors(['imagen' => 'La imagen no es un formato válido (jpg, png o webp).']);
            }

            Almacenamiento::eliminar($imagen->ruta);
            $cambios['ruta'] = $ruta;
        }

        $imagen->update($cambios);

        $historial->registrar($request->user(), 'editar', $imagen, $imagen->alt);

        return back()->with('ok', 'Imagen de Nosotros actualizada.');
    }

    public function destroy(Request $request, NosotrosImagen $imagen, Historial $historial): RedirectResponse
    {
        Almacenamiento::eliminar($imagen->ruta);

        $historial->registrar($request->user(), 'eliminar', $imagen, $imagen->alt);

        $imagen->delete();

        return back()->with('ok', 'Imagen eliminada de Nosotros.');
    }

    public function reordenar(ReordenarNosotrosImagenesRequest $request): RedirectResponse
    {
        /** @var array<int, array{id: int, orden: int}> $items */
        $items = $request->validated('items');

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                NosotrosImagen::query()
                    ->find($item['id'])
                    ?->update(['orden' => $item['orden']]);
            }
        });

        return back()->with('ok', 'Orden actualizado.');
    }
}
