# PLAN — Administración de contenido del sitio

## Decisiones

- Nuestra Historia: hitos (año/título/texto) + párrafo final editable.
- Nosotros: carrusel de imágenes (fallback `/referencial.jpg`).
- Logo 3D: "Glorioso Lorente" arriba, "Modelo de Progreso" abajo y
  "IE N° 31501 · Sebastián Lorente" como línea pequeña.
- Administración: pestañas dentro de Configuración (Super Usuario y Administrador).

## Migraciones (3, nuevas)

- [x] `add_hero_imagen_and_historia_cierre_to_config_table` (2 columnas nullable)
- [x] `create_nosotros_imagenes_table` (id, ruta, alt, orden, timestamps)
- [x] `create_historia_hitos_table` (id, anio, titulo, texto, orden, timestamps) + seed 6 hitos

Todas reversibles; no alteran datos existentes (salvo el seed de historia).

## Bloque 0 — Seguridad

- [ ] Actualizar PHP local y hosting 8.3.35 → 8.3.36
      (CVE-2026-109618 / CVE-2026-109619, RCE sin autenticación).
- [x] Mitigación temporal: `session.upload_progress.enabled=0` (no necesaria; producción ya está en 8.3.36).
- [x] `composer update symfony/mime` a ≥ 7.4.22 (CVE-2026-45070). → v7.4.22
- [x] `composer audit` sin avisos y documentar chequeo pre-despliegue.
- [x] Documentar en el MD los pasos manuales en cPanel (versión PHP).

## Bloque A — Nuestra Historia

- [x] Modelo `HistoriaHito` + eventos de invalidación de caché.
- [x] Controlador: listar, crear, editar, eliminar, reordenar.
- [x] FormRequest con validación (año, título, texto, orden).
- [x] Pestaña "Nuestra Historia" en `Panel/Configuracion.jsx`:
      lista, formulario, orden y eliminar.
- [x] Campo `config.historia_cierre` editable en la pestaña.
- [x] `Nosotros.jsx` consume `historia` desde props; fallback a los textos actuales.
- [x] `ContenidoSitio` incluye `historia` y `historia_cierre`.
- [x] Tests: permisos (docente 403), CRUD, reorden, render público, caché.

## Bloque B — Imagen principal del Inicio

- [x] Extender `Recortador.jsx` y `recortarImagenWebp()` (ancho de salida y nombre;
      400/`docente.webp` como default para docentes).
- [x] Recorte 16:9, 1920px, WebP; entrada máx. 5 MB; carpeta `config/hero`.
- [x] Subida/reemplazo/eliminación con borrado del archivo anterior.
- [x] Pestaña "Imágenes" en Configuración con vista previa.
- [x] Fondo dinámico del hero en `SitioHome` (fallback `/lorentefrontis.jpg`).
- [x] `og:image` dinámico en `Inicio.jsx`.
- [x] Tests de subida, reemplazo y render público.

## Bloque C — Imágenes de Nosotros

- [x] Modelo `NosotrosImagen` + CRUD + orden (máx. 6).
- [x] Recorte 3:2, 1200px, WebP; entrada máx. 4 MB; carpeta `config/nosotros`.
- [x] UI de miniaturas en Configuración.
- [x] `GaleriaNosotros.jsx` accesible (flechas, puntos, teclado, lazy).
- [x] `ContenidoSitio` incluye `nosotros_imagenes`; fallback `/referencial.jpg`.
- [x] Tests de CRUD, orden y render público.

## Bloque D — Logo 3D

- [x] `Sidebar.jsx`: "Glorioso Lorente" arriba, "Modelo de Progreso" debajo.
- [x] Conservar línea pequeña "IE N° 31501 · Sebastián Lorente".
- [x] Ajustes en `sitio.css` (Playfair + dorado, responsive). Sin migración.

## Bloque E — Cierre

- [x] `php artisan test`
- [x] `npm run build`
- [x] `composer audit`
- [ ] Prueba manual escritorio y móvil de los 3 flujos.

## Rutas nuevas (bajo `rol:super-usuario,administrador`)

- POST `/lorente-panel/configuracion/hero` (guardar / quitar)
- POST `/lorente-panel/configuracion/nosotros-imagenes`
- POST `/lorente-panel/configuracion/nosotros-imagenes/{imagen}`
- POST `/lorente-panel/configuracion/nosotros-imagenes/{imagen}/eliminar`
- POST `/lorente-panel/configuracion/nosotros-imagenes/reordenar`
- POST `/lorente-panel/configuracion/historia`
- POST `/lorente-panel/configuracion/historia/{hito}`
- POST `/lorente-panel/configuracion/historia/{hito}/eliminar`
- POST `/lorente-panel/configuracion/historia/reordenar`

## Despliegue

`php artisan migrate` → `php artisan config:clear` → `npm run build` y
cambiar la versión de PHP a 8.3.36 en cPanel.

---

# Actualización de PHP (pasos manuales)

> **Por qué:** PHP 8.3.35 está afectado por CVE-2026-109618 y CVE-2026-109619
> ("php2shell"): ejecución remota de código sin autenticación, CVSS 9.2, con
> explotación activa. La única corrección completa es actualizar a **8.3.36**
> (o superior dentro de 8.3).

## 1. Hosting / producción (cPanel)

1. Entrar a **cPanel → Software → Select PHP Version** (o "MultiPHP Manager").
2. Seleccionar el dominio/subdominio del sitio.
3. Elegir **PHP 8.3.36** (si el proveedor aún no la lista, abrir ticket pidiendo
   la actualización; es un parche de seguridad crítico).
4. Guardar y verificar con un `phpinfo()` temporal o con
   **cPanel → PHP → Version** que reporte `8.3.36`.
5. Eliminar el `phpinfo()` de prueba.

### Nota sobre `alt-php83` (CloudLinux)

Elegir `alt-php83` selecciona la rama 8.3, pero **no garantiza el parche**:
hay que confirmar la versión exacta. En cPanel → Terminal:

```sh
php -v
/opt/alt/php83/usr/bin/php -v
```

Ambos deben reportar `8.3.36` o superior. Si el CLI sigue mostrando otra
versión, el sitio web puede estar correcto; verifícalo con un `phpinfo()`
temporal (paso 4). Si `alt-php83` está por debajo de 8.3.36, abre ticket al
proveedor: CloudLinux publica los parches de seguridad en esa rama.

### `composer.json`

**No requiere cambios.** `"php": "^8.3"` ya acepta 8.3.36 y versiones
posteriores de la rama. No conviene fijar `8.3.36` en `composer.json`: eso
solo afecta la resolución de dependencias, no obliga al servidor a usar esa
versión. El cambio real se hace en cPanel y se confirma con `php -v`.

### Extensiones y caché tras el cambio

En **MultiPHP INI Editor** (o `php.ini` de `alt-php83`) confirma que estén
activas: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `tokenizer`, `xml`,
`ctype`, `json`, `bcmath`, `curl`, `gd`. Si usas OPcache, reinícialo. Luego
reinicia PHP-FPM/LiteSpeed desde cPanel.

Verificación por SSH (si está disponible):

```sh
php -v
```

Debe mostrar `PHP 8.3.36` o superior.

### Sin Terminal/SSH (hosting compartido)

Todo se puede hacer desde cPanel:

**1. Verificar la versión real**

- Crear `public/phpinfo.php` desde **File Manager** con:

  ```php
  <?php phpinfo();
  ```

- Abrir `https://tudominio.com/phpinfo.php` y buscar **PHP Version**.
- Debe ser `8.3.36` o superior. **Borrar el archivo después.**

**2. Dependencias (vendor)**

Si no hay Terminal, revisa si cPanel trae **Software → Setup PHP Composer**
(o un icono "Composer"). Si existe, ejecuta `install --no-dev
--optimize-autoloader` desde ahí.

Si no existe:

- En tu PC, con el proyecto actualizado:

  ```powershell
  composer install --no-dev --optimize-autoloader
  Compress-Archive -Path vendor -DestinationPath vendor.zip -Force
  ```

- Subir `vendor.zip` con **File Manager**, extraerlo en la raíz del proyecto
  (debe quedar `vendor/autoload.php`) y borrar el zip.
- Subir también el `composer.lock` actualizado.

**3. Migraciones y cachés sin Terminal**

Usa **Cron Jobs** con una ejecución programada (luego se elimina):

```sh
/opt/alt/php83/usr/bin/php /home/USUARIO/ruta-del-proyecto/artisan migrate --force
```

- Crear el cron con la frecuencia "una vez al día" o "cada 5 minutos".
- Esperar a que corra, revisar que no haya errores y **eliminar el cron**.
- Si la ruta `/opt/alt/php83/usr/bin/php` no existe, probar con `php` a secas
  o consultar al proveedor el binario de `alt-php83`.

Para limpiar cachés, borra por File Manager:

- `bootstrap/cache/config.php`
- `bootstrap/cache/routes-*.php`
- `storage/framework/views/*.php`

Laravel las regenera solo. También puedes programar por cron
`php artisan optimize:clear`.

**4. Mitigación temporal sin Terminal**

Si la versión todavía no llega a 8.3.36, crea `public/.user.ini`:

```ini
session.upload_progress.enabled = Off
```

También puedes usar **MultiPHP INI Editor** del dominio. Es temporal: no
reemplaza la actualización.

## 2. Local (Windows)

- Opción A: reinstalar PHP 8.3 con el instalador usado en el equipo
  (`https://windows.php.net/download/`, build VS16 x64 NTS) y reemplazar
  `C:\php-8.3.35` por la carpeta de 8.3.36.
- Opción B: si se usa Laravel Herd, actualizar Herd y seleccionar PHP 8.3.36.
- Verificar:

```powershell
php -v
```

## 3. Mitigación temporal (si no se puede actualizar de inmediato)

En `php.ini`:

```ini
session.upload_progress.enabled = 0
```

No sustituye la actualización; solo reduce una de las vías de explotación.

## 4. Dependencias PHP

```sh
composer update symfony/mime
composer audit
```

`symfony/mime` debe quedar en **7.4.22 o superior** (CVE-2026-45070).

### Pasos en el servidor tras cambiar a 8.3

```sh
composer install --no-dev --optimize-autoloader
composer check-platform-reqs
composer audit
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
```

`composer install` usa el `composer.lock` ya actualizado (no ejecutes
`composer update` en producción). `check-platform-reqs` confirma que el PHP
del servidor cumple lo que exige el lock.

## 5. Checklist posterior

- [ ] `php -v` reporta 8.3.36+ en local.
- [x] Dominio en producción reporta PHP 8.3.36 (verificado en cPanel).
- [x] Mitigación temporal no necesaria: producción ya está en 8.3.36.
- [ ] `composer audit` sin avisos.
- [ ] Sitio y panel funcionando tras reiniciar PHP-FPM/Apache.
