import { Link } from '@inertiajs/react';
import { Head } from '@inertiajs/react';

export default function AuthLayout({ title, children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-950 via-indigo-900 to-blue-900 px-4 py-10">
            <Head title={title} />
            <div className="w-full max-w-md">
                <div className="mb-6 flex flex-col items-center">
                    <img
                        src="/logo_lorente.webp"
                        alt="Logo I.E. N.º 31501 Sebastián Lorente"
                        className="h-24 w-auto"
                    />
                    <h1 className="mt-4 text-center text-2xl font-bold text-white">Panel de gestión</h1>
                    <p className="mt-1 text-sm text-blue-200">I.E. N.º 31501 «Sebastián Lorente»</p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">{children}</div>
                <p className="mt-6 text-center text-xs text-blue-200">
                    <Link href="/" className="hover:underline">
                        ← Volver al sitio
                    </Link>
                </p>
            </div>
        </div>
    );
}