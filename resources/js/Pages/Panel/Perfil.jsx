import { useForm } from '@inertiajs/react';

import { Icono } from '../../Components/Panel/Iconos';
import PanelLayout from '../../Layouts/PanelLayout';

const claseInput =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function Campo({ etiqueta, children, error, ayuda }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{etiqueta}</label>
            {children}
            {ayuda && <p className="mt-1 text-[11px] text-slate-400">{ayuda}</p>}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default function Perfil({ perfil = {} }) {
    const datos = useForm({
        name: perfil.name || '',
        email: perfil.email || '',
        cargo: perfil.cargo || '',
    });

    const clave = useForm({
        actual: '',
        password: '',
        password_confirmation: '',
    });

    function enviarDatos(e) {
        e.preventDefault();
        datos.post('/lorente-panel/perfil', { preserveScroll: true });
    }

    function enviarClave(e) {
        e.preventDefault();
        clave.post('/lorente-panel/perfil/password', {
            preserveScroll: true,
            onSuccess: () => clave.reset(),
        });
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Mi perfil</h1>
                    <p className="mt-1 text-sm text-slate-500">Actualiza tus datos personales y tu contraseña.</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-800">
                    {perfil.rol_etiqueta}
                </span>
            </div>

            {perfil.debe_cambiar_password && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Debes cambiar tu contraseña al ingresar.
                </div>
            )}

            <form onSubmit={enviarDatos} className="mt-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Datos personales</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Campo etiqueta="Nombre completo" error={datos.errors.name}>
                            <input
                                value={datos.data.name}
                                onChange={(e) => datos.setData('name', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <Campo
                            etiqueta="Correo electrónico"
                            error={datos.errors.email}
                            ayuda="Con este correo inicias sesión."
                        >
                            <input
                                type="email"
                                value={datos.data.email}
                                onChange={(e) => datos.setData('email', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <div className="sm:col-span-2">
                            <Campo etiqueta="Cargo" error={datos.errors.cargo}>
                                <input
                                    value={datos.data.cargo}
                                    onChange={(e) => datos.setData('cargo', e.target.value)}
                                    className={claseInput}
                                    placeholder="Ej.: Director, Coordinador académico"
                                />
                            </Campo>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={datos.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" /> Guardar datos
                        </button>
                    </div>
                </section>
            </form>

            <form onSubmit={enviarClave} className="mt-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-1 text-sm font-bold text-slate-900">Cambiar contraseña</h2>
                    <p className="mb-4 text-xs text-slate-500">Debe tener al menos 8 caracteres.</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Campo etiqueta="Contraseña actual" error={clave.errors.actual}>
                            <input
                                type="password"
                                value={clave.data.actual}
                                onChange={(e) => clave.setData('actual', e.target.value)}
                                className={claseInput}
                                autoComplete="current-password"
                            />
                        </Campo>
                        <Campo etiqueta="Nueva contraseña" error={clave.errors.password}>
                            <input
                                type="password"
                                value={clave.data.password}
                                onChange={(e) => clave.setData('password', e.target.value)}
                                className={claseInput}
                                autoComplete="new-password"
                            />
                        </Campo>
                        <Campo etiqueta="Confirmar contraseña" error={clave.errors.password_confirmation}>
                            <input
                                type="password"
                                value={clave.data.password_confirmation}
                                onChange={(e) => clave.setData('password_confirmation', e.target.value)}
                                className={claseInput}
                                autoComplete="new-password"
                            />
                        </Campo>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={clave.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" /> Cambiar contraseña
                        </button>
                    </div>
                </section>
            </form>
        </div>
    );
}

Perfil.layout = (page) => <PanelLayout children={page} />;
