# Plan 2 - Lorente (rendimiento, panel y página pública)

## Fase 0: Diagnóstico previo (solo lectura)
- [ ] Resumen: confirmar qué dato sale mal en cada tarjeta (valor esperado vs. mostrado).
- [ ] Sidebar: reproducir el resaltado incorrecto de "Inicio" con sesión iniciada; revisar `Sidebar.jsx` y `SitioLayout.jsx`.
- [ ] Medir en DevTools (Network, caché deshabilitada, Slow 4G): primera carga del home, `/lorente-panel/noticias` y tamaño del JSON de Inertia.

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
- [ ] Paginación en Docentes: pendiente de decisión. Su reordenamiento por arrastre entre categorías necesita la lista completa.
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
  - [ ] Imagen optimizada para no retrasar la carga: se sube como se recorta (WebP 1200 px); falta medir su peso en el subdominio.

## Fase 4: Página principal
- [x] Sidebar: el resaltado dependía de un efecto con `[]`; ahora depende de la URL (`usePage().url`), así se actualiza al volver al inicio desde el panel.
- [x] Docentes: 2 por fila en celulares (≤480 px) en `sitio.css`.
- [x] Recorrido: prefetch solo al pasar el cursor (Fase 1).

## Pendientes
- [ ] Paginación de Docentes (pendiente de decisión; el arrastre necesita la lista completa).
- [ ] Mensajes: el IP sigue visible en el detalle del mensaje (solo se quitó del historial).
- [ ] `config/panel.php` tiene textos con caracteres mal codificados (categorías de noticias, "Configuración", "Público"). Preexistente; conviene corregir el archivo en UTF-8.
- [ ] Deploy: ejecutar `php artisan migrate` (dos migraciones nuevas: `make_contacto_email_nullable` y `create_comunicados_table`).

## Verificación
- [x] `php artisan test` (237/237) y `npm run build` tras Fase 3 y 4.
- [ ] Prueba manual en el subdominio tras cada despliegue.
