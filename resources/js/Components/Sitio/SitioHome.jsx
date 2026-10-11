import Contacto from './Contacto';
import Documentos from './Documentos';
import Hero from './Hero';
import Nosotros from './Nosotros';
import Noticias from './Noticias';

export default function SitioHome({ config, docentes, categorias_docentes, noticias, documentos }) {
    return (
        <>
            <section id="inicio" className="tab-content hero-sec">
                <Hero config={config} />
            </section>

            <section id="nosotros" className="seccion">
                <Nosotros docentes={docentes} categoriasDocentes={categorias_docentes} config={config} />
            </section>

            <section id="noticias" className="seccion">
                <Noticias noticias={noticias} />
            </section>

            <section id="documentos" className="seccion">
                <Documentos documentos={documentos} />
            </section>

            <section id="contacto" className="seccion">
                <Contacto config={config} />
            </section>
        </>
    );
}
