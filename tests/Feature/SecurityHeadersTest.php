<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_las_respuestas_incluyen_cabeceras_de_seguridad(): void
    {
        $response = $this->get(route('panel.login.show'));

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->assertHeader('Content-Security-Policy');
    }

    public function test_no_aplica_hsts_sin_https(): void
    {
        $this->get('/robots.txt')
            ->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_aplica_hsts_sobre_https(): void
    {
        $this->get('https://localhost/robots.txt')
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
}
