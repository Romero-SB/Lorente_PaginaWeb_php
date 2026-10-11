import { Link } from '@inertiajs/react';

export default function NoticiaCard({ noticia }) {
    const img = (noticia.imagenes || [])[0] || null;
    const excerpt = (noticia.res || noticia.con || '').substring(0, 130);

    return (
        <Link
            className="nt"
            href={`/noticias/${noticia.slug}`}
            aria-label={`Ver noticia: ${noticia.titulo}`}
        >
            <div className="nt-img">
                {img ? (
                    <img src={img} alt="" />
                ) : (
                    <i className="fas fa-newspaper" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.3)' }}></i>
                )}
            </div>
            {noticia.cat && <span className="nt-tag">{noticia.cat}</span>}
            <div className="nt-ov">
                <h3 className="nt-ov-t">{noticia.titulo}</h3>
                {excerpt && <p className="nt-ov-x">{excerpt}…</p>}
            </div>
        </Link>
    );
}
