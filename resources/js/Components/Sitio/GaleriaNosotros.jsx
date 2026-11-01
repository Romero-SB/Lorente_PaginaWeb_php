import { useEffect, useState } from 'react';

import Imagen from './Imagen';

const PREDETERMINADA = {
    id: 'predeterminada',
    url: '/referencial.jpg',
    alt: 'Instalaciones de la IE Sebastián Lorente',
};

export default function GaleriaNosotros({ imagenes = [] }) {
    const lista = [PREDETERMINADA, ...imagenes];
    const total = lista.length;
    const [indice, setIndice] = useState(0);

    useEffect(() => {
        if (indice > total - 1) setIndice(0);
    }, [indice, total]);

    const anterior = () => setIndice((i) => (i - 1 + total) % total);
    const siguiente = () => setIndice((i) => (i + 1) % total);

    function alTeclado(evento) {
        if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            anterior();
        } else if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            siguiente();
        }
    }

    const actual = lista[indice] ?? lista[0];

    return (
        <div
            className="galeria-nosotros"
            role="region"
            aria-roledescription="carrusel"
            aria-label="Imágenes de la institución"
            tabIndex={0}
            onKeyDown={alTeclado}
        >
            <div className="gn-viewport">
                <div className="gn-slide activa" aria-live="polite">
                    <Imagen
                        key={actual?.id ?? indice}
                        src={actual?.url}
                        alt={actual?.alt || PREDETERMINADA.alt}
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {total > 1 && (
                <>
                    <button type="button" className="gn-nav gn-prev" onClick={anterior} aria-label="Imagen anterior">
                        <i className="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <button type="button" className="gn-nav gn-next" onClick={siguiente} aria-label="Imagen siguiente">
                        <i className="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                    <div className="gn-puntos">
                        {lista.map((imagen, i) => (
                            <button
                                key={imagen.id ?? i}
                                type="button"
                                className={`gn-punto${i === indice ? ' activo' : ''}`}
                                onClick={() => setIndice(i)}
                                aria-label={`Ir a la imagen ${i + 1} de ${total}`}
                                aria-current={i === indice ? 'true' : undefined}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
