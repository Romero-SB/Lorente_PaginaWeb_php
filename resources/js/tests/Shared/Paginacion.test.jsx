import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Paginacion from '../../Components/Shared/Paginacion';

const LINKS = [
    { url: '?page=1', label: '«', active: false },
    { url: '?page=1', label: '1', active: false },
    { url: '?page=2', label: '2', active: true },
    { url: '?page=3', label: '3', active: false },
    { url: null, label: '»', active: false },
];

describe('Paginacion', () => {
    test('no renderiza con tres o menos páginas', () => {
        render(<Paginacion links={[{ url: null, label: '1', active: true }]} onNavegar={vi.fn()} />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('navega al pulsar una página con url', async () => {
        const onNavegar = vi.fn();
        render(<Paginacion links={LINKS} onNavegar={onNavegar} />);
        await userEvent.click(screen.getByRole('button', { name: '2' }));
        expect(onNavegar).toHaveBeenCalledWith('?page=2');
    });

    test('deshabilita las páginas sin url', () => {
        render(<Paginacion links={LINKS} onNavegar={vi.fn()} />);
        expect(screen.getByRole('button', { name: '»' })).toBeDisabled();
    });
});