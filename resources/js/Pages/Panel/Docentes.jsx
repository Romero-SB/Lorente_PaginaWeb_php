import EnConstruccion from '../../Components/Panel/EnConstruccion';
import PanelLayout from '../../Layouts/PanelLayout';

export default function Docentes() {
    return (
        <EnConstruccion
            titulo="Docentes"
            descripcion="El módulo de docentes (CRUD, foto con cropper, categorías, reorden) se implementa en la Fase 5."
        />
    );
}

Docentes.layout = (page) => <PanelLayout children={page} />;