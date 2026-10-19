import { router, usePage } from '@inertiajs/react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import '../../css/sitio.css';

import AuthModal from '../Components/Auth/AuthModal';
import Footer from '../Components/Sitio/Footer';
import Recorrido3dButton from '../Components/Sitio/Recorrido3dButton';
import Sidebar from '../Components/Sitio/Sidebar';
import SitioHome from '../Components/Sitio/SitioHome';
import Toast from '../Components/Sitio/Toast';
import WhatsAppButton from '../Components/Sitio/WhatsAppButton';

const PanelLayout = lazy(() => import('./PanelLayout'));

const HASH_LOGIN = '#lorente-panel';
const COMPONENTES_AUTH = new Set([
    'Auth/Login',
    'Auth/ForgotPassword',
    'Auth/ResetPassword',
    'Auth/FirstPasswordChange',
]);

export default function SitioLayout({ children }) {
    const { component, props } = usePage();
    const sitio = props.sitio;
    const usuario = props.auth?.user ?? null;
    const esPanel = typeof component === 'string' && component.startsWith('Panel/');
    const esAuth = COMPONENTES_AUTH.has(component);
    const esOverlay = esPanel || esAuth;
    const [loginAbierto, setLoginAbierto] = useState(false);

    const limpiarHash = useCallback(() => {
        if (window.location.hash === HASH_LOGIN) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, []);

    const cerrarLogin = useCallback(() => {
        setLoginAbierto(false);
        limpiarHash();
    }, [limpiarHash]);

    useEffect(() => {
        const abrir = () => {
            if (usuario) {
                router.visit('/lorente-panel');
                return;
            }

            limpiarHash();
            setLoginAbierto(true);
        };

        const alCambiarHash = () => {
            if (window.location.hash === HASH_LOGIN) {
                abrir();
            }
        };

        window.addEventListener('hashchange', alCambiarHash);
        window.addEventListener('lorente-login-request', abrir);

        if (window.location.hash === HASH_LOGIN) {
            abrir();
        }

        return () => {
            window.removeEventListener('hashchange', alCambiarHash);
            window.removeEventListener('lorente-login-request', abrir);
        };
    }, [usuario, limpiarHash]);

    useEffect(() => {
        if (esOverlay) {
            setLoginAbierto(false);
        }
    }, [esOverlay]);

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
            {!esOverlay && loginAbierto && createPortal(<AuthModal actualizarUrl={false} onClose={cerrarLogin} />, document.body)}

            <Recorrido3dButton />
            <WhatsAppButton />
            {!esOverlay && <Toast />}
        </div>
    );
}
