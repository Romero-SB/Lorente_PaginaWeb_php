<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<int, array{anio: string, titulo: string, texto: string}> */
    private array $hitos = [
        [
            'anio' => '1846',
            'titulo' => 'Origen de la institución',
            'texto' => 'La investigación del profesor Rolando Aliaga Baldeón sitúa la fundación de la institución en el año 1846.',
        ],
        [
            'anio' => '1905',
            'titulo' => 'Escuela Municipal',
            'texto' => 'Entre 1905 y 1914 funcionó como Escuela Municipal sostenida por el Consejo Huancaíno, bajo la dirección de los hermanos Ángel Alfredo Prialé y Sixto Prialé.',
        ],
        [
            'anio' => '1915',
            'titulo' => 'Nuevas direcciones',
            'texto' => 'Aurelio Gurmendi Agüero dirige hasta 1917, y lo sucede Manuel Jesús Vera Ortiz hasta 1921.',
        ],
        [
            'anio' => '1922',
            'titulo' => 'Centro Escolar Mixto',
            'texto' => 'Emilio Humareda asume la dirección. Se fusionan la escuela de varones 511 y la de mujeres 512 en el local de la calle Puno, y organiza por primera vez en Huancayo las Brigadas de Boys Scouts y Girls Scouts.',
        ],
        [
            'anio' => '1952',
            'titulo' => 'Denominación oficial',
            'texto' => 'Por Resolución Ministerial N.° 0065, de 11 de noviembre de 1952, se otorga a la institución la denominación "Sebastián Lorente".',
        ],
        [
            'anio' => '2011',
            'titulo' => 'Infraestructura actual',
            'texto' => 'Se consolida la infraestructura actual, con el esfuerzo de docentes, padres de familia y del entonces director Hugo R. Astuhuamán Inga.',
        ],
    ];

    public function up(): void
    {
        Schema::create('historia_hitos', function (Blueprint $table) {
            $table->id();
            $table->string('anio', 20);
            $table->string('titulo', 150);
            $table->text('texto');
            $table->unsignedInteger('orden')->default(0);
            $table->timestamps();

            $table->index('orden');
        });

        $ahora = now();

        DB::table('historia_hitos')->insert(array_map(
            fn (array $hito, int $indice) => [
                'anio' => $hito['anio'],
                'titulo' => $hito['titulo'],
                'texto' => $hito['texto'],
                'orden' => ($indice + 1) * 10,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ],
            $this->hitos,
            array_keys($this->hitos),
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('historia_hitos');
    }
};
