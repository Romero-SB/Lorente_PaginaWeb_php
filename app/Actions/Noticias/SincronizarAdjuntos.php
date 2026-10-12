<?php

namespace App\Actions\Noticias;

use App\Models\Adjunto;
use App\Models\Noticia;
use App\Support\Almacenamiento;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class SincronizarAdjuntos
{
    /**
     * Sincroniza los adjuntos de una noticia con el orden enviado por el
     * editor: elimina los removidos, guarda los nuevos y reindexa el orden.
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
                'adjuntos_plan' => 'Los archivos adjuntos no coinciden con el orden enviado.',
            ]);
        }

        $existentes = collect($plan)
            ->filter(fn ($e) => ($e['tipo'] ?? '') !== 'nueva')
            ->pluck('id');

        foreach ($noticia->adjuntos()->whereNotIn('id', $existentes)->get() as $adjunto) {
            Almacenamiento::eliminar($adjunto->ruta);
            $adjunto->delete();
        }

        $ref = 0;
        foreach ($plan as $orden => $item) {
            if (($item['tipo'] ?? '') === 'nueva') {
                $archivo = $nuevas[$ref];
                $guardado = Almacenamiento::guardarAdjunto($archivo);

                if ($guardado === null) {
                    throw ValidationException::withMessages([
                        'adjuntos_nuevas' => "El archivo {$archivo->getClientOriginalName()} no es un tipo permitido.",
                    ]);
                }

                Adjunto::create([
                    'noticia_id' => $noticia->id,
                    'nombre' => $archivo->getClientOriginalName(),
                    'ruta' => $guardado['ruta'],
                    'mime' => $guardado['mime'],
                    'peso' => $guardado['peso'],
                    'orden' => $orden,
                ]);
                $ref++;

                continue;
            }

            $adjunto = $noticia->adjuntos()->find($item['id']);

            if ($adjunto === null) {
                throw ValidationException::withMessages([
                    'adjuntos_plan' => 'Un archivo adjunto del orden enviado ya no existe.',
                ]);
            }

            $adjunto->update(['orden' => $orden]);
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
