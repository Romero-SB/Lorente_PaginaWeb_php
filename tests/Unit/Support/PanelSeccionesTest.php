<?php

namespace Tests\Unit\Support;

use App\Models\User;
use App\Support\PanelSecciones;
use Tests\TestCase;

class PanelSeccionesTest extends TestCase
{
    public function test_etiqueta_rol_se_traduce_desde_la_configuracion(): void
    {
        $this->assertSame('Super Usuario', PanelSecciones::etiquetaRol(User::ROLE_SUPER));
        $this->assertSame('Administrador', PanelSecciones::etiquetaRol(User::ROLE_ADMIN));
        $this->assertSame('Docente', PanelSecciones::etiquetaRol(User::ROLE_DOCENTE));
    }

    public function test_etiqueta_rol_devuelve_el_rol_si_no_esta_configurado(): void
    {
        $this->assertSame('otro-rol', PanelSecciones::etiquetaRol('otro-rol'));
    }

    public function test_para_rol_devuelve_solo_las_secciones_de_ese_rol_con_el_esquema_completo(): void
    {
        $secciones = PanelSecciones::paraRol(User::ROLE_DOCENTE);
        $claves = collect($secciones)->pluck('clave')->all();

        $this->assertContains('resumen', $claves);
        $this->assertContains('noticias', $claves);
        $this->assertNotContains('cuentas', $claves);
        $this->assertNotContains('historial', $claves);

        foreach ($secciones as $seccion) {
            $this->assertSame(['clave', 'etiqueta', 'icono', 'ruta', 'exacta'], array_keys($seccion));
            $this->assertNotEmpty($seccion['etiqueta']);
            $this->assertNotEmpty($seccion['icono']);
            $this->assertStringStartsWith('/lorente-panel', $seccion['ruta']);
            $this->assertIsBool($seccion['exacta']);
        }
    }

    public function test_para_rol_mantiene_el_orden_de_la_configuracion(): void
    {
        $ordenEsperado = array_keys(config('panel.secciones'));
        $ordenObtenido = collect(PanelSecciones::paraRol(User::ROLE_SUPER))->pluck('clave')->all();

        $this->assertSame($ordenEsperado, $ordenObtenido);
    }

    public function test_acceso_permitido_segun_rol(): void
    {
        $docente = new User(['role' => User::ROLE_DOCENTE]);
        $admin = new User(['role' => User::ROLE_ADMIN]);

        $this->assertTrue(PanelSecciones::accesoPermitido($docente, 'noticias'));
        $this->assertFalse(PanelSecciones::accesoPermitido($docente, 'historial'));
        $this->assertFalse(PanelSecciones::accesoPermitido($admin, 'historial'));
        $this->assertTrue(PanelSecciones::accesoPermitido($admin, 'cuentas'));
    }

    public function test_acceso_permitido_devuelve_false_para_clave_inexistente(): void
    {
        $super = new User(['role' => User::ROLE_SUPER]);

        $this->assertFalse(PanelSecciones::accesoPermitido($super, 'inexistente'));
    }
}
