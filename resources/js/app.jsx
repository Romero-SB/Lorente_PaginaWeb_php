import '../css/app.css';
import '../css/sitio.css';
import '../css/panel.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'IE 31501 Sebastián Lorente';
const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    resolve: (name) => pages[`./Pages/${name}.jsx`]().then((modulo) => modulo.default),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#1e3a8a',
    },
});
