import { createPortal } from 'react-dom';

import Footer from '../Components/Sitio/Footer';
import Recorrido3dButton from '../Components/Sitio/Recorrido3dButton';
import Sidebar from '../Components/Sitio/Sidebar';
import Toast from '../Components/Sitio/Toast';
import WhatsAppButton from '../Components/Sitio/WhatsAppButton';

export default function SitioLayout({ children, overlay, toastSitio = true }) {
    return (
        <div className="sitio-root">
            <Sidebar />
            <main className="main-content">
                {children}
                <Footer />
            </main>
            {overlay && createPortal(overlay, document.body)}
            <Recorrido3dButton />
            <WhatsAppButton />
            {toastSitio && <Toast />}
        </div>
    );
}
