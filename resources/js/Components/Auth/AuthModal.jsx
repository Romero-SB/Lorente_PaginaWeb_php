import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import '../../../css/login.css';

import Turnstile from './Turnstile';

const TEXTOS = {
    login: {
        titulo: 'Panel de gestión',
        sub: 'I.E. N.º 31501 «Sebastián Lorente»',
    },
    recuperar: {
        titulo: 'Recuperar acceso',
        sub: 'Te enviaremos un enlace seguro',
    },
    restablecer: {
        titulo: 'Nueva contraseña',
        sub: 'Define una contraseña para tu cuenta',
    },
};

export default function AuthModal({ vistaInicial = 'login', token = '', email = '', onClose, actualizarUrl = true }) {
    const { status } = usePage().props;
    const [vista, setVista] = useState(vistaInicial);
    const [verClave, setVerClave] = useState(false);

    const login = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const recuperar = useForm({ email: '' });

    const restablecer = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const cerrar = useCallback(() => {
        if (onClose) {
            onClose();
        } else {
            router.visit('/');
        }
    }, [onClose]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') cerrar();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cerrar]);

    function cambiarVista(nueva) {
        setVista(nueva);

        if (actualizarUrl && typeof window !== 'undefined') {
            const ruta = nueva === 'recuperar' ? '/lorente-panel/recuperar' : '/lorente-panel/login';
            window.history.replaceState(null, '', ruta);
        }
    }

    function abrirRecuperar() {
        login.clearErrors();
        if (!recuperar.data.email) {
            recuperar.setData('email', login.data.email);
        }
        cambiarVista('recuperar');
    }

    function volverALogin() {
        recuperar.clearErrors();
        cambiarVista('login');
    }

    function enviarLogin(e) {
        e.preventDefault();
        login.post('/lorente-panel/login', { preserveScroll: true, preserveState: true });
    }

    function enviarRecuperacion(e) {
        e.preventDefault();
        recuperar.post('/lorente-panel/recuperar', { preserveScroll: true, preserveState: true });
    }

    function enviarRestablecimiento(e) {
        e.preventDefault();
        restablecer.post('/lorente-panel/restablecer', { preserveScroll: true, preserveState: true });
    }

    const texto = TEXTOS[vista] ?? TEXTOS.login;
    const mensaje = typeof status === 'string' && status.length > 0 ? status : null;
    const tituloDocumento =
        vista === 'recuperar'
            ? 'Recuperar contraseña'
            : vista === 'restablecer'
              ? 'Restablecer contraseña'
              : 'Acceso al panel';

    return (
        <div className="login-capa" onClick={(e) => e.target === e.currentTarget && cerrar()}>
            <Head title={tituloDocumento} />
            <div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-titulo">
                <div className="login-modal-cab">
                    <button
                        type="button"
                        className="login-cerrar"
                        onClick={cerrar}
                        aria-label="Cerrar"
                        title="Cerrar (Esc)"
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                    <span className="login-badge">
                        <img src="/logo_lorente.webp" alt="Logo I.E. N.º 31501 Sebastián Lorente" />
                    </span>
                    <h1 className="login-modal-titulo" id="auth-modal-titulo">
                        {texto.titulo}
                    </h1>
                    <p className="login-modal-sub">{texto.sub}</p>
                </div>

                <div className="login-modal-cuerpo">
                    {mensaje && (
                        <div className="login-aviso" role="status">
                            {mensaje}
                        </div>
                    )}

                    {vista === 'login' && (
                        <form onSubmit={enviarLogin} className="space-y-4" noValidate>
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
                                        value={login.data.email}
                                        onChange={(e) => login.setData('email', e.target.value)}
                                        placeholder="usuario@lorente.edu.pe"
                                        autoComplete="email"
                                        autoFocus
                                        className="login-input"
                                        aria-invalid={login.errors.email ? true : undefined}
                                        aria-describedby={login.errors.email ? 'email-error' : undefined}
                                    />
                                </div>
                                {login.errors.email && (
                                    <p className="login-error" id="email-error" role="alert">
                                        {login.errors.email}
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
                                        value={login.data.password}
                                        onChange={(e) => login.setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="login-input login-input--pass"
                                        aria-invalid={login.errors.password ? true : undefined}
                                        aria-describedby={login.errors.password ? 'password-error' : undefined}
                                    />
                                    <button
                                        type="button"
                                        className="login-toggle"
                                        onClick={() => setVerClave((v) => !v)}
                                        title={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <i
                                            className={verClave ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                                {login.errors.password && (
                                    <p className="login-error" id="password-error" role="alert">
                                        {login.errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="login-fila">
                                <label className="login-check">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={login.data.remember}
                                        onChange={(e) => login.setData('remember', e.target.checked)}
                                    />
                                    <span>Mantener la sesión</span>
                                </label>
                                <button type="button" className="login-enlace login-enlace--boton" onClick={abrirRecuperar}>
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <Turnstile />
                            {login.errors['cf-turnstile-response'] && (
                                <p className="login-error">{login.errors['cf-turnstile-response']}</p>
                            )}

                            <button type="submit" disabled={login.processing} className="login-btn">
                                {login.processing ? 'Ingresando…' : 'Iniciar sesión'}
                            </button>
                        </form>
                    )}

                    {vista === 'recuperar' && (
                        <form onSubmit={enviarRecuperacion} className="space-y-4" noValidate>
                            <p className="login-descripcion">
                                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                            </p>

                            <div>
                                <label htmlFor="recuperar-email" className="login-label">
                                    Correo electrónico
                                </label>
                                <div className="login-campo">
                                    <i className="fa-regular fa-envelope" aria-hidden="true" />
                                    <input
                                        id="recuperar-email"
                                        type="email"
                                        name="email"
                                        value={recuperar.data.email}
                                        onChange={(e) => recuperar.setData('email', e.target.value)}
                                        placeholder="usuario@lorente.edu.pe"
                                        autoComplete="email"
                                        autoFocus
                                        className="login-input"
                                        aria-invalid={recuperar.errors.email ? true : undefined}
                                        aria-describedby={recuperar.errors.email ? 'recuperar-email-error' : undefined}
                                    />
                                </div>
                                {recuperar.errors.email && (
                                    <p className="login-error" id="recuperar-email-error" role="alert">
                                        {recuperar.errors.email}
                                    </p>
                                )}
                            </div>

                            <Turnstile />
                            {recuperar.errors['cf-turnstile-response'] && (
                                <p className="login-error">{recuperar.errors['cf-turnstile-response']}</p>
                            )}

                            <button type="submit" disabled={recuperar.processing} className="login-btn">
                                {recuperar.processing ? 'Enviando…' : 'Enviar enlace'}
                            </button>
                        </form>
                    )}

                    {vista === 'restablecer' && (
                        <form onSubmit={enviarRestablecimiento} className="space-y-4" noValidate>
                            <p className="login-descripcion">Elige una contraseña nueva para tu cuenta.</p>

                            {restablecer.errors.email && (
                                <p className="login-error" role="alert">
                                    {restablecer.errors.email}
                                </p>
                            )}

                            <div>
                                <label htmlFor="nueva-password" className="login-label">
                                    Nueva contraseña
                                </label>
                                <div className="login-campo">
                                    <i className="fa-solid fa-lock" aria-hidden="true" />
                                    <input
                                        id="nueva-password"
                                        type="password"
                                        name="password"
                                        value={restablecer.data.password}
                                        onChange={(e) => restablecer.setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        autoFocus
                                        className="login-input"
                                        aria-invalid={restablecer.errors.password ? true : undefined}
                                        aria-describedby={restablecer.errors.password ? 'nueva-password-error' : undefined}
                                    />
                                </div>
                                {restablecer.errors.password && (
                                    <p className="login-error" id="nueva-password-error" role="alert">
                                        {restablecer.errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmar-password" className="login-label">
                                    Confirmar contraseña
                                </label>
                                <div className="login-campo">
                                    <i className="fa-solid fa-lock" aria-hidden="true" />
                                    <input
                                        id="confirmar-password"
                                        type="password"
                                        name="password_confirmation"
                                        value={restablecer.data.password_confirmation}
                                        onChange={(e) => restablecer.setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        className="login-input"
                                        aria-invalid={restablecer.errors.password_confirmation ? true : undefined}
                                        aria-describedby={
                                            restablecer.errors.password_confirmation
                                                ? 'confirmar-password-error'
                                                : undefined
                                        }
                                    />
                                </div>
                                {restablecer.errors.password_confirmation && (
                                    <p className="login-error" id="confirmar-password-error" role="alert">
                                        {restablecer.errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <Turnstile />
                            {restablecer.errors['cf-turnstile-response'] && (
                                <p className="login-error">{restablecer.errors['cf-turnstile-response']}</p>
                            )}

                            <button type="submit" disabled={restablecer.processing} className="login-btn">
                                {restablecer.processing ? 'Guardando…' : 'Restablecer contraseña'}
                            </button>
                        </form>
                    )}

                    <p className="login-pie">
                        {vista === 'login' && (
                            <button type="button" className="login-enlace login-enlace--boton" onClick={cerrar}>
                                ← Volver al sitio
                            </button>
                        )}
                        {vista === 'recuperar' && (
                            <button type="button" className="login-enlace login-enlace--boton" onClick={volverALogin}>
                                ← Volver a iniciar sesión
                            </button>
                        )}
                        {vista === 'restablecer' && (
                            <Link href="/lorente-panel/login" className="login-enlace">
                                ← Volver a iniciar sesión
                            </Link>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
