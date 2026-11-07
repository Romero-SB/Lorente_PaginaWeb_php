import { router } from '@inertiajs/react';

import { EVENTO_MINIMIZAR_PANEL, irASeccion } from '../../lib/sitio';

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
}));

describe('irASeccion', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
        vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(() => callback(0), 0));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('desplaza a la sección existente sin navegar', () => {
        const seccion = document.createElement('section');
        seccion.id = 'nosotros';
        document.body.appendChild(seccion);

        irASeccion('nosotros');

        expect(window.scrollTo).toHaveBeenCalledTimes(1);
        expect(router.visit).not.toHaveBeenCalled();
    });

    test('sin panel abierto navega al inicio cuando la sección no existe', () => {
        irASeccion('nosotros');

        expect(router.visit).toHaveBeenCalledWith('/', expect.any(Object));
    });

    test('con el panel abierto lo minimiza y espera a que aparezca la sección', async () => {
        const panel = document.createElement('div');
        panel.className = 'panel-capa';
        document.body.appendChild(panel);

        const alMinimizar = vi.fn();
        window.addEventListener(EVENTO_MINIMIZAR_PANEL, alMinimizar);

        irASeccion('nosotros');

        expect(alMinimizar).toHaveBeenCalledTimes(1);
        expect(router.visit).not.toHaveBeenCalled();

        const seccion = document.createElement('section');
        seccion.id = 'nosotros';
        document.body.appendChild(seccion);

        await vi.waitFor(() => expect(window.scrollTo).toHaveBeenCalledTimes(1));

        window.removeEventListener(EVENTO_MINIMIZAR_PANEL, alMinimizar);
    });
});
