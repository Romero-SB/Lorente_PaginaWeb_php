import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import Turnstile from '../../Components/Auth/Turnstile';

export default function Login() {
    const [verClave, setVerClave] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function salir() {
        router.visit('/');
    }

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') salir();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function submit(e) {
        e.preventDefault();
        post('/lorente-panel/login', { preserveScroll: true });
    }

    const modal = (
        <div className="login-capa" onClick={(e) => e.target === e.currentTarget && salir()}>
            <div className="login-modal" role="dialog" aria-modal="true" aria-label="Acceso al panel">
                <div className="login-modal-cab">
                    <button
                        type="button"
                        className="login-cerrar"
                        onClick={salir}
                        aria-label="Cerrar y volver al sitio"
                        title="Cerrar (Esc)"
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                    <span className="login-badge">
                        <img src="/logo_lorente.webp" alt="Logo I.E. N.º 31501 Sebastián Lorente" />
                    </span>
                    <h1 className="login-modal-titulo">Panel de gestión</h1>
                    <p className="login-modal-sub">I.E. N.º 31501 «Sebastián Lorente»</p>
                </div>

                <div className="login-modal-cuerpo">
                    <form onSubmit={submit} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="email" className="login-label">
                                Correo electrónico
                            </label>
                            <div className="login-campo">
                                <i className="fa-regular fa-envelope" aria-hidden="true" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="usuario@lorente.edu.pe"
                                    autoComplete="email"
                                    autoFocus
                                    className="login-input"
                                    aria-invalid={errors.email ? true : undefined}
                                    aria-describedby={errors.email ? 'email-error' : undefined}
                                />
                            </div>
                            {errors.email && (
                                <p className="login-error" id="email-error" role="alert">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="login-label">
                                Contraseña
                            </label>
                            <div className="login-campo">
                                <i className="fa-solid fa-lock" aria-hidden="true" />
                                <input
                                    id="password"
                                    type={verClave ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="login-input login-input--pass"
                                    aria-invalid={errors.password ? true : undefined}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                                <button
                                    type="button"
                                    className="login-toggle"
                                    onClick={() => setVerClave((v) => !v)}
                                    title={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    <i className={verClave ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} aria-hidden="true" />
                                </button>
                            </div>
                            {errors.password && (
                                <p className="login-error" id="password-error" role="alert">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="login-fila">
                            <label className="login-check">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span>Mantener la sesión</span>
                            </label>
                            <Link href="/lorente-panel/recuperar" className="login-enlace">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <Turnstile />
                        {errors['cf-turnstile-response'] && (
                            <p className="login-error">{errors['cf-turnstile-response']}</p>
                        )}

                        <button type="submit" disabled={processing} className="login-btn">
                            {processing ? 'Ingresando…' : 'Iniciar sesión'}
                        </button>
                    </form>

                    <p className="login-pie">
                        <Link href="/" className="login-enlace">
                            ← Volver al sitio
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );

    return modal;
}
