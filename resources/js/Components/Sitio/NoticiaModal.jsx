import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import NoticiaDetalle from './NoticiaDetalle';

export default function NoticiaModal({ noticia, onClose }) {
    const cerrarRef = useRef(null);

    useEffect(() => {
        const alPresionar = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', alPresionar);
        const overflowPrevio = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        cerrarRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', alPresionar);
            document.body.style.overflow = overflowPrevio;
        };
    }, [onClose]);

    const contenedor = document.querySelector('.sitio-root') ?? document.body;

    return createPortal(
        <div
            className="noticia-modal-capa"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="noticia-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Noticia: ${noticia.titulo}`}
            >
                <button
                    ref={cerrarRef}
                    type="button"
                    className="noticia-modal-cerrar"
                    onClick={onClose}
                    aria-label="Cerrar noticia"
                    title="Cerrar (Esc)"
                >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>

                <NoticiaDetalle noticia={noticia} variante="modal" />
            </div>
        </div>,
        contenedor,
    );
}
