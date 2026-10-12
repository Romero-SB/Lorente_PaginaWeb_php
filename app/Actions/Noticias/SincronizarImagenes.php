<?php

namespace App\Actions\Noticias;

use App\Models\Noticia;
use App\Models\NoticiaImagen;
use App\Support\Almacenamiento;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class SincronizarImagenes
{
    /**
     * Sincroniza las imágenes de una noticia con el orden enviado por el
     * editor: elimina las removidas, guarda las nuevas y reindexa el orden.
     *
     * @param  array<int, UploadedFile>  $nuevas
     */
    public function ejecutar(Noticia $noticia, ?string $planJson, array $nuevas): void
    {
        $plan = $this->descifrarPlan($planJson);
        $nuevas = array_values($nuevas);

        $cuentaNuevas = count(array_filter($plan, fn ($e) => ($e['tipo'] ?? '') === 'nueva'));

        if ($cuentaNuevas !== count($nuevas)) {
            throw ValidationException::withMessages([
                'imagenes_plan' => 'Los archivos de imagen no coinciden con el orden enviado.',
            ]);
        }

        if (count($plan) > 10) {
            throw ValidationException::withMessages([
                'imagenes_plan' => 'Máximo 10 imágenes por noticia.',
            ]);
        }

        $existentes = collect($plan)
            ->filter(fn ($e) => ($e['tipo'] ?? '') !== 'nueva')
            ->pluck('id');

        foreach ($noticia->imagenes()->whereNotIn('id', $existentes)->get() as $imagen) {
            Almacenamiento::eliminar($imagen->ruta);
            $imagen->delete();
        }

        $ref = 0;
        foreach ($plan as $orden => $item) {
            if (($item['tipo'] ?? '') === 'nueva') {
                $archivo = $nuevas[$ref];
                $ruta = Almacenamiento::guardarImagen($archivo);

                if ($ruta === null) {
                    throw ValidationException::withMessages([
                        'imagenes_nuevas' => "El archivo {$archivo->getClientOriginalName()} no es una imagen válida.",
                    ]);
                }

                NoticiaImagen::create([
                    'noticia_id' => $noticia->id,
                    'ruta' => $ruta,
                    'es_portada' => $orden === 0,
                    'orden' => $orden,
                ]);
                $ref++;

                continue;
            }

            $imagen = $noticia->imagenes()->find($item['id']);

            if ($imagen === null) {
                throw ValidationException::withMessages([
                    'imagenes_plan' => 'La imagen existe en el orden enviado no existe.',
                ]);
            }

            $imagen->update(['es_portada' => $orden === 0, 'orden' => $orden]);
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function descifrarPlan(?string $json): array
    {
        if (blank($json)) {
            return [];
        }

        $plan = json_decode($json, true);

        if (! is_array($plan)) {
            return [];
        }

        return array_map(fn ($e) => (array) $e, $plan);
    }
}
