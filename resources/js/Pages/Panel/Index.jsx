import { Head, router, usePage } from '@inertiajs/react';

export default function PanelIndex() {
    const { auth } = usePage().props;

    function logout() {
        router.post('/lorente-panel/logout');
    }

    return (
        <>
            <Head title="Panel" />
            <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
                    <img src="/logo_lorente.webp" alt="Logo" className="mx-auto h-20 w-auto" />
                    <h1 className="mt-4 text-xl font-bold text-gray-900">
                        Hola, {auth.user?.name}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Rol: {auth.user?.role}</p>
                    {auth.user?.cargo && <p className="mt-1 text-sm text-gray-500">{auth.user.cargo}</p>}
                    <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                        El panel completo (ventana flotante, noticias, docentes y documentos) se construye en las
                        siguientes fases.
                    </p>
                    <button
                        onClick={logout}
                        className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </>
    );
}