import { useEffect, useState } from 'react';

import Skeleton from './Skeleton';

export default function Imagen({ src, alt = '', className = '', style, fallback = null, ...resto }) {
    const [cargando, setCargando] = useState(Boolean(src));
    const [error, setError] = useState(!src);

    useEffect(() => {
        setCargando(Boolean(src));
        setError(!src);
    }, [src]);

    if (error) {
        return fallback;
    }

    return (
        <>
            {cargando && <Skeleton className="img-sk" width="100%" height="100%" borderRadius={0} />}
            <img
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
