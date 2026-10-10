import { Head } from '@inertiajs/react';

export default function Home() {
    return (
        <>
            <Head title="Inicio" />
            <main style={{ fontFamily: 'sans-serif', padding: '4rem', textAlign: 'center' }}>
                <h1>I.E. N° 31501 «Sebastián Lorente»</h1>
                <p>Proyecto Laravel + Inertia + React operativo.</p>
            </main>
        </>
    );
}
