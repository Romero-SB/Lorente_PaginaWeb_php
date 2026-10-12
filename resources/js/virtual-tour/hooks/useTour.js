import { useCallback, useEffect, useState } from 'react';

import { validateTour } from '../model/validators';
import { getPublishedTour } from '../services/tourApi';

// ============================================================
// useTour — Hook reactivo para el visor público
// IE N° 31501 «Sebastián Lorente»
// ============================================================

export function useTour() {
    const [tour, setTour] = useState(null);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [validation, setValidation] = useState(null);

    const load = useCallback(async () => {
        setStatus('loading');
        setError(null);
        try {
            const data = await getPublishedTour();
            const result = validateTour(data);
            setTour(data);
            setValidation(result);
            setStatus('success');

            if (!result.valid) {
                console.warn('[useTour] Advertencias de integridad en el recorrido:', result.issues);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido al cargar el recorrido.';
            setError(msg);
            setStatus('error');
            console.error('[useTour]', err);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        getPublishedTour()
            .then((data) => {
                if (!isMounted) return;
                const result = validateTour(data);
                setTour(data);
                setValidation(result);
                setStatus('success');
            })
            .catch((err) => {
                if (!isMounted) return;
                setError(err instanceof Error ? err.message : 'Error al cargar el recorrido.');
                setStatus('error');
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { tour, status, error, validation, reload: load };
}