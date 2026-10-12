import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from '../../Components/Shared/Modal';

describe('Modal', () => {
    test('abre un diálogo accesible con su contenido', () => {
        render(
            <Modal onCerrar={vi.fn()} ariaLabel="Confirmar">
                Contenido del diálogo
            </Modal>,
        );
        expect(screen.getByRole('dialog', { name: 'Confirmar' })).toBeInTheDocument();
        expect(screen.getByText('Contenido del diálogo')).toBeInTheDocument();
    });

    test('cierra al pulsar Escape', async () => {
        const onCerrar = vi.fn();
        render(<Modal onCerrar={onCerrar}>Contenido</Modal>);
        await userEvent.keyboard('{Escape}');
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    test('cierra al pulsar el fondo', async () => {
        const onCerrar = vi.fn();
        render(<Modal onCerrar={onCerrar}>Contenido</Modal>);
        await userEvent.click(screen.getByRole('dialog', { name: 'Ventana' }).parentElement);
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });
});