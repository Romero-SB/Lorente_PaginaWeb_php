# IE N° 31501 «Sebastián Lorente»

Sitio web institucional y panel administrativo de la I.E. N° 31501 «Sebastián
Lorente» (Huancayo). Incluye noticias, documentos públicos y privados, docentes,
recorrido virtual 360°, formulario de contacto y gestión de contenidos por roles.

## Stack

- **Backend:** PHP 8.3+, Laravel 13, Inertia.js 3
- **Frontend:** React 19, Vite 8, Tailwind CSS
- **Base de datos:** MySQL/MariaDB en producción, SQLite en local
- **Calidad:** PHPUnit, Vitest + Testing Library, Pint, GitHub Actions
- **Extras:** Cloudflare Turnstile, colas en base de datos, Photo Sphere Viewer

## Requisitos

- PHP 8.3 con `pdo_mysql`/`pdo_sqlite`, `mbstring`, `openssl`, `fileinfo`, `gd`
- Composer 2
- Node.js 22+ y npm

## Instalación

```sh
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
php artisan serve
```

Para desarrollo con recarga en caliente, ejecuta `npm run dev` en otra terminal.

El seeder crea cuentas de demostración (Super Usuario, Administrador y Docente)
y la configuración institucional. **Cambia sus contraseñas antes de publicar** y
no ejecutes el seeder en producción.

## Comandos útiles

```sh
php artisan app:estado      # estado de entorno, BD, caché, colas y papelera
php artisan optimize:clear  # limpia configuración, rutas y vistas cacheadas
composer test               # suite PHP (PHPUnit)
vendor/bin/pint --test      # verifica el estilo de código
npm run test                # suite de componentes (Vitest)
npm run build               # compila los assets de producción
```

## Estructura

- `app/Http/Controllers/Panel` — panel administrativo (contenidos, cuentas, papelera)
- `app/Http/Controllers/Sitio` — páginas públicas, contacto y descargas
- `app/Support` — caché del sitio, almacenamiento, papelera e historial
- `resources/js/Pages` — páginas Inertia (sitio, panel y autenticación)
- `resources/js/Components` — componentes compartidos y del sitio
- `resources/js/virtual-tour` — visor 360° y escenas
- `tests` — pruebas de feature y unitarias

## Despliegue

Consulta [DEPLOY.md](DEPLOY.md) para la publicación en cPanel: variables de
entorno, migraciones, cachés, cron de colas y verificación.

## Seguridad

- Sesiones y CSRF nativos de Laravel; contraseñas con bcrypt.
- Bloqueo de login tras 5 intentos fallidos durante 1 hora.
- Límite de solicitudes en recuperación de contraseña y contacto.
- Documentos privados servidos únicamente a usuarios autenticados.
- Cabeceras de seguridad y CSP en producción (Turnstile y Font Awesome incluidos).
