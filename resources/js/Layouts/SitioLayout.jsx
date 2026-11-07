import { router, usePage } from '@inertiajs/react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import '../../css/sitio.css';

import AuthModal from '../Components/Auth/AuthModal';
import ComunicadoEmergente from '../Components/Sitio/ComunicadoEmergente';
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
    const [loginAbierto, setLoginAbierto] = useState(() => props.abrir_panel === true && !usuario);
    const [panelMinimizado, setPanelMinimizado] = useState(false);
    const sitioVisible = !esPanel || panelMinimizado;

    const limpiarHash = useCallback(() => {
        if (window.location.hash === HASH_LOGIN) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, []);

    const cerrarLogin = useCallback(() => {
        setLoginAbierto(false);

        if (window.location.pathname === '/lorente-panel') {
            window.history.replaceState(null, '', '/');

            return;
        }

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

    // El panel avisa cuando cambia su estado (normal, maximizado o minimizado).
    // El contenido público solo se renderiza mientras el panel está minimizado.
    useEffect(() => {
        const alCambiarVista = (e) => setPanelMinimizado(e.detail === 'minimizado');
        window.addEventListener('lorente-panel-vista', alCambiarVista);
        return () => window.removeEventListener('lorente-panel-vista', alCambiarVista);
    }, []);

    useEffect(() => {
        if (props.abrir_panel === true && !usuario) {
            setLoginAbierto(true);
        }
    }, [props.abrir_panel, usuario]);

    return (
        <div className="sitio-root">
            <a href="#contenido-principal" className="skip-link">
                Saltar al contenido
            </a>

            <Sidebar sitioVisible={sitioVisible} />

            <main id="contenido-principal" className="main-content" tabIndex={-1}>
                {esAuth || (esPanel && panelMinimizado) ? sitio && <SitioHome {...sitio} /> : null}
                {esPanel && !panelMinimizado && <div className="panel-fondo-sitio" aria-hidden="true" />}
                {!esOverlay && children}
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

            {!esOverlay && <ComunicadoEmergente comunicado={props.comunicado} />}

            <Recorrido3dButton />
            <WhatsAppButton />
            {!esOverlay && <Toast />}
        </div>
    );
}
