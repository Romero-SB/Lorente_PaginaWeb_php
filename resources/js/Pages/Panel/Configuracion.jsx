import { useEffect, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';

import EditorEstiloHito from '../../Components/Panel/EditorEstiloHito';
import { Icono } from '../../Components/Panel/Iconos';
import Recortador from '../../Components/Panel/Recortador';
import Boton from '../../Components/Shared/Boton';
import Campo from '../../Components/Shared/Campo';
import FileDropzone from '../../Components/Shared/FileDropzone';
import Modal from '../../Components/Shared/Modal';
import PageHeader from '../../Components/Shared/PageHeader';
import { toast } from '../../lib/toast';

const PESTANAS = [
    { clave: 'datos', etiqueta: 'Datos y contacto' },
    { clave: 'historia', etiqueta: 'Nuestra Historia' },
    { clave: 'imagenes', etiqueta: 'Imágenes' },
];

const PESO_HERO = 5 * 1024 * 1024;
const PESO_NOSOTROS = 4 * 1024 * 1024;
const MAX_NOSOTROS = 6;

export default function Configuracion({ config = {}, historia = [], nosotros_imagenes = [] }) {
    const { auth, errors = {} } = usePage().props;
    const [pestana, setPestana] = useState('datos');
    const [hitos, setHitos] = useState(historia);
    const [editandoId, setEditandoId] = useState(null);
    const [hitoAbierto, setHitoAbierto] = useState(false);
    const [estiloHito, setEstiloHito] = useState(null);

    const [heroPreview, setHeroPreview] = useState(config.hero_imagen || null);
    const [heroArchivo, setHeroArchivo] = useState(null);
    const [heroCrop, setHeroCrop] = useState(null);
    const [nosotrosCrop, setNosotrosCrop] = useState(null);
    const [imagenes, setImagenes] = useState(nosotros_imagenes);

    const form = useForm({
        phone: config.phone || '',
        email: config.email || '',
        direccion: config.direccion || '',
        estudiantes: config.estudiantes ?? '',
        docentes_count: config.docentes_count ?? '',
        anio_fundacion: config.anio_fundacion ?? '',
        niveles: config.niveles || '',
        mision: config.mision || '',
        vision: config.vision || '',
        nosotros_intro: config.nosotros_intro || '',
        nosotros_valores: config.nosotros_valores || '',
        historia_cierre: config.historia_cierre || '',
    });

    const hitoForm = useForm({ anio: '', titulo: '', texto: '' });

    useEffect(() => {
        setHitos(historia);
    }, [historia]);

    useEffect(() => {
        setImagenes(nosotros_imagenes);
    }, [nosotros_imagenes]);

    useEffect(() => {
        setHeroPreview(config.hero_imagen || null);
    }, [config.hero_imagen]);

    function enviar(e) {
        e.preventDefault();
        form.post('/lorente-panel/configuracion', { preserveScroll: true });
    }

    function abrirNuevoHito() {
        setEditandoId(null);
        hitoForm.reset();
        hitoForm.clearErrors();
        setHitoAbierto(true);
    }

    function editarHito(hito) {
        setEditandoId(hito.id);
        hitoForm.setData({
            anio: hito.anio || '',
            titulo: hito.titulo || '',
            texto: hito.texto || '',
        });
        hitoForm.clearErrors();
        setHitoAbierto(true);
    }

    function cerrarHito() {
        setHitoAbierto(false);
        setEditandoId(null);
        hitoForm.reset();
        hitoForm.clearErrors();
    }

    function guardarHito(e) {
        e.preventDefault();

        const url = editandoId
            ? `/lorente-panel/configuracion/historia/${editandoId}`
            : '/lorente-panel/configuracion/historia';

        hitoForm.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                cerrarHito();
            },
        });
    }

    function abrirEstiloHito(hito) {
        setEstiloHito(hito);
    }

    function eliminarHito(hito) {
        if (!confirm(`¿Eliminar el hito "${hito.titulo}"?`)) return;

        router.post(
            `/lorente-panel/configuracion/historia/${hito.id}/eliminar`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setHitos((prev) => prev.filter((h) => h.id !== hito.id)),
            },
        );
    }

    function leerImagen(archivo, maximo, alCargar) {
        if (!archivo) return;
        if (!archivo.type?.startsWith('image/')) {
            toast('El archivo no es una imagen', 'error');
            return;
        }
        if (archivo.size > maximo) {
            toast(`La imagen supera los ${maximo / (1024 * 1024)} MB`, 'error');
            return;
        }
        alCargar(URL.createObjectURL(archivo));
    }

    function alSeleccionarHero(e) {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        leerImagen(archivo, PESO_HERO, setHeroCrop);
    }

    function alConfirmarHero(archivo) {
        setHeroArchivo(archivo);
        setHeroPreview(URL.createObjectURL(archivo));
        setHeroCrop(null);
    }

    function guardarHero() {
        if (!heroArchivo) {
            toast('Selecciona y recorta la imagen del inicio', 'error');
            return;
        }

        const datos = new FormData();
        datos.append('imagen', heroArchivo);

        router.post('/lorente-panel/configuracion/hero', datos, {
            preserveScroll: true,
            onSuccess: () => {
                setHeroArchivo(null);
                toast('Imagen principal actualizada', 'ok');
            },
        });
    }

    function quitarHero() {
        if (!confirm('¿Restablecer la imagen predeterminada del inicio?')) return;

        router.post('/lorente-panel/configuracion/hero', { quitar: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                setHeroArchivo(null);
                setHeroPreview(null);
                toast('Imagen principal restablecida', 'ok');
            },
        });
    }

    function alSeleccionarNosotros(e) {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        leerImagen(archivo, PESO_NOSOTROS, setNosotrosCrop);
    }

    function alConfirmarNosotros(archivo) {
        const datos = new FormData();
        datos.append('imagen', archivo);

        router.post('/lorente-panel/configuracion/nosotros-imagenes', datos, {
            preserveScroll: true,
            onSuccess: () => toast('Imagen agregada a Nosotros', 'ok'),
            onFinish: () => setNosotrosCrop(null),
        });
    }

    function eliminarImagen(imagen) {
        if (!confirm('¿Eliminar esta imagen de Nosotros?')) return;

        router.post(
            `/lorente-panel/configuracion/nosotros-imagenes/${imagen.id}/eliminar`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setImagenes((prev) => prev.filter((i) => i.id !== imagen.id)),
            },
        );
    }

    function moverImagen(indice, direccion) {
        const destino = indice + direccion;
        if (destino < 0 || destino >= imagenes.length) return;

        const copia = [...imagenes];
        [copia[indice], copia[destino]] = [copia[destino], copia[indice]];

        setImagenes(copia);

        router.post(
            '/lorente-panel/configuracion/nosotros-imagenes/reordenar',
            { items: copia.map((imagen, i) => ({ id: imagen.id, orden: (i + 1) * 10 })) },
            { preserveScroll: true },
        );
    }

    const error = (campo) => form.errors[campo];

    return (
        <div>
            <PageHeader
                titulo="Configuración"
                descripcion="Datos institucionales, imágenes e historia publicados en el sitio."
            >
                {config.actualizado_por && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                        Última edición por {config.actualizado_por}
                    </span>
                )}
            </PageHeader>

            <div className="mt-4 flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label="Secciones de configuración">
                {PESTANAS.map((p) => (
                    <button
                        key={p.clave}
                        type="button"
                        role="tab"
                        aria-selected={pestana === p.clave}
                        onClick={() => setPestana(p.clave)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
                            pestana === p.clave
                                ? 'border-blue-800 text-blue-800'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {p.etiqueta}
                    </button>
                ))}
            </div>

            {pestana === 'datos' && (
                <form onSubmit={enviar} className="mt-4 space-y-4">
                    <section className="panel-tarjeta p-5">
                        <h2 className="panel-titulo-seccion mb-4">Contacto</h2>
                        <div className="panel-rejilla-2 grid gap-4">
                            <Campo etiqueta="Teléfono" error={error('phone')} id="config-phone">
                                <input
                                    id="config-phone"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    className="panel-campo w-full"
                                    placeholder="(01) 234 5678"
                                />
                            </Campo>
                            <Campo etiqueta="Correo institucional" error={error('email')} id="config-email">
                                <input
                                    id="config-email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    className="panel-campo w-full"
                                    placeholder="informes@lorente.edu.pe"
                                />
                            </Campo>
                            <Campo etiqueta="Dirección" error={error('direccion')} id="config-direccion" className="panel-celda-2">
                                <input
                                    id="config-direccion"
                                    value={form.data.direccion}
                                    onChange={(e) => form.setData('direccion', e.target.value)}
                                    className="panel-campo w-full"
                                />
                            </Campo>
                        </div>
                    </section>

                    <section className="panel-tarjeta p-5">
                        <h2 className="panel-titulo-seccion mb-4">Datos institucionales</h2>
                        <div className="panel-rejilla-3 grid gap-4">
                            <Campo etiqueta="Estudiantes" error={error('estudiantes')} id="config-estudiantes">
                                <input
                                    id="config-estudiantes"
                                    type="number"
                                    min="0"
                                    value={form.data.estudiantes}
                                    onChange={(e) => form.setData('estudiantes', e.target.value)}
                                    className="panel-campo w-full"
                                />
                            </Campo>
                            <Campo etiqueta="Docentes" error={error('docentes_count')} id="config-docentes">
                                <input
                                    id="config-docentes"
                                    type="number"
                                    min="0"
                                    value={form.data.docentes_count}
                                    onChange={(e) => form.setData('docentes_count', e.target.value)}
                                    className="panel-campo w-full"
                                />
                            </Campo>
                            <Campo etiqueta="Año de fundación" error={error('anio_fundacion')} id="config-anio">
                                <input
                                    id="config-anio"
                                    type="number"
                                    value={form.data.anio_fundacion}
                                    onChange={(e) => form.setData('anio_fundacion', e.target.value)}
                                    className="panel-campo w-full"
                                />
                            </Campo>
                            <Campo
                                etiqueta="Niveles"
                                error={error('niveles')}
                                ayuda="Separa los niveles con comas. Ej.: Inicial, Primaria, Secundaria."
                                id="config-niveles"
                                className="panel-celda-3"
                            >
                                <input
                                    id="config-niveles"
                                    value={form.data.niveles}
                                    onChange={(e) => form.setData('niveles', e.target.value)}
                                    className="panel-campo w-full"
                                />
                            </Campo>
                            <Campo etiqueta="Misión" error={error('mision')} id="config-mision" className="panel-celda-3">
                                <textarea
                                    id="config-mision"
                                    rows={4}
                                    value={form.data.mision}
                                    onChange={(e) => form.setData('mision', e.target.value)}
                                    className="panel-campo w-full resize-y"
                                />
                            </Campo>
                            <Campo etiqueta="Visión" error={error('vision')} id="config-vision" className="panel-celda-3">
                                <textarea
                                    id="config-vision"
                                    rows={4}
                                    value={form.data.vision}
                                    onChange={(e) => form.setData('vision', e.target.value)}
                                    className="panel-campo w-full resize-y"
                                />
                            </Campo>
                        </div>
                    </section>

                    <section className="panel-tarjeta p-5">
                        <h2 className="panel-titulo-seccion mb-4">Quiénes somos</h2>
                        <div className="space-y-4">
                            <Campo
                                etiqueta="Párrafo de presentación"
                                error={error('nosotros_intro')}
                                tooltip="Texto que aparece debajo del título Quiénes somos, antes de los valores."
                                ayuda="Si lo dejas vacío se mostrará el texto institucional predeterminado."
                                id="config-nosotros-intro"
                            >
                                <textarea
                                    id="config-nosotros-intro"
                                    rows={4}
                                    value={form.data.nosotros_intro}
                                    onChange={(e) => form.setData('nosotros_intro', e.target.value)}
                                    className="panel-campo w-full resize-y"
                                    placeholder="La I.E. N° 31501 Sebastián Lorente es una institución pública ubicada en Huancayo, Junín..."
                                />
                            </Campo>
                            <Campo
                                etiqueta="Valores"
                                error={error('nosotros_valores')}
                                tooltip="Escribe un valor por línea. Se mostrarán como etiquetas debajo del párrafo."
                                ayuda="Un valor por línea. Si lo dejas vacío se usarán los valores predeterminados."
                                id="config-nosotros-valores"
                            >
                                <textarea
                                    id="config-nosotros-valores"
                                    rows={5}
                                    value={form.data.nosotros_valores}
                                    onChange={(e) => form.setData('nosotros_valores', e.target.value)}
                                    className="panel-campo w-full resize-y"
                                    placeholder={'Respeto\nResponsabilidad\nSolidaridad'}
                                />
                            </Campo>
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="mr-auto text-[11px] text-slate-400">Editando como {auth.user?.name}.</span>
                        <Boton
                            variante="primario"
                            type="submit"
                            disabled={form.processing}
                            className="px-4 py-2 text-sm disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" /> Guardar cambios
                        </Boton>
                    </div>
                </form>
            )}

            {pestana === 'historia' && (
                <div className="mt-4 space-y-4">
                    <section className="panel-tarjeta p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="panel-titulo-seccion">Hitos de Nuestra Historia</h2>
                                <p className="text-[11px] text-slate-400">
                                    Se ordenan automáticamente por año, del más antiguo al más reciente.
                                </p>
                            </div>
                            <Boton
                                type="button"
                                onClick={abrirNuevoHito}
                                className="px-3 py-2 text-xs"
                                title="Crear un hito en una ventana"
                            >
                                <Icono nombre="mas" className="h-4 w-4" /> Nuevo hito
                            </Boton>
                        </div>

                        {hitos.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                                Aún no hay hitos. Agrega el primero.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {hitos.map((hito) => (
                                    <li key={hito.id} className="flex items-start gap-3 py-3">
                                        <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-600">
                                            {hito.anio}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-800">{hito.titulo}</p>
                                            <p className="line-clamp-2 text-xs text-slate-500">{hito.texto}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => abrirEstiloHito(hito)}
                                                className={`rounded p-1.5 transition hover:bg-slate-100 ${hito.estilo ? 'text-blue-700 hover:text-blue-900' : 'text-slate-400 hover:text-blue-700'}`}
                                                aria-label={`Estilo de ${hito.titulo}`}
                                                title="Personalizar colores y fuentes del hito"
                                            >
                                                <Icono nombre="paleta" className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => editarHito(hito)}
                                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                aria-label={`Editar ${hito.titulo}`}
                                                title="Editar hito"
                                            >
                                                <Icono nombre="editar" className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => eliminarHito(hito)}
                                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                aria-label={`Eliminar ${hito.titulo}`}
                                                title="Eliminar hito"
                                            >
                                                <Icono nombre="basura" className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <form onSubmit={enviar} className="space-y-4">
                        <section className="panel-tarjeta p-5">
                            <h2 className="panel-titulo-seccion mb-4">Párrafo de cierre</h2>
                            <Campo
                                etiqueta="Texto al final de Nuestra Historia"
                                error={error('historia_cierre')}
                                tooltip="Párrafo que aparece después de todos los hitos de la historia."
                                id="config-historia-cierre"
                            >
                                <textarea
                                    id="config-historia-cierre"
                                    rows={5}
                                    value={form.data.historia_cierre}
                                    onChange={(e) => form.setData('historia_cierre', e.target.value)}
                                    className="panel-campo w-full resize-y"
                                />
                            </Campo>
                        </section>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Boton
                                variante="primario"
                                type="submit"
                                disabled={form.processing}
                                className="px-4 py-2 text-sm disabled:opacity-60"
                            >
                                <Icono nombre="guardar" className="h-4 w-4" /> Guardar párrafo
                            </Boton>
                        </div>
                    </form>
                </div>
            )}

            {pestana === 'imagenes' && (
                <div className="mt-4 space-y-4">
                    <section className="panel-tarjeta p-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h2 className="panel-titulo-seccion">Imagen principal del inicio</h2>
                                <p className="text-[11px] text-slate-400">
                                    Se recorta a 16:9, 1920 px de ancho y formato WebP. Peso máximo de entrada: 5 MB.
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                                {config.hero_imagen ? 'Imagen personalizada' : 'Imagen predeterminada'}
                            </span>
                        </div>

                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                <img
                                    src={heroPreview || '/lorentefrontis.jpg'}
                                    alt="Vista previa de la imagen principal"
                                    className="aspect-video w-full object-cover"
                                />
                                <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2">
                                    <span className="text-[11px] text-slate-500">Vista previa 16:9</span>
                                    <span className="text-[11px] font-medium text-slate-400">
                                        {config.hero_imagen ? 'Foto actual del inicio' : 'Foto institucional predeterminada'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <FileDropzone
                                    icono="imagen"
                                    texto="Subir imagen del inicio"
                                    textoArrastrando="Suelta la imagen aquí"
                                    nota="JPG, PNG o WebP (máx. 5 MB). Se recorta a 16:9."
                                    aceptacion="image/*"
                                    onSeleccionar={alSeleccionarHero}
                                    onSoltarArchivo={(archivo) => leerImagen(archivo, PESO_HERO, setHeroCrop)}
                                />
                                {errors.imagen && (
                                    <p className="text-xs font-medium text-red-600">{errors.imagen}</p>
                                )}
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    {config.hero_imagen && (
                                        <Boton
                                            type="button"
                                            onClick={quitarHero}
                                            className="px-3 py-2 text-xs"
                                            title="Volver a usar la imagen institucional predeterminada"
                                        >
                                            Usar predeterminada
                                        </Boton>
                                    )}
                                    <Boton
                                        variante="primario"
                                        type="button"
                                        onClick={guardarHero}
                                        disabled={!heroArchivo}
                                        className="px-4 py-2 text-sm disabled:opacity-60"
                                        title={heroArchivo ? 'Guardar la imagen recortada' : 'Primero selecciona y recorta una imagen'}
                                    >
                                        <Icono nombre="guardar" className="h-4 w-4" /> Guardar imagen
                                    </Boton>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="panel-tarjeta p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="panel-titulo-seccion">Imágenes de Nosotros</h2>
                                <p className="text-[11px] text-slate-400">
                                    La imagen predeterminada siempre aparece primero. Puedes agregar hasta {MAX_NOSOTROS} imágenes adicionales.
                                </p>
                            </div>
                            {imagenes.length < MAX_NOSOTROS && (
                                <FileDropzone
                                    icono="mas"
                                    texto="Agregar imagen"
                                    textoArrastrando="Suelta la imagen aquí"
                                    nota="JPG, PNG o WebP (máx. 4 MB)"
                                    aceptacion="image/*"
                                    className="px-4 py-3"
                                    onSeleccionar={alSeleccionarNosotros}
                                    onSoltarArchivo={(archivo) => leerImagen(archivo, PESO_NOSOTROS, setNosotrosCrop)}
                                />
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="relative">
                                    <img
                                        src="/referencial.jpg"
                                        alt="Instalaciones de la IE Sebastián Lorente"
                                        className="aspect-[3/2] w-full object-cover"
                                    />
                                    <span className="absolute left-2 top-2 rounded-full bg-blue-950/90 px-2 py-1 text-[10px] font-semibold text-white">
                                        Primera imagen
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-1 p-2">
                                    <span className="text-[11px] font-medium text-slate-500">Predeterminada</span>
                                    <span className="text-[10px] text-slate-400">No se elimina</span>
                                </div>
                            </div>

                            {imagenes.map((imagen, indice) => (
                                <div key={imagen.id} className="overflow-hidden rounded-xl border border-slate-200">
                                    <div className="relative">
                                        <img
                                            src={imagen.url}
                                            alt={imagen.alt || 'Instalaciones de la IE Sebastián Lorente'}
                                            className="aspect-[3/2] w-full object-cover"
                                        />
                                        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                            Adicional {indice + 1}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 p-2">
                                        <span className="text-[11px] font-medium text-slate-500">
                                            Imagen adicional
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {imagenes.length > 1 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => moverImagen(indice, -1)}
                                                        disabled={indice === 0}
                                                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                                                        aria-label={`Adelantar imagen ${indice + 1}`}
                                                        title="Adelantar imagen"
                                                    >
                                                        <Icono nombre="subir" className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moverImagen(indice, 1)}
                                                        disabled={indice === imagenes.length - 1}
                                                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                                                        aria-label={`Atrasar imagen ${indice + 1}`}
                                                        title="Atrasar imagen"
                                                    >
                                                        <Icono nombre="subir" className="h-4 w-4 rotate-180" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => eliminarImagen(imagen)}
                                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                aria-label={`Eliminar imagen ${indice + 1}`}
                                                title="Eliminar esta imagen adicional"
                                            >
                                                <Icono nombre="basura" className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="mt-3 text-[11px] text-slate-400">
                            La imagen predeterminada no se puede eliminar. Las imágenes adicionales se muestran después de ella.
                        </p>

                        {errors.imagen && (
                            <p className="mt-3 text-xs font-medium text-red-600">{errors.imagen}</p>
                        )}
                    </section>
                </div>
            )}

            {hitoAbierto && (
                <Modal onCerrar={cerrarHito} ariaLabel={editandoId ? 'Editar hito' : 'Nuevo hito'} ancho="max-w-2xl">
                    <form onSubmit={guardarHito}>
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                    {editandoId ? 'Editar hito' : 'Nuevo hito'}
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Se ubicará automáticamente según el año ingresado.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarHito}
                                className="text-slate-400 transition hover:text-slate-700"
                                title="Cerrar"
                            >
                                <Icono nombre="cerrar" className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="panel-rejilla-3 grid gap-4">
                                <Campo
                                    etiqueta="Año o periodo"
                                    error={hitoForm.errors.anio}
                                    tooltip="Año del hito. Se usa para ordenar la historia cronológicamente."
                                    id="hito-anio"
                                >
                                    <input
                                        id="hito-anio"
                                        value={hitoForm.data.anio}
                                        onChange={(e) => hitoForm.setData('anio', e.target.value)}
                                        className="panel-campo w-full"
                                        placeholder="1952"
                                        title="Escribe el año o periodo del hito."
                                    />
                                </Campo>
                                <Campo
                                    etiqueta="Título"
                                    error={hitoForm.errors.titulo}
                                    tooltip="Título breve que resume el hito."
                                    id="hito-titulo"
                                    className="panel-celda-2"
                                >
                                    <input
                                        id="hito-titulo"
                                        value={hitoForm.data.titulo}
                                        onChange={(e) => hitoForm.setData('titulo', e.target.value)}
                                        className="panel-campo w-full"
                                        placeholder="Denominación oficial"
                                        title="Escribe el título del hito."
                                    />
                                </Campo>
                                <Campo
                                    etiqueta="Descripción"
                                    error={hitoForm.errors.texto}
                                    tooltip="Texto que se mostrará debajo del título del hito."
                                    id="hito-texto"
                                    className="panel-celda-3"
                                >
                                    <textarea
                                        id="hito-texto"
                                        rows={4}
                                        value={hitoForm.data.texto}
                                        onChange={(e) => hitoForm.setData('texto', e.target.value)}
                                        className="panel-campo w-full resize-y"
                                        title="Escribe la descripción del hito."
                                    />
                                </Campo>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                            <Boton type="button" onClick={cerrarHito} className="px-4 py-2 text-sm">
                                Cancelar
                            </Boton>
                            <Boton
                                variante="primario"
                                type="submit"
                                disabled={hitoForm.processing}
                                className="px-4 py-2 text-sm disabled:opacity-60"
                            >
                                <Icono nombre="guardar" className="h-4 w-4" />
                                {editandoId ? 'Guardar hito' : 'Agregar hito'}
                            </Boton>
                        </div>
                    </form>
                </Modal>
            )}

            {estiloHito && (
                <EditorEstiloHito hito={estiloHito} onClose={() => setEstiloHito(null)} />
            )}

            {heroCrop && (
                <Recortador
                    imagen={heroCrop}
                    aspect={16 / 9}
                    anchoSalida={1920}
                    calidad={0.85}
                    nombreSalida="hero.webp"
                    titulo="Recortar imagen del inicio"
                    textoConfirmar="Usar imagen"
                    onCancelar={() => setHeroCrop(null)}
                    onConfirmar={alConfirmarHero}
                />
            )}

            {nosotrosCrop && (
                <Recortador
                    imagen={nosotrosCrop}
                    aspect={3 / 2}
                    anchoSalida={1200}
                    calidad={0.85}
                    nombreSalida="nosotros.webp"
                    titulo="Recortar imagen de Nosotros"
                    textoConfirmar="Usar imagen"
                    onCancelar={() => setNosotrosCrop(null)}
                    onConfirmar={alConfirmarNosotros}
                />
            )}
        </div>
    );
}
