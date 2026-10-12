import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import Boton from '../../Components/Shared/Boton';
import Campo from '../../Components/Shared/Campo';
import EmptyState from '../../Components/Shared/EmptyState';
import PageHeader from '../../Components/Shared/PageHeader';
import Paginacion from '../../Components/Shared/Paginacion';

function colorRol(rol) {
    if (rol === 'super-usuario') return 'bg-purple-50 text-purple-700';
    if (rol === 'administrador') return 'bg-blue-50 text-blue-700';
    return 'bg-emerald-50 text-emerald-700';
}

export default function Cuentas({ cuentas = { data: [], links: [], meta: {} }, roles_asignables = [], es_super = false }) {
    const items = cuentas?.data ?? [];
    const links = cuentas?.links ?? [];
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

    function visitarPagina(url) {
        router.visit(url, { preserveScroll: true });
    }

    return (
        <div>
            <PageHeader
                titulo="Cuentas"
                descripcion={
                    es_super
                        ? 'Crea y administra las cuentas de administradores y docentes.'
                        : 'Administra las cuentas de docentes.'
                }
            >
                <Boton variante="primario" onClick={abrirAlta} className="px-3 py-2 text-sm">
                    <Icono nombre="mas" className="h-4 w-4" /> Nueva cuenta
                </Boton>
            </PageHeader>

            {mostrarForm && (
                <form onSubmit={enviarAlta} className="panel-tarjeta mt-4 p-5">
                    <h2 className="panel-titulo-seccion mb-4">Nueva cuenta</h2>
                    <div className="panel-rejilla-2 grid gap-4">
                        <Campo etiqueta="Nombre completo" error={alta.errors.name} id="cuenta-nombre">
                            <input
                                id="cuenta-nombre"
                                value={alta.data.name}
                                onChange={(e) => alta.setData('name', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo etiqueta="Correo electrónico" error={alta.errors.email} id="cuenta-email">
                            <input
                                id="cuenta-email"
                                type="email"
                                value={alta.data.email}
                                onChange={(e) => alta.setData('email', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo etiqueta="Cargo" error={alta.errors.cargo} id="cuenta-cargo">
                            <input
                                id="cuenta-cargo"
                                value={alta.data.cargo}
                                onChange={(e) => alta.setData('cargo', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo etiqueta="Rol" error={alta.errors.role} id="cuenta-rol">
                            <select
                                id="cuenta-rol"
                                value={alta.data.role}
                                onChange={(e) => alta.setData('role', e.target.value)}
                                className="panel-campo w-full"
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
                            id="cuenta-password"
                        >
                            <input
                                id="cuenta-password"
                                type="password"
                                value={alta.data.password}
                                onChange={(e) => alta.setData('password', e.target.value)}
                                className="panel-campo w-full"
                                autoComplete="new-password"
                            />
                        </Campo>
                        <Campo etiqueta="Confirmar contraseña" error={alta.errors.password_confirmation} id="cuenta-password-confirmacion">
                            <input
                                id="cuenta-password-confirmacion"
                                type="password"
                                value={alta.data.password_confirmation}
                                onChange={(e) => alta.setData('password_confirmation', e.target.value)}
                                className="panel-campo w-full"
                                autoComplete="new-password"
                            />
                        </Campo>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <Boton type="button" onClick={cerrarAlta} className="px-3 py-2 text-sm hover:bg-slate-50">
                            Cancelar
                        </Boton>
                        <Boton
                            variante="primario"
                            type="submit"
                            disabled={alta.processing}
                            className="px-4 py-2 text-sm disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" /> Crear cuenta
                        </Boton>
                    </div>
                </form>
            )}

            <div className="mt-4 space-y-3">
                {items.length === 0 && (
                    <EmptyState icono={null} mensaje="No hay cuentas registradas." className="p-8" />
                )}

                {items.map((cuenta) => (
                    <div key={cuenta.id} className="panel-tarjeta p-4">
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
                                    <Boton onClick={() => abrirReset(cuenta)} className="px-3 py-1.5 text-xs border-slate-200 hover:bg-slate-50">
                                        <Icono nombre="editar" className="h-3.5 w-3.5" /> Restablecer contraseña
                                    </Boton>
                                )}
                                {cuenta.puede_eliminar && (
                                    <Boton onClick={() => eliminar(cuenta)} className="px-3 py-1.5 text-xs border-red-100 text-red-600 hover:bg-red-50">
                                        <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                    </Boton>
                                )}
                            </div>
                        </div>

                        {resetId === cuenta.id && (
                            <form
                                onSubmit={(e) => enviarReset(e, cuenta)}
                                className="panel-rejilla-2 mt-4 grid gap-3 border-t border-slate-100 pt-4"
                            >
                                <Campo
                                    etiqueta="Nueva contraseña"
                                    error={reset.errors.password}
                                    ayuda="Se forzará el cambio al iniciar sesión."
                                    id={`reset-${cuenta.id}-password`}
                                >
                                    <input
                                        id={`reset-${cuenta.id}-password`}
                                        type="password"
                                        value={reset.data.password}
                                        onChange={(e) => reset.setData('password', e.target.value)}
                                        className="panel-campo w-full"
                                        autoComplete="new-password"
                                    />
                                </Campo>
                                <Campo etiqueta="Confirmar contraseña" error={reset.errors.password_confirmation} id={`reset-${cuenta.id}-confirmacion`}>
                                    <input
                                        id={`reset-${cuenta.id}-confirmacion`}
                                        type="password"
                                        value={reset.data.password_confirmation}
                                        onChange={(e) => reset.setData('password_confirmation', e.target.value)}
                                        className="panel-campo w-full"
                                        autoComplete="new-password"
                                    />
                                </Campo>
                                <div className="panel-celda-2 flex items-center justify-end gap-2">
                                    <Boton
                                        type="button"
                                        onClick={() => {
                                            setResetId(null);
                                            reset.reset();
                                        }}
                                        className="px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </Boton>
                                    <Boton
                                        variante="primario"
                                        type="submit"
                                        disabled={reset.processing}
                                        className="px-4 py-2 text-sm disabled:opacity-60"
                                    >
                                        <Icono nombre="guardar" className="h-4 w-4" /> Guardar contraseña
                                    </Boton>
                                </div>
                            </form>
                        )}
                    </div>
                ))}
            </div>

            <Paginacion links={links} onNavegar={visitarPagina} className="mt-4" />
        </div>
    );
}