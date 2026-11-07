import { render, screen } from '@testing-library/react';

import SitioLayout from '../../Layouts/SitioLayout';

const estado = vi.hoisted(() => ({ pagina: null }));

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
    usePage: () => estado.pagina,
}));

vi.mock('../../Layouts/PanelLayout', () => ({
    default: ({ children }) => <div data-testid="panel-layout">{children}</div>,
}));

vi.mock('../../Components/Sitio/SitioHome', () => ({
    default: () => <div data-testid="sitio-home" />,
}));

vi.mock('../../Components/Auth/AuthModal', () => ({ default: () => null }));
vi.mock('../../Components/Sitio/ComunicadoEmergente', () => ({ default: () => null }));
vi.mock('../../Components/Sitio/Footer', () => ({ default: () => null }));
vi.mock('../../Components/Sitio/Recorrido3dButton', () => ({ default: () => null }));
vi.mock('../../Components/Sitio/Sidebar', () => ({ default: () => null }));
vi.mock('../../Components/Sitio/Toast', () => ({ default: () => null }));
vi.mock('../../Components/Sitio/WhatsAppButton', () => ({ default: () => null }));

function paginaPanel(sitio) {
    return {
        component: 'Panel/Resumen',
        props: {
            auth: { user: { id: 1, name: 'Usuario' } },
            sitio,
        },
    };
}

describe('SitioLayout con panel abierto', () => {
    test('renderiza el sitio real detrás del panel', async () => {
        estado.pagina = paginaPanel({ config: {}, noticias: [] });

        render(
            <SitioLayout>
                <div>Contenido del panel</div>
            </SitioLayout>,
        );

        expect(await screen.findByTestId('sitio-home')).toBeInTheDocument();
        expect(await screen.findByTestId('panel-layout')).toBeInTheDocument();
        expect(screen.getByText('Contenido del panel')).toBeInTheDocument();
        expect(document.querySelector('.panel-fondo-sitio')).not.toBeInTheDocument();
    });

    test('usa la imagen de respaldo si el panel no recibe el sitio', async () => {
        estado.pagina = paginaPanel(null);

        render(
            <SitioLayout>
                <div>Contenido del panel</div>
            </SitioLayout>,
        );

        expect(await screen.findByTestId('panel-layout')).toBeInTheDocument();
        expect(document.querySelector('.panel-fondo-sitio')).toBeInTheDocument();
        expect(screen.queryByTestId('sitio-home')).not.toBeInTheDocument();
    });
});
