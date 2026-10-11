import { irASeccion } from '../../lib/sitio';

export default function Hero({ config = {} }) {
    const estudiantes =
        config.estudiantes !== null && config.estudiantes !== undefined && config.estudiantes !== ''
            ? `+${config.estudiantes}`
            : '+300';
    const docentes =
        config.docentes_count !== null && config.docentes_count !== undefined && config.docentes_count !== ''
            ? `${config.docentes_count}+`
            : '25+';
    const fundacion = config.anio_fundacion || '1950';
    const niveles = config.niveles || '3';

    return (
        <div className="hi">
            <div>
                <span className="hb">
                    <i className="fas fa-map-pin"></i> Huancayo &middot; Junín &middot; Perú
                </span>
                <h1 className="h1x">
                    Formando <em>líderes</em>
                    <br />
                    con valores y
                    <br />
                    excelencia educativa
                </h1>
                <p className="hsu">
                    La IE N° 31501 Sebastián Lorente brinda educación integral a la comunidad de Huancayo,
                    cultivando el pensamiento crítico, los valores y la identidad andina.
                </p>
                <div className="hbt">
                    <button type="button" className="bpa" onClick={() => irASeccion('nosotros')}>
                        <i className="fas fa-graduation-cap"></i> Conócenos
                    </button>
                    <button type="button" className="bpb" onClick={() => irASeccion('contacto')}>
                        <i className="fas fa-envelope"></i> Contáctanos
                    </button>
                </div>
            </div>
            <div className="hst">
                <div className="hs">
                    <span className="hs-n">{estudiantes}</span>
                    <span className="hs-l">
                        <i className="fas fa-users"></i> Estudiantes
                    </span>
                </div>
                <div className="hs">
                    <span className="hs-n">{docentes}</span>
                    <span className="hs-l">
                        <i className="fas fa-chalkboard-teacher"></i> Docentes
                    </span>
                </div>
                <div className="hs">
                    <span className="hs-n">{fundacion}</span>
                    <span className="hs-l">
                        <i className="fas fa-calendar-alt"></i> Fundación
                    </span>
                </div>
                <div className="hs">
                    <span className="hs-n">{niveles}</span>
                    <span className="hs-l">
                        <i className="fas fa-layer-group"></i> Niveles
                    </span>
                </div>
            </div>
        </div>
    );
}
