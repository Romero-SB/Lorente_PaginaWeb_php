import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function Toast() {
    const { flash } = usePage().props;
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (flash?.ok) {
            setMsg({ texto: flash.ok, tipo: 'ok' });
        } else if (flash?.error) {
            setMsg({ texto: flash.error, tipo: 'err' });
        }
    }, [flash?.ok, flash?.error]);

    useEffect(() => {
        if (!msg) return undefined;
        const id = setTimeout(() => setMsg(null), 3800);
        return () => clearTimeout(id);
    }, [msg]);

    return <div className={`toast ${msg ? 'show' : ''} ${msg?.tipo || ''}`}>{msg?.texto}</div>;
}
