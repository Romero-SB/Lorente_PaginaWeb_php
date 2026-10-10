import EnConstruccion from '../../Components/Panel/EnConstruccion';
import PanelLayout from '../../Layouts/PanelLayout';

export default function Documentos() {
    return (
        <EnConstruccion
            titulo="Documentos"
            descripcion="El módulo de documentos (CRUD, público/privado, categorías) se implementa en la Fase 6."
        />
    );
}

Documentos.layout = (page) => <PanelLayout children={page} />;