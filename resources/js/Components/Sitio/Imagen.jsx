import { useEffect, useRef, useState } from 'react';

import Skeleton from './Skeleton';

export default function Imagen({ src, alt = '', className = '', style, fallback = null, ...resto }) {
    const referencia = useRef(null);
    const [cargando, setCargando] = useState(Boolean(src));
    const [error, setError] = useState(!src);

    useEffect(() => {
        setCargando(Boolean(src));
        setError(!src);
    }, [src]);

    useEffect(() => {
        const img = referencia.current;
        if (!img || !src || !img.complete) return;

        if (img.naturalWidth > 0) {
            setCargando(false);
        } else {
            setError(true);
        }
    }, [src]);

    if (error) {
        return fallback;
    }

    return (
        <>
            {cargando && <Skeleton className="img-sk" width="100%" height="100%" borderRadius={0} />}
            <img
                ref={referencia}
                src={src}
                alt={alt}
                className={className}
                style={style}
                onLoad={() => setCargando(false)}
                onError={() => {
                    setCargando(false);
                    setError(true);
                }}
                {...resto}
            />
        </>
    );
}
