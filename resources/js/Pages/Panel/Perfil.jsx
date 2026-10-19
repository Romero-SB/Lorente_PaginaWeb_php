import { useForm } from '@inertiajs/react';

import { Icono } from '../../Components/Panel/Iconos';
import Boton from '../../Components/Shared/Boton';
import Campo from '../../Components/Shared/Campo';
import PageHeader from '../../Components/Shared/PageHeader';

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
            <PageHeader
                titulo="Mi perfil"
                descripcion="Actualiza tus datos personales y tu contraseña."
            >
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-800">
                    {perfil.rol_etiqueta}
                </span>
            </PageHeader>

            {perfil.debe_cambiar_password && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Debes cambiar tu contraseña al ingresar.
                </div>
            )}

            <form onSubmit={enviarDatos} className="mt-4">
                <section className="panel-tarjeta p-5">
                    <h2 className="panel-titulo-seccion mb-4">Datos personales</h2>
                    <div className="panel-rejilla-2 grid gap-4">
                        <Campo etiqueta="Nombre completo" error={datos.errors.name} id="perfil-nombre">
                            <input
                                id="perfil-nombre"
                                value={datos.data.name}
                                onChange={(e) => datos.setData('name', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo
                            etiqueta="Correo electrónico"
                            error={datos.errors.email}
                            ayuda="El correo de acceso no se puede modificar."
                            id="perfil-email"
                        >
                            <input
                                id="perfil-email"
                                type="email"
                                value={datos.data.email}
                                readOnly
                                aria-readonly="true"
                                className="panel-campo w-full cursor-not-allowed bg-slate-100 text-slate-500"
                            />
                        </Campo>
                        <Campo etiqueta="Cargo" error={datos.errors.cargo} id="perfil-cargo" className="panel-celda-2">
                            <input
                                id="perfil-cargo"
                                value={datos.data.cargo}
                                onChange={(e) => datos.setData('cargo', e.target.value)}
                                className="panel-campo w-full"
                                placeholder="Ej.: Director, Coordinador académico"
                            />
                        </Campo>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Boton
                            variante="primario"
                            type="submit"
                            disabled={datos.processing}
                            className="px-4 py-2 text-sm disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" /> Guardar datos
                        </Boton>
                    </div>
                </section>
            </form>

            <form onSubmit={enviarClave} className="mt-4">
                <section className="panel-tarjeta p-5">
                    <h2 className="panel-titulo-seccion mb-1">Cambiar contraseña</h2>
                    <p className="mb-4 text-xs text-slate-500">Debe tener al menos 8 caracteres.</p>
                    <div className="panel-rejilla-3 grid gap-4">
                        <Campo etiqueta="Contraseña actual" error={clave.errors.actual} id="perfil-actual">
                            <input
                                id="perfil-actual"
                                type="password"
                                value={clave.data.actual}
                                onChange={(e) => clave.setData('actual', e.target.value)}
                                className="panel-campo w-full"
                                autoComplete="current-password"
                            />
                        </Campo>
                        <Campo etiqueta="Nueva contraseña" error={clave.errors.password} id="perfil-nueva">
                            <input
                                id="perfil-nueva"
                                type="password"
                                value={clave.data.password}
                                onChange={(e) => clave.setData('password', e.target.value)}
                                className="panel-campo w-full"
                                autoComplete="new-password"
                            />
                        </Campo>
                        <Campo etiqueta="Confirmar contraseña" error={clave.errors.password_confirmation} id="perfil-confirmacion">
                            <input
                                id="perfil-confirmacion"
                                type="password"
                                value={clave.data.password_confirmation}
                                onChange={(e) => clave.setData('password_confirmation', e.target.value)}
                                className="panel-campo w-full"
                                autoComplete="new-password"
                            />
                        </Campo>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Boton
                            variante="primario"
                            type="submit"
                            disabled={clave.processing}
                            className="px-4 py-2 text-sm disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" /> Cambiar contraseña
                        </Boton>
                    </div>
                </section>
            </form>
        </div>
    );
}