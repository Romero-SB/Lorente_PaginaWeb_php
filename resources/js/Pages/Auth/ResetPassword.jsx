import { Link, useForm } from '@inertiajs/react';

import Turnstile from '../../Components/Auth/Turnstile';
import AuthLayout from '../../Layouts/AuthLayout';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/lorente-panel/restablecer', { preserveScroll: true });
    }

    return (
        <AuthLayout title="Restablecer contraseña">
            <h2 className="text-lg font-bold text-gray-900">Nueva contraseña</h2>
            <p className="mt-1 text-sm text-gray-500">Elige una contraseña para tu cuenta.</p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Nueva contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        autoFocus
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                        Confirmar contraseña
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {errors.password_confirmation && (
                        <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
                    )}
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
                    {processing ? 'Guardando…' : 'Restablecer contraseña'}
                </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
                <Link href="/lorente-panel/login" className="font-medium text-indigo-600 hover:underline">
                    Volver a iniciar sesión
                </Link>
            </p>
        </AuthLayout>
    );
}