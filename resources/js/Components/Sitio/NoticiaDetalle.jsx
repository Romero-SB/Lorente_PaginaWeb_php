import { useEffect, useRef, useState } from 'react';

import Tooltip from './Tooltip';

function extension(nombre) {
    return (nombre.split('.').pop() || '').toLowerCase();
}

function esPdf(nombre) {
    return extension(nombre) === 'pdf';
}

function iconoClase(nombre) {
    const e = extension(nombre);
    if (e === 'pdf') return 'pdf';
    if (['xlsx', 'xls', 'csv'].includes(e)) return e;
    if (['docx', 'doc'].includes(e)) return e;
    if (['pptx', 'ppt'].includes(e)) return e;
    return 'other';
}

function iconoFa(nombre) {
    const e = extension(nombre);
    const mapa = {
        pdf: 'fa-file-pdf',
        xlsx: 'fa-file-excel',
        xls: 'fa-file-excel',
        csv: 'fa-file-csv',
        docx: 'fa-file-word',
        doc: 'fa-file-word',
        pptx: 'fa-file-powerpoint',
        ppt: 'fa-file-powerpoint',
    };
    return mapa[e] || 'fa-file';
}

export default function NoticiaDetalle({ noticia }) {
    const imagenes = noticia.imagenes || [];
    const files = noticia.files || [];
    const [index, setIndex] = useState(0);
    const [fading, setFading] = useState(false);
    const intervalRef = useRef(null);

    const hasCarousel = imagenes.length > 1;
    const current = imagenes[index] || null;
    const next = hasCarousel ? imagenes[(index + 1) % imagenes.length] : null;

    useEffect(() => {
        if (!hasCarousel) return undefined;

        setIndex(0);
        intervalRef.current = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % imagenes.length);
                setFading(false);
            }, 500);
        }, 2500);

        return () => clearInterval(intervalRef.current);
    }, [noticia.id, hasCarousel, imagenes.length]);

    const goTo = (i) => {
        setIndex(i);
        setFading(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (hasCarousel) {
            intervalRef.current = setInterval(() => {
                setFading(true);
                setTimeout(() => {
                    setIndex((prev) => (prev + 1) % imagenes.length);
                    setFading(false);
                }, 500);
            }, 2500);
        }
    };

    return (
        <article className="nd-card">
            {current && (
                <>
                    <div className="nd-carousel-wrap">
                        {hasCarousel && fading && next && <img src={next} alt="" className="nd-carousel-img nd-img-in" />}
                        <img
                            src={current}
                            alt=""
                            className={`${hasCarousel ? 'nd-carousel-img' : 'nd-single-img'} ${
                                hasCarousel && fading ? 'nd-img-out' : 'nd-img-in'
                            }`}
                        />
                    </div>
                    {hasCarousel && (
                        <div className="nd-dots">
                            {imagenes.map((_, i) => (
                                <Tooltip key={i} text={`Ver imagen ${i + 1}`}>
                                    <button
                                        type="button"
                                        aria-label={`Ir a la imagen ${i + 1}`}
                                        className={`nd-dot ${i === index ? 'active' : ''}`}
                                        onClick={() => goTo(i)}
                                    ></button>
                                </Tooltip>
                            ))}
                        </div>
                    )}
                </>
            )}

            {noticia.cat && <span className="n-cat-badge">{noticia.cat}</span>}
            <h1 className="n-title-detail">{noticia.titulo}</h1>
            <p className="n-meta-detail">
                <i className="fas fa-calendar-days" style={{ marginRight: 5, color: 'var(--do)' }}></i> {noticia.fec} ·{' '}
                <i className="fas fa-user" style={{ marginRight: 4 }}></i>
                {noticia.aut || 'IE 31501'}
            </p>
            <div className="n-contenido">{noticia.con || noticia.res || ''}</div>

            <div className="n-attachments">
                <p className="n-att-title">Archivos adjuntos</p>
                {files.length > 0 ? (
                    <div className="n-att-list">
                        {files.map((f, i) => {
                            const pdf = esPdf(f.nombre);
                            const linkProps = pdf
                                ? { href: f.url, target: '_blank', rel: 'noopener noreferrer' }
                                : { href: f.url, download: f.nombre };
                            return (
                                <a key={i} className="n-file-card" {...linkProps}>
                                    <div className={`n-file-icon ${iconoClase(f.nombre)}`}>
                                        <i className={`fas ${iconoFa(f.nombre)}`}></i>
                                    </div>
                                    <div className="n-file-info">
                                        <span className="n-file-name">{f.nombre}</span>
                                        <span className="n-file-action">
                                            {pdf ? 'Ver documento' : 'Descargar archivo'}
                                        </span>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <p className="n-att-empty">Sin documentos adjuntos.</p>
                )}
            </div>
        </article>
    );
}
