import { Head, Link } from '@inertiajs/react';

import NoticiaCard from '../../Components/Sitio/NoticiaCard';
import NoticiaDetalle from '../../Components/Sitio/NoticiaDetalle';
import Reveal from '../../Components/Sitio/Reveal';
import SectionHeader from '../../Components/Sitio/SectionHeader';

export default function Noticia({ noticia, relacionadas = [] }) {
    const descripcion = (noticia.res || noticia.con || '').substring(0, 160);
    const imagen = (noticia.imagenes || [])[0] || '/referencial.jpg';
    const imagenAbsoluta = new URL(imagen, window.location.origin).href;

    return (
        <>
            <Head title={noticia.titulo}>
                <meta name="description" content={descripcion} />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={noticia.titulo} />
                <meta property="og:description" content={descripcion} />
                <meta property="og:image" content={imagenAbsoluta} />
                <meta property="article:published_time" content={noticia.fec} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <section className="seccion nd-page">
                <div className="ni2">
                    <Link className="nd-volver" href="/noticias">
                        <i className="fas fa-arrow-left"></i> Volver a noticias
                    </Link>

                    <Reveal>
                        <NoticiaDetalle noticia={noticia} />
                    </Reveal>

                    {relacionadas.length > 0 && (
                        <div style={{ marginTop: 64 }}>
                            <Reveal>
                                <div className="nhd">
                                    <SectionHeader label="Sigue leyendo" title="Más noticias" />
                                </div>
                            </Reveal>
                            <div className="ngr">
                                {relacionadas.map((n) => (
                                    <Reveal key={n.id} className="rev-fill">
                                        <NoticiaCard noticia={n} />
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

