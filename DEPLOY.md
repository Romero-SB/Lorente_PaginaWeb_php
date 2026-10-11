# Despliegue en cPanel (PHP 8.3 + MySQL)

Guía para publicar el sitio y el panel en un hosting cPanel sin terminal (o con
acceso web a comandos), usando drivers `file` para sesión y caché.

## 1. Requisitos

- PHP 8.3 con extensiones: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`,
  `intl`, `gd` o `imagick` (para las imágenes), `zip`.
- MySQL 5.7+ / MariaDB 10.3+.
- Dominio con SSL (HTTPS).

## 2. Subir el proyecto

1. Sube el contenido del proyecto a una carpeta fuera de `public_html`
   (por ejemplo `~/lorente`).
2. Apunta el **document root** del dominio a `~/lorente/public`.
   Si no es posible, mueve el contenido de `public/` a `public_html/` y ajusta en
   `public_html/index.php` las rutas `require __DIR__.'/../lorente/vendor/autoload.php'`
   y `$app = require_once __DIR__.'/../lorente/bootstrap/app.php';`.

## 3. Dependencias (solo si no subes `vendor/`)

```sh
composer install --no-dev --optimize-autoloader
```

## 4. Variables de entorno (`.env`)

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.edu.pe

APP_TIMEZONE=America/Lima
APP_LOCALE=es
APP_FALLBACK_LOCALE=es

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=usuario_lorente
DB_USERNAME=usuario_lorente
DB_PASSWORD=********

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=tls
MAIL_USERNAME=ie31501sebastianlorente@gmail.com
MAIL_PASSWORD=app_password

TURNSTILE_ENABLED=true
TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

Genera la clave si es una instalación nueva:

```sh
php artisan key:generate
```

## 5. Base de datos y almacenamiento

```sh
php artisan migrate --force
php artisan storage:link
```

## 6. Optimización para producción

Genera primero los assets del frontend (en local o en el servidor con Node):

```sh
npm ci
npm run build
```

Luego cachea configuración, rutas y vistas:

```sh
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

> Cuando cambies `.env` o `config/`, ejecuta de nuevo `config:cache`.
> Para limpiar todo: `php artisan optimize:clear`.

## 7. Permisos

Da permisos de escritura a:

- `storage/` (incluye `framework/sessions`, `framework/cache`, `framework/views`, `logs`)
- `bootstrap/cache/`

```sh
chmod -R 775 storage bootstrap/cache
```

## 8. Tareas programadas (opcional)

El proyecto purga la papelera de forma diferida (cada 6 horas) y, además, define
tareas diarias. Si el hosting permite cron:

```cron
* * * * * cd ~/lorente && php artisan schedule:run >> /dev/null 2>&1
```

## 9. SEO

- `https://tu-dominio.edu.pe/robots.txt` (generado dinámicamente).
- `https://tu-dominio.edu.pe/sitemap.xml` (incluye la portada, las noticias
  publicadas y la lista de noticias).

## 10. Verificación

- La portada carga con HTTPS y sin errores en consola.
- Login en `/lorente-panel/login` y acceso al panel.
- El modelo 3D (`/LOGASO.glb`) carga y los assets de `/build/` se cachean.
