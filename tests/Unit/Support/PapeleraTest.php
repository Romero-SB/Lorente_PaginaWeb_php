<?php

namespace Tests\Unit\Support;

use App\Models\Noticia;
use App\Models\User;
use App\Support\PapeleraNoticias;
use Carbon\Carbon;
use Tests\TestCase;

class PapeleraTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_dias_purga_lee_la_configuracion(): void
    {
        config(['panel.dias_purga_papelera' => 30]);

        $this->assertSame(30, PapeleraNoticias::diasPurga());
    }

    public function test_dias_restantes_de_un_registro_recientemente_eliminado(): void
    {
        Carbon::setTestNow('2026-01-11 12:00:00');

        $noticia = new Noticia;
        $noticia->deleted_at = '2026-01-11 11:00:00';

        $this->assertSame(7, PapeleraNoticias::diasRestantes($noticia));
    }

    public function test_dias_restantes_disminuyen_con_el_tiempo_y_nunca_bajan_de_cero(): void
    {
        Carbon::setTestNow('2026-01-11 12:00:00');

        $dosDias = new Noticia;
        $dosDias->deleted_at = '2026-01-09 12:00:00';

        $muyVencida = new Noticia;
        $muyVencida->deleted_at = '2026-01-01 12:00:00';

        $this->assertSame(5, PapeleraNoticias::diasRestantes($dosDias));
        $this->assertSame(0, PapeleraNoticias::diasRestantes($muyVencida));
    }

    public function test_dias_restantes_de_un_registro_sin_eliminar_devuelve_el_limite_total(): void
    {
        config(['panel.dias_purga_papelera' => 15]);

        $this->assertSame(15, PapeleraNoticias::diasRestantes(new Noticia));
    }

    public function test_super_usuario_puede_gestionar_cualquier_registro(): void
    {
        $super = new User;
        $super->id = 9;
        $super->role = User::ROLE_SUPER;

        $ajeno = new Noticia(['author_id' => 999]);

        $this->assertTrue(PapeleraNoticias::puedeGestionarEliminada($super, $ajeno));
    }

    public function test_docente_puede_gestionar_solo_su_autoria(): void
    {
        $docente = new User;
        $docente->id = 5;
        $docente->role = User::ROLE_DOCENTE;

        $propia = new Noticia(['author_id' => 5]);
        $ajena = new Noticia(['author_id' => 6]);

        $this->assertTrue(PapeleraNoticias::puedeGestionarEliminada($docente, $propia));
        $this->assertFalse(PapeleraNoticias::puedeGestionarEliminada($docente, $ajena));
    }

    public function test_administrador_puede_gestionar_su_autoria_y_la_de_docentes(): void
    {
        $admin = new User;
        $admin->id = 1;
        $admin->role = User::ROLE_ADMIN;

        $docente = new User;
        $docente->id = 3;
        $docente->role = User::ROLE_DOCENTE;

        $propia = new Noticia(['author_id' => 1]);
        $propia->setRelation('author', $admin);

        $deDocente = new Noticia(['author_id' => 3]);
        $deDocente->setRelation('author', $docente);

        $deSuper = new Noticia(['author_id' => 9]);
        $deSuper->setRelation('author', (function () {
            $super = new User;
            $super->id = 9;
            $super->role = User::ROLE_SUPER;

            return $super;
        })());

        $this->assertTrue(PapeleraNoticias::puedeGestionarEliminada($admin, $propia));
        $this->assertTrue(PapeleraNoticias::puedeGestionarEliminada($admin, $deDocente));
        $this->assertFalse(PapeleraNoticias::puedeGestionarEliminada($admin, $deSuper));
    }
}
