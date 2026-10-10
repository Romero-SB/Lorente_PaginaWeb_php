# PLAN — Web Institucional I.E. N° 31501 «Sebastián Lorente»

## Cómo usar este plan
- Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` terminado.
- Se marca una fase `[x]` SOLO cuando el usuario confirma que se terminó.
- Al retomar el trabajo, consultar este archivo primero.

## Contexto
- Migración de `D:\PHP_Lorente` (Laravel 11 API + React SPA) a Laravel 13 + Inertia 3 + React 19.
- Referencia de patrones: `D:\aula-virtual-postgrado`.
- `D:\PHP_Lorente` permanece INTACTO: solo se copian piezas (CSS, componentes, assets).
- Hosting cPanel (PHP 8.3, MySQL), sin terminal y sin websockets. Dev en SQLite.

## Decisiones confirmadas
- Auth por email + password; Turnstile integrado con `TURNSTILE_ENABLED=false` por ahora.
- Login del panel en `/lorente-panel`.
- Roles: `super-usuario`, `administrador`, `docente`.
- Un Docente publica noticias directamente (autor visible con su `cargo`).
- Panel = ventana flotante arrastrable/redimensionable + sidebar interno por rol; refetch AJAX tras cada acción.
- Noticias del sitio público con rutas reales `/noticias/{slug}`.
- Contacto: guarda en BD + email + bandeja (admin/super) + captcha.
- Documentos publico/privado; privados accesibles con sesión (cualquier rol).
- Storage: disco `public` + disco `local` (root `storage/app/private`).
- Seeds: solo cuentas (superusuario) + config institucional; el resto manual.
- Super resetea cualquier contraseña; Admin solo de docentes.

## Fase 0 — Setup del proyecto
- [x] Andamiar Laravel 13 en la raíz del repo (respetar `.git`)
- [x] Instalar Inertia 3 + React 19 + Vite + Tailwind
- [x] `.env` (SQLite, APP_URL, APP_LOCALE=es, APP_TIMEZONE=America/Lima, Turnstile off)
- [x] Configurar discos `public` y `local`/privado (default Laravel 13 = `storage/app/private`)
- [x] Copiar assets desde `PHP_Lorente` (LOGASO.glb, referencial.jpg, lorentefrontis.jpg, logo)
- [x] Optimizar `LOGASO.glb` (Draco+Meshopt+textures 512 → **19.8 MB → 1.5 MB**) y logo (PNG 5.8 MB → WebP 94 KB); favicon.png generado (el original estaba vacío)
- [~] Poster de LOGASO + carga diferida (se integra al portar el Sidebar 3D en Fase 9)
- [x] Verificado: migraciones base, build Vite, primera página Inertia (HTTP 200)

## Fase 1 — Modelo de datos
- [x] Migraciones: users(mod role/cargo/must_change_password), config, noticias, noticia_imagenes, adjuntos, docente_categorias, docentes, documento_categorias, documentos(visibilidad), actividad, contacto_mensajes
- [x] Modelos + relaciones + casts (Noticia con `slug` autogenerado y borrado en cascada de imágenes/adjuntos)
- [x] Seeders: superusuario (`admin@lorente.edu.pe` / `lorente2026`, cambio obligatorio) + config institucional
- [x] (opcional) `DemoUsuariosSeeder` creado (no se auto-ejecuta): `php artisan db:seed --class=DemoUsuariosSeeder`

## Fase 2 — Autenticación
- [x] Rutas `/lorente-panel` (login/logout/recuperar/restablecer)
- [x] Login por email normalizado (mayúsculas → minúsculas), remember me, rate limiting (3 fallos → bloqueo 1h), Turnstile condicional (`TURNSTILE_ENABLED` + site key)
- [x] Reset por Gmail SMTP (config comentada en `.env`, pendiente credenciales) + `ResetPasswordNotification` + expiración 60 min
- [x] Cambio de contraseña obligatorio en cuentas nuevas (`must_change_password`)
- [x] Vistas Inertia de auth con estética institucional (`AuthLayout` + componente `Turnstile`)
- [x] Panel placeholder (`/lorente-panel`) para que login/redirect funcionen hasta la Fase 3
- [x] Tests de flujo: 20/20 (login, rate limit, reset, cambio obligatorio, Turnstile)

## Fase 3 — RBAC + panel flotante
- [x] Middleware `rol:` (+ `debe.cambiar.password` en el panel)
- [x] Layout ventana flotante (drag/resize/min/max + posición persistente en localStorage + pill al minimizar)
- [x] Sidebar interno por rol (`config/panel.php` + props compartidas `panel.*`)
- [x] Refetch AJAX + toasts (tienda `lib/toast` + flash; `lib/draft` para restore del borrador)
- [x] Secciones: Resumen (con contadores por rol) + placeholders Noticias/Docentes/Documentos/Mensajes/Cuentas/Configuración/Perfil
- [x] Tests RBAC: 7/7 (guest→login, acceso por rol, 403, password pendiente)

## Fase 4 — Módulo Noticias
- [x] CRUD por rol (Docente solo propias; Admin/Super todas)
- [x] Imágenes (máx 10, portada, drag&drop, WebP)
- [x] Adjuntos validados (MIME real)
- [x] Estados publicado/borrador (Docente publica directo)
- [x] Autor + cargo + `updated_by` (badge "modificado por")
- [x] Papelera jerárquica por autoría (Docente solo propias; Admin propias + de docentes; Super todas) + restaurar + purga 7 días (lazy + `noticias:purgar-papelera` programado)
- [x] Registro en Historial

## Fase 5 — Módulo Docentes (Admin/Super)
- [x] CRUD + foto con cropper (`react-easy-crop`, 4:5) + WebP (400px)
- [x] Categorías (crear/renombrar/eliminar + guarda de bloqueo)
- [x] Reorden drag&drop (`orden *10`, docentes y categorías)
- [x] Papelera jerárquica (Admin solo propias; Super todas) + restaurar + permanente (solo Super) + purga 7 días (lazy + `docentes:purgar-papelera`) + Historial

## Fase 6 — Módulo Documentos
- [x] CRUD (todos crean; Admin/Super gestionan todas)
- [x] Validación de cabeceras (`file` + `mimes:pdf,doc,docx,xls,xlsx,ppt,pptx` + `isValid`)
- [x] Público/Privado (disco privado + ruta con `auth`)
- [x] Categorías con reorden/renombre/guarda
- [x] Papelera + Historial

## Fase 7 — Papelera + Historial
- [x] Vistas de papelera por rol (propia vs general)
- [x] Historial (solo Super) con filtros
- [x] "Modificado por" en noticias
- [x] Purga a los 7 días con aviso de días restantes

## Fase 8 — Configuración + cuentas
- [x] Datos institucionales (Admin/Super)
- [x] Datos de contacto (teléfono/correo/dirección)
- [x] Perfil personal
- [x] Cambio de contraseña
- [x] Gestión de cuentas: Super (admin+docente, reset pass), Admin (solo docente)

## Fase 9 — Sitio público
- [ ] Portar Hero/Nosotros/Noticias/Documentos/Contacto/Sidebar 3D/WhatsApp/Footer (CSS original)
- [ ] Rutas reales `/noticias`, `/noticias/{slug}` + SEO meta/OG por ruta
- [ ] Contacto real + bandeja (Admin/Super)
- [ ] Acceso a documentos privados con sesión
- [ ] Animaciones, skeletons y reveal

## Fase 10 — Pulido y despliegue
- [ ] SEO (sitemap, robots, meta), favicon
- [ ] Accesibilidad + responsive
- [ ] Optimización (GLB, imágenes, cache)
- [ ] Export SQLite → `.sql` MySQL
- [ ] Guía cPanel (symlink storage, APP_KEY, `.env`, import `.sql`)
- [ ] Checklist de go-live

## Pendientes del usuario
- [ ] `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`
- [ ] Cuenta Gmail + App Password (reset y contacto)
- [ ] Dominio final
- [ ] (opcional) cuentas demo admin/docente
