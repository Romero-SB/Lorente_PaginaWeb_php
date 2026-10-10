import EnConstruccion from '../../Components/Panel/EnConstruccion';
import PanelLayout from '../../Layouts/PanelLayout';

export default function Cuentas() {
    return (
        <EnConstruccion
            titulo="Cuentas"
            descripcion="La gestión de cuentas (crear, resetear contraseñas) se implementa en la Fase 8."
        />
    );
}

Cuentas.layout = (page) => <PanelLayout children={page} />;