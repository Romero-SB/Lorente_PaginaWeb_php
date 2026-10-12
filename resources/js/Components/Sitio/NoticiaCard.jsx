import { useState } from 'react';

import Imagen from './Imagen';
import NoticiaModal from './NoticiaModal';

export default function NoticiaCard({ noticia }) {
    const [abierto, setAbierto] = useState(false);
    const img = noticia.imagenes?.[0] || null;
    const excerpt = (noticia.res || noticia.con || '').substring(0, 130);

    return (
        <>
            <button
                type="button"
                className="nt"
                onClick={() => setAbierto(true)}
                aria-label={`Ver noticia: ${noticia.titulo}`}
                aria-haspopup="dialog"
            >
                <div className="nt-img">
                    <Imagen
                        src={img}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        fallback={
                            <i
                                className="fas fa-newspaper"
                                style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.3)' }}
                            ></i>
                        }
                    />
                </div>
                {noticia.cat && <span className="nt-tag">{noticia.cat}</span>}
                <div className="nt-ov">
                    <h3 className="nt-ov-t">{noticia.titulo}</h3>
                    {excerpt && <p className="nt-ov-x">{excerpt}…</p>}
                </div>
            </button>

            {abierto && <NoticiaModal noticia={noticia} onClose={() => setAbierto(false)} />}
        </>
    );
}
