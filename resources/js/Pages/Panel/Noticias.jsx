import EnConstruccion from '../../Components/Panel/EnConstruccion';
import PanelLayout from '../../Layouts/PanelLayout';

export default function Noticias() {
    return (
        <EnConstruccion
            titulo="Noticias"
            descripcion="El módulo de noticias (CRUD por rol, imágenes, adjuntos, papelera) se implementa en la Fase 4."
        />
    );
}

Noticias.layout = (page) => <PanelLayout children={page} />;