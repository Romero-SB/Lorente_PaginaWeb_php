import EnConstruccion from '../../Components/Panel/EnConstruccion';
import PanelLayout from '../../Layouts/PanelLayout';

export default function Configuracion() {
    return (
        <EnConstruccion
            titulo="Configuración"
            descripcion="Los datos institucionales y de contacto se implementan en la Fase 8."
        />
    );
}

Configuracion.layout = (page) => <PanelLayout children={page} />;