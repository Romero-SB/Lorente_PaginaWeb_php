import { Link, useForm } from '@inertiajs/react';

import Turnstile from '../../Components/Auth/Turnstile';
import AuthLayout from '../../Layouts/AuthLayout';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e) {
        e.preventDefault();
        post('/lorente-panel/recuperar', { preserveScroll: true });
    }

    return (
        <AuthLayout title="Recuperar contraseña">
            <h2 className="text-lg font-bold text-gray-900">Recuperar contraseña</h2>
            <p className="mt-1 text-sm text-gray-500">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {status && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{status}</div>}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Correo electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                        autoFocus
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <Turnstile />
                {errors['cf-turnstile-response'] && (
                    <p className="text-xs text-red-600">{errors['cf-turnstile-response']}</p>
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {processing ? 'Enviando…' : 'Enviar enlace'}
                </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
                ¿Recordaste tu contraseña?{' '}
                <Link href="/lorente-panel/login" className="font-medium text-indigo-600 hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </AuthLayout>
    );
}