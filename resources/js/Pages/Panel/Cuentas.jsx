import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import PanelLayout from '../../Layouts/PanelLayout';

const claseInput =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function colorRol(rol) {
    if (rol === 'super-usuario') return 'bg-purple-50 text-purple-700';
    if (rol === 'administrador') return 'bg-blue-50 text-blue-700';
    return 'bg-emerald-50 text-emerald-700';
}

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

export default function Cuentas({ cuentas = [], roles_asignables = [], es_super = false }) {
    const [mostrarForm, setMostrarForm] = useState(false);
    const [resetId, setResetId] = useState(null);

    const alta = useForm({
        name: '',
        email: '',
        cargo: '',
        role: roles_asignables[0]?.valor || 'docente',
        password: '',
        password_confirmation: '',
    });

    const reset = useForm({ password: '', password_confirmation: '' });

    function abrirAlta() {
        alta.reset();
        alta.clearErrors();
        setResetId(null);
        setMostrarForm(true);
    }

    function cerrarAlta() {
        setMostrarForm(false);
        alta.reset();
    }

    function enviarAlta(e) {
        e.preventDefault();
        alta.post('/lorente-panel/cuentas', {
            preserveScroll: true,
            onSuccess: () => cerrarAlta(),
        });
    }

    function abrirReset(cuenta) {
        reset.reset();
        reset.clearErrors();
        setMostrarForm(false);
        setResetId(cuenta.id);
    }

    function enviarReset(e, cuenta) {
        e.preventDefault();
        reset.post(`/lorente-panel/cuentas/${cuenta.id}/password`, {
            preserveScroll: true,
            onSuccess: () => {
                setResetId(null);
                reset.reset();
            },
        });
    }

    function eliminar(cuenta) {
        if (!confirm(`¿Eliminar la cuenta de ${cuenta.name}? Esta acción no se puede deshacer.`)) return;
        router.post(`/lorente-panel/cuentas/${cuenta.id}/eliminar`, {}, { preserveScroll: true });
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Cuentas</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {es_super
                            ? 'Crea y administra las cuentas de administradores y docentes.'
                            : 'Administra las cuentas de docentes.'}
                    </p>
                </div>
                <button
                    onClick={abrirAlta}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                >
                    <Icono nombre="mas" className="h-4 w-4" /> Nueva cuenta
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={enviarAlta} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Nueva cuenta</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Campo etiqueta="Nombre completo" error={alta.errors.name}>
                            <input
                                value={alta.data.name}
                                onChange={(e) => alta.setData('name', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <Campo etiqueta="Correo electrónico" error={alta.errors.email}>
                            <input
                                type="email"
                                value={alta.data.email}
                                onChange={(e) => alta.setData('email', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <Campo etiqueta="Cargo" error={alta.errors.cargo}>
                            <input
                                value={alta.data.cargo}
                                onChange={(e) => alta.setData('cargo', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <Campo etiqueta="Rol" error={alta.errors.role}>
                            <select
                                value={alta.data.role}
                                onChange={(e) => alta.setData('role', e.target.value)}
                                className={claseInput}
                            >
                                {roles_asignables.map((rol) => (
                                    <option key={rol.valor} value={rol.valor}>
                                        {rol.etiqueta}
                                    </option>
                                ))}
                            </select>
                        </Campo>
                        <Campo
                            etiqueta="Contraseña temporal"
                            error={alta.errors.password}
                            ayuda="La persona deberá cambiarla en su primer ingreso."
                        >
                            <input
                                type="password"
                                value={alta.data.password}
                                onChange={(e) => alta.setData('password', e.target.value)}
                                className={claseInput}
                                autoComplete="new-password"
                            />
                        </Campo>
                        <Campo etiqueta="Confirmar contraseña" error={alta.errors.password_confirmation}>
                            <input
                                type="password"
                                value={alta.data.password_confirmation}
                                onChange={(e) => alta.setData('password_confirmation', e.target.value)}
                                className={claseInput}
                                autoComplete="new-password"
                            />
                        </Campo>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={cerrarAlta}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={alta.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" /> Crear cuenta
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-4 space-y-3">
                {cuentas.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                        No hay cuentas registradas.
                    </div>
                )}

                {cuentas.map((cuenta) => (
                    <div key={cuenta.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-sm font-bold text-slate-900">{cuenta.name}</h3>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorRol(cuenta.rol)}`}>
                                        {cuenta.rol_etiqueta}
                                    </span>
                                    {cuenta.es_propia && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                            Tú
                                        </span>
                                    )}
                                    {cuenta.debe_cambiar_password && (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                            Debe cambiar contraseña
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 truncate text-xs text-slate-500">{cuenta.email}</p>
                                {cuenta.cargo && <p className="mt-0.5 text-xs text-slate-400">{cuenta.cargo}</p>}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {cuenta.puede_gestionar && (
                                    <button
                                        onClick={() => abrirReset(cuenta)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <Icono nombre="editar" className="h-3.5 w-3.5" /> Restablecer contraseña
                                    </button>
                                )}
                                {cuenta.puede_eliminar && (
                                    <button
                                        onClick={() => eliminar(cuenta)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                        <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                    </button>
                                )}
                            </div>
                        </div>

                        {resetId === cuenta.id && (
                            <form
                                onSubmit={(e) => enviarReset(e, cuenta)}
                                className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2"
                            >
                                <Campo
                                    etiqueta="Nueva contraseña"
                                    error={reset.errors.password}
                                    ayuda="Se forzará el cambio al iniciar sesión."
                                >
                                    <input
                                        type="password"
                                        value={reset.data.password}
                                        onChange={(e) => reset.setData('password', e.target.value)}
                                        className={claseInput}
                                        autoComplete="new-password"
                                    />
                                </Campo>
                                <Campo etiqueta="Confirmar contraseña" error={reset.errors.password_confirmation}>
                                    <input
                                        type="password"
                                        value={reset.data.password_confirmation}
                                        onChange={(e) => reset.setData('password_confirmation', e.target.value)}
                                        className={claseInput}
                                        autoComplete="new-password"
                                    />
                                </Campo>
                                <div className="flex items-center justify-end gap-2 sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResetId(null);
                                            reset.reset();
                                        }}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={reset.processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                                    >
                                        <Icono nombre="guardar" className="h-4 w-4" /> Guardar contraseña
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

Cuentas.layout = (page) => <PanelLayout children={page} />;
