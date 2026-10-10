import EnConstruccion from '../../Components/Panel/EnConstruccion';
import PanelLayout from '../../Layouts/PanelLayout';

export default function Mensajes() {
    return (
        <EnConstruccion
            titulo="Bandeja de mensajes"
            descripcion="La bandeja de mensajes de contacto se implementa en la Fase 9."
        />
    );
}

Mensajes.layout = (page) => <PanelLayout children={page} />;