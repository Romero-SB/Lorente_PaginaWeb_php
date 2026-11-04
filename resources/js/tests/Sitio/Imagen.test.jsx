import { render, screen } from '@testing-library/react';

import Imagen from '../../Components/Sitio/Imagen';

describe('Imagen', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('muestra el fallback cuando no hay src', () => {
        render(<Imagen src={null} fallback={<span>Sin imagen</span>} />);

        expect(screen.getByText('Sin imagen')).toBeInTheDocument();
    });

    test('quita el esqueleto cuando la imagen ya está completa en caché', () => {
        vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
        vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1200);

        const { container } = render(<Imagen src="/referencial.webp" alt="Galería" />);

        expect(container.querySelector('.img-sk')).not.toBeInTheDocument();
        expect(screen.getByAltText('Galería')).toBeInTheDocument();
    });

    test('muestra el fallback si la imagen en caché está rota', () => {
        vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
        vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);

        render(<Imagen src="/rota.webp" fallback={<span>Error</span>} />);

        expect(screen.getByText('Error')).toBeInTheDocument();
    });
});
