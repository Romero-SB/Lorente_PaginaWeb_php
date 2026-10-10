import { Link, useForm } from '@inertiajs/react';

import Turnstile from '../../Components/Auth/Turnstile';
import AuthLayout from '../../Layouts/AuthLayout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/lorente-panel/login', { preserveScroll: true });
    }

    return (
        <AuthLayout title="Iniciar sesión">
            <h2 className="text-lg font-bold text-gray-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-gray-500">Panel de administración institucional.</p>

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

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="current-password"
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center text-sm text-gray-600">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2">Mantener la sesión</span>
                    </label>
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
                    {processing ? 'Ingresando…' : 'Iniciar sesión'}
                </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
                ¿Olvidaste tu contraseña?{' '}
                <Link href="/lorente-panel/recuperar" className="font-medium text-indigo-600 hover:underline">
                    Recupérala aquí
                </Link>
            </p>
        </AuthLayout>
    );
}