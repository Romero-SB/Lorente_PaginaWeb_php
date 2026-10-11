import { Head, Link } from '@inertiajs/react';

import NoticiaCard from '../../Components/Sitio/NoticiaCard';
import Reveal from '../../Components/Sitio/Reveal';
import SectionHeader from '../../Components/Sitio/SectionHeader';
import SitioLayout from '../../Layouts/SitioLayout';

function Paginacion({ paginador }) {
    const links = paginador?.links ?? [];
    if (links.length <= 3) return null;

    return (
        <nav className="paginacion" aria-label="Paginación de noticias">
            {links.map((link, i) => {
                if (link.url === null) {
                    return (
                        <span
                            key={i}
                            className="deshabilitada"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        className={link.active ? 'activa' : ''}
                        preserveScroll
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}

export default function Noticias({ noticias }) {
    const data = noticias?.data ?? [];
    const descripcion = 'Noticias, logros y comunicados oficiales de la IE N° 31501 Sebastián Lorente.';

    return (
        <>
            <Head title="Noticias">
                <meta name="description" content={descripcion} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Noticias · IE N° 31501 Sebastián Lorente" />
                <meta property="og:description" content={descripcion} />
                <meta property="og:image" content="/referencial.jpg" />
            </Head>

            <section className="seccion lista-noticias">
                <div className="ni2">
                    <Reveal>
                        <div className="nhd">
                            <SectionHeader numeral="04" label="Actualidad" title="Noticias y comunicados" />
                        </div>
                    </Reveal>

                    {data.length === 0 ? (
                        <div className="nem">
                            <i
                                className="fas fa-newspaper"
                                style={{ fontSize: '3rem', color: 'var(--bo)', marginBottom: 12 }}
                            ></i>
                            <p>Próximamente encontrarás noticias y comunicados oficiales.</p>
                        </div>
                    ) : (
                        <div className="ngr">
                            {data.map((n) => (
                                <Reveal key={n.id} className="rev-fill">
                                    <NoticiaCard noticia={n} />
                                </Reveal>
                            ))}
                        </div>
                    )}

                    <Paginacion paginador={noticias} />
                </div>
            </section>
        </>
    );
}

Noticias.layout = (page) => <SitioLayout>{page}</SitioLayout>;
