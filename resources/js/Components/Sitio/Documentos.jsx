import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

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

export default function Documentos({ documentos = [] }) {
    const categorias = [...new Set(documentos.map((d) => d.categoria).filter(Boolean))].sort();

    return (
        <div className="doc2">
            <Reveal>
                <div className="doch">
                    <SectionHeader numeral="05" label="Recursos" title="Documentos" />
                </div>
            </Reveal>

            {documentos.length === 0 ? (
                <div className="docem">
                    <i
                        className="fas fa-folder-open"
                        style={{ fontSize: '3rem', color: 'var(--bo)', marginBottom: 12 }}
                    ></i>
                    <p>Próximamente encontrarás documentos y formatos disponibles para descargar.</p>
                </div>
            ) : (
                categorias.map((cat) => {
                    const docs = documentos.filter((d) => d.categoria === cat);
                    if (docs.length === 0) return null;
                    return (
                        <Reveal key={cat}>
                            <section className="doccat">
                                <div className="doccat-h">
                                    <h3>
                                        <i className="fas fa-folder-open" aria-hidden="true"></i> {cat}
                                    </h3>
                                </div>
                                <div className="doclist">
                                    {docs.map((doc) => {
                                        const nombre = doc.archivo?.nombre || 'documento';
                                        const url = doc.archivo?.url;
                                        if (!url) return null;
                                        const pdf = esPdf(nombre);
                                        const extLabel = (extension(nombre) || '').toUpperCase().slice(0, 4);
                                        return (
                                            <Reveal key={doc.id}>
                                                <div className="docitem">
                                                    <div className={`docitem-icono ${iconoClase(nombre)}`}>
                                                        <span className="diet">{extLabel}</span>
                                                    </div>
                                                    <div className="docitem-info">
                                                        <h4>{doc.titulo}</h4>
                                                        {doc.descripcion && <p>{doc.descripcion}</p>}
                                                        <span className="docitem-action">
                                                            {pdf ? 'Ver documento' : 'Descargar archivo'}
                                                        </span>
                                                        {doc.instrucciones && (
                                                            <span className="docitem-instr">{doc.instrucciones}</span>
                                                        )}
                                                    </div>
                                                    {pdf ? (
                                                        <a
                                                            className="docitem-btn"
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Ver
                                                        </a>
                                                    ) : (
                                                        <a className="docitem-btn" href={url} download={nombre}>
                                                            Descargar
                                                        </a>
                                                    )}
                                                </div>
                                            </Reveal>
                                        );
                                    })}
                                </div>
                            </section>
                        </Reveal>
                    );
                })
            )}
        </div>
    );
}
