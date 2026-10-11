import { router, useForm } from '@inertiajs/react';

export default function FirstPasswordChange() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/lorente-panel/primer-ingreso/cambiar-contrasena', { preserveScroll: true });
    }

    function salir() {
        router.post('/lorente-panel/logout');
    }

    return (
        <div className="login-capa">
            <div
                className="login-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Cambio de contraseña obligatorio"
            >
                <div className="login-modal-cab">
                    <span className="login-badge">
                        <img src="/logo_lorente.webp" alt="Logo I.E. N.º 31501 Sebastián Lorente" />
                    </span>
                    <h1 className="login-modal-titulo">Cambia tu contraseña</h1>
                    <p className="login-modal-sub">Primer ingreso · define una contraseña personal (mínimo 8 caracteres)</p>
                </div>

                <div className="login-modal-cuerpo">
                    <form onSubmit={submit} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="password" className="login-label">
                                Nueva contraseña
                            </label>
                            <div className="login-campo">
                                <i className="fa-solid fa-lock" aria-hidden="true" />
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    autoFocus
                                    className="login-input"
                                    aria-invalid={errors.password ? true : undefined}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                            </div>
                            {errors.password && (
                                <p className="login-error" id="password-error" role="alert">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="login-label">
                                Confirmar contraseña
                            </label>
                            <div className="login-campo">
                                <i className="fa-solid fa-lock" aria-hidden="true" />
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="login-input"
                                    aria-invalid={errors.password_confirmation ? true : undefined}
                                    aria-describedby={
                                        errors.password_confirmation ? 'password-confirmation-error' : undefined
                                    }
                                />
                            </div>
                            {errors.password_confirmation && (
                                <p className="login-error" id="password-confirmation-error" role="alert">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <button type="submit" disabled={processing} className="login-btn">
                            {processing ? 'Guardando…' : 'Guardar contraseña'}
                        </button>
                    </form>

                    <p className="login-pie">
                        <button type="button" className="login-enlace" onClick={salir}>
                            Cerrar sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
