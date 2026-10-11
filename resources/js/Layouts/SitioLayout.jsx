import { usePage } from '@inertiajs/react';
import { createPortal } from 'react-dom';

import Footer from '../Components/Sitio/Footer';
import Recorrido3dButton from '../Components/Sitio/Recorrido3dButton';
import Sidebar from '../Components/Sitio/Sidebar';
import SitioHome from '../Components/Sitio/SitioHome';
import Toast from '../Components/Sitio/Toast';
import WhatsAppButton from '../Components/Sitio/WhatsAppButton';
import PanelLayout from './PanelLayout';

export default function SitioLayout({ children }) {
    const { component, props } = usePage();
    const sitio = props.sitio;
    const esPanel = typeof component === 'string' && component.startsWith('Panel/');
    const esLogin = component === 'Auth/Login';
    const esOverlay = esPanel || esLogin;

    return (
        <div className="sitio-root">
            <a href="#contenido-principal" className="skip-link">
                Saltar al contenido
            </a>

            <Sidebar />

            <main id="contenido-principal" className="main-content" tabIndex={-1}>
                {esOverlay ? sitio && <SitioHome {...sitio} /> : children}
                <Footer />
            </main>

            {esLogin && createPortal(children, document.body)}
            {esPanel && createPortal(<PanelLayout>{children}</PanelLayout>, document.body)}

            <Recorrido3dButton />
            <WhatsAppButton />
            {!esOverlay && <Toast />}
        </div>
    );
}
