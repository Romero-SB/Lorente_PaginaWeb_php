import { useEffect, useState } from 'react';

import { subscribeToasts } from '../../lib/toast';

const ESTILOS = {
    ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    error: 'border-red-300 bg-red-50 text-red-800',
    info: 'border-sky-300 bg-sky-50 text-sky-800',
};

export function Toasts() {
    const [items, setItems] = useState([]);

    useEffect(() => subscribeToasts(setItems), []);

    return (
        <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
            {items.map((t) => (
                <div
                    key={t.id}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${ESTILOS[t.tipo] || ESTILOS.ok}`}
                >
                    {t.mensaje}
                </div>
            ))}
        </div>
    );
}