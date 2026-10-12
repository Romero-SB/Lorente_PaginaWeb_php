<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EstadoAppTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_reporte_de_estado_se_ejecuta(): void
    {
        $this->artisan('app:estado')
            ->expectsOutputToContain('Base de datos')
            ->assertSuccessful();
    }
}
