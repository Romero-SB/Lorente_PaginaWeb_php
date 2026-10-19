import { useEffect, useState } from 'react';

import { subscribeToasts } from '../../lib/toast';
import { Icono } from './Iconos';

const ICONOS = {
    ok: 'check',
    error: 'cerrar',
    info: 'panel',
};

export function Toasts() {
    const [items, setItems] = useState([]);

    useEffect(() => subscribeToasts(setItems), []);

    return (
        <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
            {items.map((t) => (
                <div key={t.id} className={`panel-toast panel-toast--${t.tipo || 'ok'}`}>
                    <span className="panel-toast-icono">
                        <Icono nombre={ICONOS[t.tipo] || ICONOS.ok} className="h-4 w-4" />
                    </span>
                    <span>{t.mensaje}</span>
                </div>
            ))}
        </div>
    );
}