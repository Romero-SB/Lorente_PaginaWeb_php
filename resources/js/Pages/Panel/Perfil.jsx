import EnConstruccion from '../../Components/Panel/EnConstruccion';
import PanelLayout from '../../Layouts/PanelLayout';

export default function Perfil() {
    return (
        <EnConstruccion
            titulo="Mi perfil"
            descripcion="La edición de perfil y el cambio de contraseña se implementan en la Fase 8."
        />
    );
}

Perfil.layout = (page) => <PanelLayout children={page} />;