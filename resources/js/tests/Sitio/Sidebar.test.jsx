import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import Sidebar from '../../Components/Sitio/Sidebar';

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
    usePage: () => ({ url: '/' }),
}));

vi.mock('@google/model-viewer/dist/model-viewer-module.min.js', () => ({
    ModelViewerElement: class {
        static meshoptDecoderLocation = '';
    },
}));

describe('Sidebar logo 3D', () => {
    beforeEach(() => {
        vi.stubGlobal('IntersectionObserver', undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    test('muestra el spinner sin el logo estático al inicio', () => {
        const { container } = render(<Sidebar />);
        const logo = container.querySelector('.ne');

        expect(logo).toHaveAttribute('data-estado', 'cargando');
        expect(logo).toHaveAttribute('aria-busy', 'true');
        expect(container.querySelector('.ne-loader')).toBeInTheDocument();
        expect(container.querySelector('model-viewer')).not.toHaveAttribute('poster');
        expect(container.querySelector('model-viewer')).toHaveAttribute('src', '/LOGASO.v3.glb');
        expect(screen.getByRole('status')).toHaveAccessibleName('Cargando logo 3D');
    });

    test('muestra el modelo cuando termina de cargar', async () => {
        const { container } = render(<Sidebar />);
        const model = container.querySelector('model-viewer');

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const { ModelViewerElement } = await import('@google/model-viewer/dist/model-viewer-module.min.js');

        expect(self.ModelViewerElement).toBe(ModelViewerElement);
        expect(ModelViewerElement.meshoptDecoderLocation).toBe('/vendor/meshopt_decoder.js');

        fireEvent(model, new Event('load'));

        await waitFor(() => {
            expect(container.querySelector('.ne')).toHaveClass('ne-listo');
        });
        expect(container.querySelector('.ne-loader')).not.toBeInTheDocument();
    });

    test('usa el logo estático si el modelo tarda demasiado', () => {
        vi.useFakeTimers();
        const { container } = render(<Sidebar />);

        act(() => {
            vi.advanceTimersByTime(8000);
        });

        expect(container.querySelector('.ne')).toHaveClass('ne-fallback');
        expect(container.querySelector('.ne-loader')).not.toBeInTheDocument();
    });
});
