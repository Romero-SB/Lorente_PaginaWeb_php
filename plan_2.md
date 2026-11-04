# Plan 2 - Lorente (rendimiento, panel y página pública)

## Fase 0: Diagnóstico previo (solo lectura)
- [x] Resumen: verificado en local. Las tarjetas coinciden con la base (noticias, docentes, documentos, mensajes).
- [x] Sidebar: verificado en local. En `/` resalta Inicio y en `/noticias` resalta Noticias.
- [ ] Medir en DevTools sobre el subdominio (Network, caché deshabilitada, Slow 4G): primera carga del home, `/lorente-panel/noticias` y tamaño del JSON de Inertia. Requiere el despliegue.

## Fase 1: Rendimiento página pública
- [x] Quitar prefetch automático de `/recorrido` en `Recorrido3dButton.jsx`; ahora `prefetch="hover"`.
- [~] Separar three.js con `manualChunks`: probado y revertido (empeoró: chunk de 1.3 MB cargado en el home). No aplicar.
- [x] LOGASO.glb: optimizado con gltf-transform (meshopt + texturas WebP) a `public/LOGASO.v2.glb`, 1.2 MB -> 344 KB. Original `LOGASO.glb` conservado.
- [x] `poster` en `model-viewer` con `logo_lorente.webp` mientras carga.
- [x] Nombre versionado (`LOGASO.v2.glb`) y `AddType model/gltf-binary .glb` en `public/.htaccess`.
- [x] Imágenes (mismo nombre, sin cambiar referencias): `referencial.jpg` 250 -> 146 KB (1200 px); `lorentefrontis.jpg` 211 -> 110 KB; `logo_lorente.webp` 94 -> 27 KB (256 px). Originales en `%TEMP%\opencode\img\orig`.
- [ ] Excluir `public/tour/scenes_raw/` del ZIP (tras verificar que `tour.json` no lo usa).

## Fase 2: Rendimiento panel
- [x] Caché de `ContenidoSitio` precalentada tras guardar (`invalidarYPrecalentarTrasRespuesta`, se reconstruye al terminar la respuesta).
- [x] Dejar de enviar `sitio` en secciones del panel para usuarios logueados (`HandleInertiaRequests.php`). Se conserva para login y cambio de contraseña inicial.
- [x] Desmontar `SitioHome` en el panel; se reemplaza por `FondoPanel` estático (`SitioLayout.jsx`).
- [x] Paginación en Noticias (15 por página, búsqueda por título en servidor).
- [x] Paginación en Documentos (15 por página, búsqueda y categoría en servidor).
- [x] Paginación en Docentes: decidida no paginar (la lista es corta y el arrastre necesita todos los registros).
- [x] Closures de `routes/web.php` convertidos en `RobotsController`, `SitemapController` y `PanelIndexController`. `route:cache` y `config:cache` verificados.
- [ ] Deploy: en producción ejecutar `php artisan config:cache` y `php artisan route:cache`. Antes de probar localmente, `config:clear` y `route:clear` (la caché de config rompe las pruebas).

## Fase 3: Correcciones del panel
- [x] Resumen: las tarjetas mostraban `t.dato` (inexistente, siempre 0). Corregido a `stats[t.clave]` en `Resumen.jsx`.
- [x] Papelera (Noticias, Documentos, Docentes): el botón alterna; al presionarlo de nuevo vuelve a la lista.
- [x] Noticias: recorte por orientación (horizontal 16:9, vertical 4:5) mediante `ColaRecorte.jsx` y `analizarOrientacion` / `recorteCentradoWebp` en `lib/image.js`.
- [x] Subida múltiple: cola con "Aplicar a todas" (recorte centrado automático) y "Ajustar una por una" (Recortador por imagen).
- [x] Mensajes: teléfono obligatorio y correo opcional (`ContactoRequest`, formulario público, migración `make_contacto_email_nullable`).
- [x] Mensajes: "Responder por WhatsApp" (`wa.me`, prefijo 51 para móviles de 9 dígitos) y "Responder por Gmail" (`mail.google.com` con destinatario y texto predeterminado).
- [x] Historial: sin IP; columnas "Dónde" (sección del panel) y "Qué hizo" (frase legible, sin rutas).
- [x] Historial: eliminación por rango de fechas, solo super usuario (`POST /lorente-panel/historial/eliminar-rango`), con confirmación. La vista sigue paginada.
- [x] Cuentas: sin cambios.
- [x] Comunicados emergentes:
  - [x] Tabla `comunicados` (imagen, enlace opcional, activo, inicio/fin) y modelo con `vigente()`.
  - [x] Sección "Comunicados" en el panel (super usuario y administrador): subida, recorte 3:4 opcional, activar/desactivar, eliminar.
  - [x] Componente público `ComunicadoEmergente.jsx` solo en el inicio y solo para visitantes sin sesión (dato compartido desde el servidor).
  - [x] Límite de 5 visualizaciones por navegador (`localStorage`), contando una vez por sesión de pestaña.
  - [x] Límite de 5 corregido: cada carga completa del inicio (incluido refrescar) cuenta una vez. Antes los refrescos no se contaban.
  - [x] Enlace eliminado (columna retirada con migración `drop_enlace_from_comunicados`).
  - [x] Fecha de inicio por defecto = ahora; editable para programar. Sin fecha de inicio, el servidor usa la hora actual.
  - [ ] Imagen optimizada para no retrasar la carga: medir su peso en el subdominio tras el despliegue.

## Fase 4: Página principal
- [x] Sidebar: el resaltado dependía de un efecto con `[]`; ahora depende de la URL (`usePage().url`), así se actualiza al volver al inicio desde el panel.
- [x] Docentes: 2 por fila en celulares (≤480 px) en `sitio.css`.
- [x] Recorrido: prefetch solo al pasar el cursor (Fase 1).

## Pendientes
- [x] Mensajes: botón "Actualizar" en la cabecera. Recarga la lista y el contador conservando filtro, búsqueda y mensaje abierto. Verificado: un mensaje que llega después aparece solo al pulsarlo.
- [x] Docentes: sin paginar (decisión). La lista es corta y el arrastre entre categorías necesita todos los registros.
- [x] Mensajes: IP eliminada también del detalle.
- [x] `config/panel.php` corregido. Los emojis de las categorías de noticias ya se habían perdido en el archivo; ahora son texto plano (las claves no cambian).
- [x] Escape ya no minimiza el panel (solo cierra el menú móvil).
- [x] Sitio público detrás del panel: solo se renderiza cuando el panel está minimizado. Con el panel abierto, el fondo es la foto del colegio sin contenido ni tinte.
- [x] Mensajes: bandeja. Al entrar ningún mensaje está abierto. Al abrir uno queda leído (fila sin resaltar, sin etiqueta "Nuevo"; el contador se actualiza). No hay botón manual de leído. "Marcar como respondido" es independiente. Botones: WhatsApp (siempre, el teléfono es obligatorio) y Correo (Gmail), deshabilitado si no hay correo.
- [ ] Deploy: `php artisan migrate` (tres migraciones nuevas: `make_contacto_email_nullable`, `create_comunicados_table`, `drop_enlace_from_comunicados`). Pendiente: el ZIP y el despliegue se harán cuando lo confirmes.

## Imágenes (conversión a WebP)
- [x] Subidas nuevas: `Almacenamiento::guardarImagen` convierte JPG/PNG/WebP a WebP en el servidor (GD), limita el ancho a 1600 px. GIF se conserva. Pruebas en `tests/Unit/AlmacenamientoWebpTest.php`.
- [x] Imágenes fijas: `referencial.webp` (90 KB) y `lorentefrontis.webp` (72 KB) reemplazan a los JPG; referencias actualizadas (13 archivos). Respaldo de los JPG en `%TEMP%\opencode\img\jpg-respaldo`.
- [ ] Imágenes ya subidas en `storage` (JPG/PNG): no se convierten; se dejan para después (requiere cambiar rutas en base de datos).

## Entrega (ZIP y base de datos)
- [x] `D:\panel` sincronizado con el repo (app, config, database, routes, resources, build, public). `.env`, `storage`, `bootstrap/cache` y la base SQLite no se tocaron.
- [x] Autoload de producción regenerado (`composer dump-autoload -o --no-dev`): el classmap era autoritativo y no conocía las clases nuevas.
- [x] `D:\lorente-cpanel.zip` regenerado (6943 archivos, rutas con `/`, `.env` con placeholders). Versión anterior en `%TEMP%\opencode\lorente-cpanel-anterior.zip`.
- [x] `D:\lorente-base-datos.sql` actualizado: tabla `comunicados`, `email` opcional en `contacto_mensajes`, 3 migraciones registradas (23). Super usuario conservado.
- [x] `D:\lorente-base-datos.md` actualizado con el mismo SQL y conteos.
- [ ] Importación del SQL probada en MySQL (pendiente: requiere credenciales de root del MySQL local).
- [ ] `D:\lorente-parche.zip` quedó desactualizado; no se regenera (el ZIP completo es la vía de despliegue).

## Verificación
- [x] `php artisan test` (237/237) y `npm run build` tras Fase 3 y 4.
- [ ] Prueba manual en el subdominio tras el despliegue (pendiente, se hace con el ZIP).
