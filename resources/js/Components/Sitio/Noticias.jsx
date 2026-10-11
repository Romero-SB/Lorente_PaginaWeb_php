import { Link } from '@inertiajs/react';

import NoticiaCard from './NoticiaCard';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

export default function Noticias({ noticias = [] }) {
    return (
        <div className="ni2">
            <Reveal>
                <div className="nhd">
                    <SectionHeader numeral="04" label="Actualidad" title="Últimas noticias" />
                    <div className="nhd-acciones">
                        <Link className="nhd-ver" href="/noticias">
                            Ver todas <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </Reveal>
            <div className="ngr">
                {noticias.length === 0 ? (
                    <div className="nem">
                        <i
                            className="fas fa-newspaper"
                            style={{ fontSize: '3rem', color: 'var(--bo)', marginBottom: 12 }}
                        ></i>
                        <p>Próximamente encontrarás noticias y comunicados oficiales.</p>
                    </div>
                ) : (
                    noticias.map((n) => (
                        <Reveal key={n.id} className="rev-fill">
                            <NoticiaCard noticia={n} />
                        </Reveal>
                    ))
                )}
            </div>
        </div>
    );
}
