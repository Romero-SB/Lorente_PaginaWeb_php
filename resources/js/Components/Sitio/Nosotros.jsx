import Reveal from './Reveal';
import SectionHeader from './SectionHeader';
import Imagen from './Imagen';
import { estiloCategoria } from '../../lib/fuentes';

const HISTORIA = [
    {
        anio: '1846',
        titulo: 'Origen de la institución',
        texto: 'La investigación del profesor Rolando Aliaga Baldeón sitúa la fundación de la institución en el año 1846.',
    },
    {
        anio: '1905',
        titulo: 'Escuela Municipal',
        texto: 'Entre 1905 y 1914 funcionó como Escuela Municipal sostenida por el Consejo Huancaíno, bajo la dirección de los hermanos Ángel Alfredo Prialé y Sixto Prialé.',
    },
    {
        anio: '1915',
        titulo: 'Nuevas direcciones',
        texto: 'Aurelio Gurmendi Agüero dirige hasta 1917, y lo sucede Manuel Jesús Vera Ortiz hasta 1921.',
    },
    {
        anio: '1922',
        titulo: 'Centro Escolar Mixto',
        texto: 'Emilio Humareda asume la dirección. Se fusionan la escuela de varones 511 y la de mujeres 512 en el local de la calle Puno, y organiza por primera vez en Huancayo las Brigadas de Boys Scouts y Girls Scouts.',
    },
    {
        anio: '1952',
        titulo: 'Denominación oficial',
        texto: 'Por Resolución Ministerial N.° 0065, de 11 de noviembre de 1952, se otorga a la institución la denominación "Sebastián Lorente".',
    },
    {
        anio: '2011',
        titulo: 'Infraestructura actual',
        texto: 'Se consolida la infraestructura actual, con el esfuerzo de docentes, padres de familia y del entonces director Hugo R. Astuhuamán Inga.',
    },
];

const VALORES = ['Respeto', 'Responsabilidad', 'Solidaridad', 'Identidad cultural', 'Innovación', 'Excelencia'];

export default function Nosotros({ docentes = [], categoriasDocentes = [], config = {} }) {
    return (
        <>
            <div className="nosg">
                <Reveal>
                    <div className="nosv">
                        <Imagen src="/referencial.jpg" alt="Instalaciones de la IE Sebastián Lorente" loading="lazy" decoding="async" />
                    </div>
                </Reveal>
                <Reveal delay={120}>
                    <div>
                        <SectionHeader numeral="01" label="Quiénes somos" title="Una institución con historia y compromiso" />
                        <p className="sd">
                            La I.E. N° 31501 Sebastián Lorente es una institución pública ubicada en Huancayo, Junín.
                            Formamos ciudadanos íntegros comprometidos con su comunidad y el Perú.
                        </p>

                        <Reveal delay={140}>
                            <div>
                                <SectionHeader label="Valores" />
                                <ul className="vls">
                                    {VALORES.map((v) => (
                                        <li key={v}>{v}</li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                    </div>
                </Reveal>
            </div>

            {(config.mision || config.vision) && (
                <div className="mg">
                    {config.mision && (
                        <Reveal className="rev-fill">
                            <div className="mc">
                                <h3>Misión</h3>
                                <p>{config.mision}</p>
                            </div>
                        </Reveal>
                    )}
                    {config.vision && (
                        <Reveal className="rev-fill" delay={100}>
                            <div className="mc mc-vision">
                                <h3>Visión</h3>
                                <p>{config.vision}</p>
                            </div>
                        </Reveal>
                    )}
                </div>
            )}

            <section className="historia">
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                        <SectionHeader numeral="02" label="Nuestra Historia" title="Un legado desde 1846" align="center" />
                    </div>
                </Reveal>
                <div className="htg">
                    {HISTORIA.map((h) => (
                        <Reveal key={h.anio} className="rev-fill">
                            <div className="htc">
                                <div className="htc-anio">{h.anio}</div>
                                <h3>{h.titulo}</h3>
                                <p>{h.texto}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal delay={120}>
                    <p className="ht-extra">
                        Hoy la comunidad educativa lorentina goza de una infraestructura moderna —incluyendo un campo
                        deportivo multifuncional techado, sala de aeróbicos y cafetín/comedor— sin dejar de ser la I.E.
                        31501, con el legado de labor proficua de nuestros antecesores: ejemplo de trabajo, dedicación y
                        cariño por la niñez lorentina.
                    </p>
                </Reveal>
            </section>

            {categoriasDocentes.length > 0 && (
                <section className="plana-docente">
                    {categoriasDocentes.map((cat, idx) => {
                        const catDocs = docentes.filter((d) => d.categoria === cat.nombre);
                        if (catDocs.length === 0) return null;
                        return (
                            <div key={cat.nombre}>
                                <Reveal>
                                    <div style={{ textAlign: 'center', marginBottom: 10, marginTop: idx > 0 ? 60 : 0 }}>
                                        <SectionHeader numeral="03" label="Nuestro equipo" title={cat.nombre} align="center" />
                                    </div>
                                </Reveal>
                                <div className="pdg pdg-dynamic" style={estiloCategoria(cat.estilo)}>
                                    {catDocs.map((d) => (
                                        <Reveal key={d.id} className="rev-fill">
                                            <div className="pdc">
                                                <div className="pdc-img">
                                                    <Imagen
                                                        src={d.foto}
                                                        alt={d.nombre}
                                                        loading="lazy"
                                                        decoding="async"
                                                        fallback={
                                                            <i
                                                                className="fas fa-user"
                                                                style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.4)' }}
                                                            ></i>
                                                        }
                                                    />
                                                </div>
                                                <div className="pdc-txt">
                                                    <h3>{d.nombre}</h3>
                                                    <p>{d.cargo}</p>
                                                </div>
                                            </div>
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}
        </>
    );
}
