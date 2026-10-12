import { usePage } from '@inertiajs/react';
import { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';

import '../../css/sitio.css';

import Footer from '../Components/Sitio/Footer';
import Recorrido3dButton from '../Components/Sitio/Recorrido3dButton';
import Sidebar from '../Components/Sitio/Sidebar';
import SitioHome from '../Components/Sitio/SitioHome';
import Toast from '../Components/Sitio/Toast';
import WhatsAppButton from '../Components/Sitio/WhatsAppButton';

const PanelLayout = lazy(() => import('./PanelLayout'));

export default function SitioLayout({ children }) {
    const { component, props } = usePage();
    const sitio = props.sitio;
    const esPanel = typeof component === 'string' && component.startsWith('Panel/');
    const esAuth = component === 'Auth/Login' || component === 'Auth/FirstPasswordChange';
    const esOverlay = esPanel || esAuth;

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

            {esAuth && createPortal(children, document.body)}
            {esPanel && (
                createPortal(
                    <Suspense fallback={null}>
                        <PanelLayout>{children}</PanelLayout>
                    </Suspense>,
                    document.body,
                )
            )}

            <Recorrido3dButton />
            <WhatsAppButton />
            {!esOverlay && <Toast />}
        </div>
    );
}
